/** Amendments 2–3 evidence: observe retained adjustments without admitting unsupported templates. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import * as ordinary from '../../../../capability/layout/contract/index.ts';

const root = 'output/playwright/nested-wires/';
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('tsx/package.json'))('esbuild');
const marker = 'next.map((c) => forwardConnection(c, t, joins.at(-1) ?? source))';
const replacement = `next.map((c) => {
      const previous = joins.at(-1) ?? source;
      const adjusted = forwardConnection(c, t, previous);
      if (adjusted !== c) globalThis.__incrementATemplates.push({
        wireId: wire.id, travelOrdinal: i, sourceSegmentOrdinal: t.first,
        incoming: t, outgoing: travels[i + 1], previous,
        nominal: c, adjusted,
      });
      return adjusted;
    })`;
const bundle = await build({
  stdin: {
    contents: "export { createNestedRoadScene } from './capability/layout/contract/index.ts';",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false,
  plugins: [{ name: 'observe-retained-adjustments', setup(builder) {
    builder.onLoad({ filter: /nested-lane-projection\.ts$/ }, ({ path }) => {
      const source = readFileSync(path, 'utf8');
      assert.equal(source.split(marker).length, 2, 'exactly one observation site');
      return { contents: source.replace(marker, replacement), loader: 'ts', resolveDir: dirname(path) };
    });
  } }],
});
const observed = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const axis = (travel) => travel.road.axis === 'horizontal' ? 'x' : 'y';
const inside = (p, b) => p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;
const path = (connection) => [connection.from, ...(connection.via ?? []), connection.to];
const pieces = (connection) => path(connection).slice(1).map((to, i) => ({ from: path(connection)[i], to }))
  .filter(({ from, to }) => from.x !== to.x || from.y !== to.y);
const resolution = (supported) => supported ? 'supported-orthogonal-forward-stem' : 'unsupported-retained-adjustment';
const consequence = (supported) => supported ? 'current-adjusted-geometry-preserved' : 'cannot-admit-current-adjustment';
const shape = (singleBend) => singleBend ? 'single-bend' : 'two-column-median';
function classify(observation, scene) {
  const { incoming, outgoing, previous, nominal, adjusted } = observation;
  const along = axis(incoming), across = along === 'x' ? 'y' : 'x';
  const nominalAnchor = nominal.from[along];
  const requiredAnchor = previous.to[along] + incoming.direction * 1.5;
  const deficit = incoming.direction * (requiredAnchor - nominalAnchor);
  assert(deficit > 0, 'every adjusted template records its positive nominal deficit');
  const emitted = pieces(adjusted);
  const orthogonal = emitted.every(({ from, to }) => from.x === to.x || from.y === to.y);
  const straightStem = incoming.direction * (adjusted.from[along] - previous.to[along]);
  const backwardReach = Math.max(0, ...emitted.map(({ from, to }) =>
    -incoming.direction * (to[along] - from[along])));
  const forward = emitted.every(({ from, to }) =>
    incoming.direction * (to[along] - from[along]) >= 0 &&
    outgoing.direction * (to[across] - from[across]) >= 0);
  const wire = scene.wiring.value.find((item) => item.id === observation.wireId);
  const emission = emitted.map((piece) => {
    const matches = wire.segments.flatMap((segment, index) =>
      JSON.stringify({ from: segment.from, to: segment.to }) === JSON.stringify(piece) ? [{ segment, ordinal: index + 1 }] : []);
    assert.equal(matches.length, 1, 'each nonzero adjusted piece has one exact ordinary emitted segment');
    const [{ segment, ordinal }] = matches;
    const owner = scene.roads.find((road) => road.id === segment.corridorId);
    return { ordinal, segment, ownerContainsPiece: [segment.from, segment.to].every((p) => inside(p, owner.bounds)) };
  });
  const singleBend = nominal.via.length === 1;
  const supported = singleBend && orthogonal && forward && straightStem >= 1.5 && emission.every((e) => e.ownerContainsPiece);
  return {
    wireId: observation.wireId, travelOrdinal: observation.travelOrdinal,
    sourceSegmentOrdinal: observation.sourceSegmentOrdinal,
    nominalAnchor, requiredAnchor, deficit,
    resolutionTemplate: resolution(supported),
    byteIdentityConsequence: consequence(supported),
    templateShape: shape(singleBend),
    orthogonal, forward, straightStem, backwardReach, emission,
    provenance: { incomingOwner: incoming.road.sectionId, incomingAxis: incoming.road.axis,
      outgoingOwner: outgoing.road.sectionId, outgoingAxis: outgoing.road.axis },
    observation,
  };
}
function run(spec) {
  globalThis.__incrementATemplates = [];
  const scene = observed.createNestedRoadScene({ spec });
  assert(scene.wiring.ok, 'routing fixture is built, without claiming legality');
  const plain = ordinary.createNestedRoadScene({ spec });
  assert.equal(JSON.stringify(scene), JSON.stringify(plain), 'observer preserves full ordinary serialization');
  return {
    ordinarySceneSha256: hash(plain), instrumentedSceneSha256: hash(scene),
    adjustments: globalThis.__incrementATemplates.map((item) => classify(item, plain)),
  };
}
const read = (file) => JSON.parse(readFileSync(root + file, 'utf8'));
const specs = { default: ordinary.defaultNestedSceneSpec, hub: ordinary.fanInHubSceneSpec,
  templates: read('templates-scene/scene-spec.json'), scale: read('scale-scene/scale-scene-spec.json'),
  authoring: read('authoring-scene/scene-spec.json') };
const scenes = Object.fromEntries(Object.entries(specs).map(([name, spec]) => {
  const first = run(spec), second = run(spec);
  assert.equal(JSON.stringify(first), JSON.stringify(second), `${name}: two byte-identical observations`);
  return [name, { ...first, ordinaryByteEqual: true, twiceDeterministic: true }];
}));
assert.equal(scenes.default.adjustments.length, 0);
assert.equal(scenes.hub.adjustments.length, 1);
const [hub] = scenes.hub.adjustments;
assert.equal(hub.wireId, 'w23');
assert.equal(hub.nominalAnchor, 633);
assert.equal(hub.requiredAnchor, 640.5);
assert.equal(hub.deficit, 7.5);
assert.equal(hub.resolutionTemplate, 'supported-orthogonal-forward-stem');
const unresolved = Object.entries(scenes).flatMap(([scene, result]) => result.adjustments
  .filter((item) => item.resolutionTemplate === 'unsupported-retained-adjustment')
  .map((item) => ({ scene, wireId: item.wireId, sourceSegmentOrdinal: item.sourceSegmentOrdinal,
    code: 'unsupported-support', reason: item.orthogonal ? 'not-an-admitted-forward-stem' : 'diagonal-median-clamp',
    nominalAnchor: item.nominalAnchor, requiredAnchor: item.requiredAnchor, deficit: item.deficit,
    backwardReach: item.backwardReach,
    resolutionTemplate: item.resolutionTemplate, byteIdentityConsequence: item.byteIdentityConsequence })));
assert.deepEqual(unresolved.filter((item) => item.scene !== 'authoring'), [],
  'STOP: unsupported adjustment in a retained legal scene');
const backward = unresolved.filter((item) => item.reason === 'not-an-admitted-forward-stem');
assert.deepEqual(backward.map(({ wireId, deficit, backwardReach }) => ({ wireId, deficit, backwardReach })), [
  { wireId: 'w22', deficit: 117.5, backwardReach: 15.5 },
  { wireId: 'w41', deficit: 151.5, backwardReach: 97.5 },
  { wireId: 'w73', deficit: 43.5, backwardReach: 1.5 },
  { wireId: 'w85', deficit: 55.5, backwardReach: 7.5 },
]);
assert.deepEqual(unresolved.filter((item) => item.reason === 'diagonal-median-clamp')
  .map((item) => item.wireId), ['w03', 'w23']);
const report = {
  status: 'authoring-expansion-requirements-recorded',
  scope: 'Read-only Amendments 2–3 diagnostic. Unsupported authoring adjustments are unresolved B/C expansion requirements, never admitted templates. Not a public support ledger or complete graph admission; no legality claim.',
  scenes, unresolved,
};
writeFileSync(root + 'embedding/increment-a-template-gate.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, scenes: Object.fromEntries(Object.entries(scenes)
  .map(([name, result]) => [name, { adjustments: result.adjustments.length, ordinaryByteEqual: result.ordinaryByteEqual, twiceDeterministic: result.twiceDeterministic }])), unresolved }, null, 2));
delete globalThis.__incrementATemplates;
