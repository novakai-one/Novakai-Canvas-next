/** Read-only STOP witness: observe the existing projector without changing its output. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import * as ordinary from '../../../../capability/layout/contract/index.ts';
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('tsx/package.json'))('esbuild');
const marker = '  return {\n    ...c,\n    from: { ...c.from, [axis]: start },';
const observation = `  globalThis.__supportObservations.push({
    wireId: t.wireId, sourceSegmentOrdinal: t.first, lane: t.lane,
    road: t.road, direction: t.direction, axis, previous,
    nominal: c, requiredStart: start, deficit: t.direction * (start - c.from[axis])
  });\n`;
const bundle = await build({
  stdin: { contents: "export { createNestedRoadScene } from './capability/layout/contract/index.ts';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false,
  plugins: [{ name: 'observe-existing-clamp', setup(builder) {
    builder.onLoad({ filter: /nested-lane-projection\.ts$/ }, ({ path }) => {
      const source = readFileSync(path, 'utf8');
      assert.equal(source.split(marker).length, 2, 'exactly one observation site');
      return { contents: source.replace(marker, observation + marker), loader: 'ts', resolveDir: dirname(path) };
    });
  } }],
});
const observed = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const hash = (text) => createHash('sha256').update(text).digest('hex');
function run(spec) {
  globalThis.__supportObservations = [];
  const stages = new Map();
  const scene = observed.createNestedRoadScene({ spec, measure(stage, operation) {
    const value = operation();
    stages.set(stage, value);
    return value;
  } });
  const serialized = JSON.stringify(scene);
  assert.equal(serialized, JSON.stringify(ordinary.createNestedRoadScene({ spec })), 'observation preserves every ordinary byte');
  return { scene, stages, observations: globalThis.__supportObservations, sceneSha256: hash(serialized) };
}
const controls = Object.entries({ default: ordinary.defaultNestedSceneSpec, hub: ordinary.fanInHubSceneSpec }).map(([name, spec]) => {
  const first = run(spec), second = run(spec);
  assert.deepEqual(first.observations, second.observations, `${name}: deterministic observations`);
  assert.equal(first.sceneSha256, second.sceneSha256, `${name}: deterministic scene`);
  return [name, first];
});
const { default: defaultRun, hub } = Object.fromEntries(controls);
assert.equal(defaultRun.observations.length, 0);
assert.equal(hub.observations.length, 1);
const [witness] = hub.observations;
const travels = hub.stages.get('lane-allocation').byWire.get(witness.wireId);
const index = travels.findIndex((travel) => travel.first === witness.sourceSegmentOrdinal);
const neighborhood = travels.slice(index - 1, index + 2);
const placement = hub.stages.get('nodes').find((item) => item.section.id === witness.road.sectionId);
const currentRoads = new Map(hub.scene.roads.map((road) => [road.id, road]));
const center = (road) => road.axis === 'horizontal' ? road.bounds.y + road.bounds.height / 2 : road.bounds.x + road.bounds.width / 2;
const incoming = neighborhood[0], outgoing = neighborhood[2];
assert.equal(witness.road.axis, 'vertical');
assert.equal(center(witness.road), placement.interior.x, 'construction frame-left identity');
assert.equal(center(outgoing.road), placement.interior.y + placement.interior.height / placement.size.rows, 'construction first row boundary');
assert.equal(incoming.road.access.nodeId, placement.section.id, 'incoming retained gate identity');
const contactPairs = [[incoming.road.id, witness.road.id], [witness.road.id, outgoing.road.id]];
const contacts = contactPairs.map((ids) => {
  const matches = hub.stages.get('topology').contacts.filter((contact) => [contact.a.id, contact.b.id].every((id) => ids.includes(id)));
  assert.equal(matches.length, 1, 'one construction contact for each transition');
  return matches[0];
});
assert.equal(witness.previous.to.y, 639);
assert.equal(witness.nominal.from.y, 633);
assert.equal(witness.requiredStart, 640.5);
assert.equal(witness.deficit, 7.5);
const report = {
  status: 'STOP-support-template-ratification',
  scope: 'Read-only diagnostic, not the public Increment A ledger or full constraint-graph admission',
  controls: controls.map(([name, value]) => ({ name, sceneSha256: value.sceneSha256, observationCount: value.observations.length, twiceDeterministic: true, ordinaryByteEqual: true })),
  constraint: { code: 'support-template-decision', axis: witness.axis, direction: witness.direction,
    previousEnd: witness.previous.to.y, nominalStart: witness.nominal.from.y, minimumStem: 1.5,
    requiredStart: witness.requiredStart, nominalTemplateDeficit: witness.deficit,
    logicalKeys: { incoming: { owner: placement.section.id, portId: incoming.road.access.portId },
      travel: { owner: placement.section.id, axis: 'vertical', kind: 'frame-left', ordinal: 0 },
      outgoing: { owner: placement.section.id, axis: 'horizontal', kind: 'row-boundary', ordinal: 1 } },
    identityEvidence: 'Keys verified from construction placement fields; numeric road IDs were not parsed. This is the witness only, not a complete merged-provenance ledger.' },
  witness, retainedNeighborhood: neighborhood, constructionContacts: contacts,
  finalRoads: neighborhood.map((travel) => currentRoads.get(travel.road.id)),
  ordinaryWire: hub.scene.wiring.value.find((wire) => wire.id === witness.wireId),
  decision: 'Does support compilation fix the nominal turn anchor, or admit the existing non-median forward adjustment as a supported retained template? The latter needs an explicit admissibility rule; the former binds hub. Neither interpretation is selected here.',
};
writeFileSync('output/playwright/nested-wires/embedding/increment-a-support-stop.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, controls: report.controls, constraint: report.constraint }, null, 2));
delete globalThis.__supportObservations;
