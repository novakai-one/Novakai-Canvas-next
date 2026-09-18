/** Read-only C STOP evidence. Observes the ordinary builder; never changes projection policy. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import * as api from '../../../../capability/layout/contract/index.ts';

const root = 'output/playwright/nested-wires/';
const json = JSON.stringify;
const read = p => JSON.parse(readFileSync(root + p));
const hash = value => createHash('sha256').update(json(value)).digest('hex');
const baseline = name => JSON.parse(gunzipSync(readFileSync(root + `embedding/increment-b-${name}-active.json.gz`)));
const receipts = {};
const scenes = new Map();
for (const name of ['default', 'hub', 'templates', 'scale', 'authoring']) {
  const saved = baseline(name);
  const scene = api.createNestedRoadScene({ spec: saved.spec });
  assert.equal(json(scene), json(api.createNestedRoadScene({ spec: saved.spec })), `${name}: complete rebuild twice`);
  assert.equal(json(scene), json(saved.result.value.scene), `${name}: accepted B bytes`);
  receipts[name] = { twiceByteIdentical: true, equalsAcceptedB: true, sha256: hash(scene) };
  scenes.set(name, scene);
}

const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('tsx/package.json'))('esbuild');
const bundle = await build({
  stdin: { contents: "export {createNestedRoadScene} from './capability/layout/contract/index.ts';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false,
  plugins: [{ name: 'observe-final-supports', setup(builder) {
    builder.onLoad({ filter: /nested-lane-projection\.ts$/ }, ({ path }) => {
      const source = readFileSync(path, 'utf8');
      const marker = '  const byRoad = junctionIndex(junctions);';
      assert.equal(source.split(marker).length, 2);
      return { loader: 'ts', contents: source.replace(marker, marker + '\n globalThis.__incrementCSupports = readNestedProjectionSupports(wires, byWire, roads);') };
    });
  } }],
});
const observed = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const scene = scenes.get('authoring');
assert.equal(json(observed.createNestedRoadScene({ spec: baseline('authoring').spec })), json(scene));
const supports = globalThis.__incrementCSupports;
delete globalThis.__incrementCSupports;

const source = readFileSync(root + 'ownership/verify.mjs', 'utf8');
const verifier = execFileSync('git', ['show', '1ff0be8:' + root + 'templates-scene/verify-templates-scene.mjs'], { encoding: 'utf8' });
const helpers = source.slice(source.indexOf('const inside ='), source.indexOf('function metadataChanges'));
const details = runInNewContext(helpers + ';({catalogs:catalogs(scene),...supplementary(scene)});', { verifier, scene, assert, runInNewContext, json });
const inspection = api.inspectNestedWires(scene, scene.wiring.value);
assert.deepEqual(inspection, { corridors: ['w84:6', 'w84:7'], nodeBodies: [], boundaries: [], continuity: [] });
const counts = { corridors: inspection.corridors.length, bodies: inspection.nodeBodies.length, boundaries: inspection.boundaries.length, continuity: inspection.continuity.length, reversed: details.reversed.length, gateOmissions: details.missingGates.length, overlaps: details.catalogs.overlaps.length, uncertified: details.catalogs.certification.uncovered.length };
assert.deepEqual(counts, { corridors: 2, bodies: 0, boundaries: 0, continuity: 0, reversed: 0, gateOmissions: 0, overlaps: 3, uncertified: 951 });

const wires = new Map(scene.wiring.value.map(w => [w.id, w]));
const roads = new Map(scene.roads.map(r => [r.id, r]));
const inside = (p, b) => [p.x >= b.x, p.x <= b.x + b.width, p.y >= b.y, p.y <= b.y + b.height].every(Boolean);
const both = (s, b) => [s.from, s.to].every(p => inside(p, b));
const corridorWitnesses = inspection.corridors.map(id => {
  const [wireId, ordinal] = id.split(':');
  const segment = wires.get(wireId).segments[Number(ordinal) - 1];
  return { id, segment, owner: roads.get(segment.corridorId), containingRoads: scene.roads.filter(r => both(segment, r.bounds)).map(r => r.id) };
});
const bridgeId = corridorWitnesses[1].segment.corridorId;
const bridgeUsers = supports.flatMap(s => s.joins.filter(j => j.nominal.roadId === bridgeId).map(join => ({ wireId: s.wire.id, join })));
assert.deepEqual(bridgeUsers.map(u => [u.wireId, u.join.nominal.from.y]), [['w80', 2345.5], ['w81', 2351.5], ['w84', 2357.5]]);
assert(bridgeUsers.every(u => json(u.join.nominal) === json(u.join.adjusted)));
assert(corridorWitnesses.every(w => w.containingRoads.length === 0));

const intersectionSource = verifier.slice(verifier.indexOf('function intersection(a, b)'), verifier.indexOf('const pairs ='));
const intersect = runInNewContext(intersectionSource + ';intersection;');
function contacts(a, b) {
  return a.segments.flatMap((first, i) => b.segments.map((second, j) => ({
    firstOrdinal: i + 1, secondOrdinal: j + 1, first, second, hit: intersect(first, second),
  })).filter(c => c.hit !== null));
}
const historical = read('projection/after-catalogs.json').catalogs.overlaps.slice(0, 3);
const replay = historical.map(old => {
  const [a, b] = old.wires.map(id => wires.get(id));
  assert.equal(json(intersect(old.first, old.second)), json(old.hit), 'recompute historical contact');
  const current = contacts(a, b);
  assert(current.every(c => c.hit.length === 0), 'no historical positive-length collision survives B');
  return { wires: old.wires, historical: old, currentContacts: current, currentSegments: [a, b] };
});
const report = {
  status: 'STOP-judgment-required-no-product-candidate', base: '7b3f232', receipts, counts,
  observerEqualsPublic: true, corridorWitnesses, bridge: roads.get(bridgeId), bridgeUsers,
  bridgeJunctions: scene.junctions.filter(j => j.roadIds.includes(bridgeId)),
  gatePort: scene.ports.find(p => p.portId === 'section-13:exit-bottom'),
  historicalReplays: replay, remainingDOverlaps: details.catalogs.overlaps,
  note: 'All evidence is accepted B/current unchanged output. No C after geometry exists. No alternative turn policy was attempted.',
};
writeFileSync(root + 'embedding/increment-c-stop-evidence.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, receipts, counts, corridorWitnesses, bridgeRows: bridgeUsers.map(u => ({ wireId: u.wireId, row: u.join.nominal.from.y, rank: u.join.outgoing.lane.index, count: u.join.outgoing.count })), historicalReplays: replay.map(r => ({ wires: r.wires, old: r.historical.hit, current: r.currentContacts })) }, null, 2));
