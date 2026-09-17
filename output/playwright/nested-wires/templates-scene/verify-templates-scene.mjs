/** M6 STOP-capable public-output audit. Node owns failed assertions; correct inputs and rerun.
 * Deliberately exits 1 for the recorded invariant failures. Certification/browser/ops gates
 * must still be implemented after the frozen-geometry blocker is resolved.
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createNestedRoadScene, inspectNestedWires } from '../../../../capability/layout/contract/index.ts';

const directory = new URL('./', import.meta.url);
const spec = JSON.parse(readFileSync(new URL('scene-spec.json', directory), 'utf8'));
const stages = [];
const scene = createNestedRoadScene({ spec, measure: (stage, run) => { stages.push(stage); return run(); } });
function check(name, operation) {
  try { operation(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); process.exitCode = 1; }
}
const finite = item => Object.values(item.bounds).every(Number.isFinite);
const contains = (outer, inner) => inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
check('16 nodes / 9 sections; every node and child inside its owner; finite bounds', () => {
  assert.equal(scene.nodes.length, 16);
  assert.equal(scene.sections.length, 9);
  assert([...scene.nodes, ...scene.sections, ...scene.roads].every(finite));
  scene.nodes.forEach(node => assert(contains(scene.sections.find(section => section.id === node.sectionId).bounds, node.bounds)));
  scene.sections.filter(section => section.parentSectionId !== null).forEach(section => assert(contains(scene.sections.find(parent => parent.id === section.parentSectionId).bounds, section.bounds)));
});
check('minimal nested-only regression and explicit empty-section rejection', () => {
  const regression = createNestedRoadScene({ spec: { sections: [{ number: 1, nodes: [], children: [{ number: 2, nodes: [{ number: 1, label: 'child.ts' }], children: [] }] }], requests: [] } });
  assert([...regression.nodes, ...regression.sections, ...regression.roads].every(finite));
  assert.throws(() => createNestedRoadScene({ spec: { sections: [{ number: 1, nodes: [], children: [] }], requests: [] } }), RangeError);
});
check('two complete builds byte-identical; each one-way pipeline stage once', () => {
  assert.equal(JSON.stringify(scene), JSON.stringify(createNestedRoadScene({ spec })));
  assert.equal(stages.length, new Set(stages).size);
  assert.deepEqual(stages, ['capacity', 'nodes', 'ports', 'topology', 'wire-registry', ...spec.requests.map((_, index) => `wire:w${String(index + 1).padStart(2, '0')}`), 'lane-allocation', 'main-roads', 'driveways', 'network', 'lane-projection']);
});
console.log(`STAGES ${JSON.stringify(stages)}`);
assert(scene.wiring.ok, JSON.stringify(scene.wiring));
const wires = scene.wiring.value;
check('all 29 value wires route ok:true', () => assert.equal(wires.length, 29));
const inspection = inspectNestedWires(scene, wires);
console.log(`INSPECTION ${JSON.stringify(inspection)}`);
check('all wires inside corridors; gate-mouth crossings only; no body or continuity failures', () => {
  assert.deepEqual(inspection, { corridors: [], nodeBodies: [], boundaries: [], continuity: [] });
});
function intersection(a, b) {
  const x0 = Math.max(Math.min(a.from.x, a.to.x), Math.min(b.from.x, b.to.x));
  const x1 = Math.min(Math.max(a.from.x, a.to.x), Math.max(b.from.x, b.to.x));
  const y0 = Math.max(Math.min(a.from.y, a.to.y), Math.min(b.from.y, b.to.y));
  const y1 = Math.min(Math.max(a.from.y, a.to.y), Math.max(b.from.y, b.to.y));
  if (x0 > x1 || y0 > y1) return null;
  return { x: x0, y: y0, length: x1 - x0 + y1 - y0 };
}
const pairs = items => items.flatMap((a, index) => items.slice(index + 1).map(b => [a, b]));
function overlapWitness(a, b, first, second) {
  const hit = intersection(first, second);
  if (!hit || hit.length === 0) return [];
  return [{ wires: [a.id, b.id], hit, first, second }];
}
const overlaps = pairs(wires).flatMap(([a, b]) => a.segments.flatMap(first => b.segments.flatMap(second => overlapWitness(a, b, first, second))));
console.log(`OVERLAPS ${JSON.stringify(overlaps)}`);
check('zero positive-length parallel/coincident wire overlaps', () => assert.equal(overlaps.length, 0));
function witness(id) {
  const [wireId, number] = id.split(':');
  const wire = wires.find(item => item.id === wireId);
  const segment = wire.segments[Number(number) - 1];
  return { id, from: wire.from, to: wire.to, segment, road: scene.roads.find(road => road.id === segment.corridorId) };
}
const failure = { inspection, overlaps, corridorWitnesses: inspection.corridors.map(witness), boundaryWitnesses: inspection.boundaries.map(witness), stages };
writeFileSync(new URL('invariant-failures.json', directory), JSON.stringify(failure, null, 2) + '\n');
console.log('STOP DoD 4: containment and overlap gates fail before crossing certification. No acceptance claim.');
