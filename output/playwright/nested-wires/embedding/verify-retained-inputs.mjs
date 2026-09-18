/** Public builder input audit only; this is not the public support preflight or graph admission. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createNestedRoadScene, defaultNestedSceneSpec, fanInHubSceneSpec } from '../../../../capability/layout/contract/index.ts';

const root = 'output/playwright/nested-wires/';
const read = (file) => JSON.parse(readFileSync(root + file, 'utf8'));
const specs = {
  default: defaultNestedSceneSpec,
  hub: fanInHubSceneSpec,
  templates: read('templates-scene/scene-spec.json'),
  scale: read('scale-scene/scale-scene-spec.json'),
  authoring: read('authoring-scene/scene-spec.json'),
};
const inside = (b, c) => [b.x >= c.x, b.y >= c.y,
  b.x + b.width <= c.x + c.width, b.y + b.height <= c.y + c.height].every(Boolean);
function ownedSpill(road, sections) {
  const owner = sections.get(road.sectionId);
  if (owner === undefined) return false;
  return !inside(road.bounds, owner.bounds);
}
function spills(scene) {
  const sections = new Map(scene.sections.map((section) => [section.id, section]));
  return scene.roads.filter((road) => road.kind === 'street')
    .filter((road) => ownedSpill(road, sections)).map((road) => road.id);
}
function demandRows(scene, allocation) {
  return scene.roads.map((road) => {
    const travels = [...allocation.byWire.values()].flat().filter((t) => t.road.id === road.id);
    const count = allocation.demand.get(road.id) ?? 0;
    assert.equal(travels.length, count, 'both directions and repeated visits contribute demand');
    assert.equal(road.wireLaneCount, count);
    const width = road.bounds[road.axis === 'horizontal' ? 'height' : 'width'];
    assert.equal(width, 12 + 12 * count);
    return { roadId: road.id, demand: count, width,
      positive: travels.filter((t) => t.direction === 1).length,
      negative: travels.filter((t) => t.direction === -1).length };
  });
}
function verifyRanks(allocation) {
  const travels = [...allocation.byWire.values()].flat();
  const groups = Map.groupBy(travels, (t) => JSON.stringify([t.road.id, t.direction]));
  groups.forEach((group) => {
    assert.deepEqual(group.map((t) => t.lane.index).toSorted((a, b) => a - b),
      Array.from({ length: group.length }, (_, i) => i));
    assert(group.every((t) => t.count === group.length));
  });
  assert.equal(new Set(travels.map((t) => JSON.stringify([t.wireId, t.first]))).size, travels.length);
  return travels;
}
function expectedSpills(name, scene) {
  if (name === 'authoring') return spills(scene);
  const baseline = JSON.parse(gunzipSync(readFileSync(root + `ownership/${name}-baseline.json.gz`)));
  return spills(baseline);
}
function run(name, spec) {
  const stages = new Map();
  const scene = createNestedRoadScene({ spec, measure: (stage, execute) => {
    const value = execute(); stages.set(stage, value); return value;
  } });
  assert.equal(JSON.stringify(scene), JSON.stringify(createNestedRoadScene({ spec })));
  assert(scene.wiring.ok);
  const allocation = stages.get('lane-allocation');
  const travels = verifyRanks(allocation);
  const contacts = stages.get('topology').contacts;
  const contactKeys = contacts.map((c) => JSON.stringify([c.a.id, c.b.id].toSorted()));
  assert.equal(new Set(contactKeys).size, contacts.length, 'construction pairs accounted once');
  const population = demandRows(scene, allocation);
  const envelopeSpills = spills(scene);
  assert.deepEqual(envelopeSpills, expectedSpills(name, scene));
  const gateTraversals = scene.wiring.value.flatMap((wire) => wire.gates);
  return { scope: 'Retained input counts, not complete graph admission', T: travels.length,
    C: contacts.length, G: new Set(gateTraversals).size, gateTraversals: gateTraversals.length,
    V: null, E: null, population, envelopeSpills, contacts: contactKeys };
}
const scenes = Object.fromEntries(Object.entries(specs).map(([name, spec]) => {
  const result = run(name, spec);
  assert.equal(JSON.stringify(result), JSON.stringify(run(name, spec)), 'twice deterministic');
  return [name, result];
}));
assert.deepEqual(Object.values(scenes).map((scene) => scene.T), [93, 146, 233, 333, 918]);
assert.deepEqual(Object.values(scenes).slice(0, 4).map((scene) => scene.envelopeSpills.length), [0, 0, 13, 7]);
assert([252, 336, 480].every((width) => scenes.authoring.population.some((road) => road.width === width)));
writeFileSync(root + 'embedding/increment-a-retained-inputs.json', JSON.stringify(scenes, null, 2) + '\n');
console.log(Object.fromEntries(Object.entries(scenes).map(([name, scene]) => [name,
  { T: scene.T, C: scene.C, G: scene.G, gateTraversals: scene.gateTraversals, spills: scene.envelopeSpills.length }])));
