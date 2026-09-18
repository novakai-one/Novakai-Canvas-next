/** M10f-1/M10f-2 offline public-output gates. Assertion failure means STOP; no fixture writes. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { gunzipSync } from 'node:zlib';
import { createNestedRoadScene, defaultNestedSceneSpec, fanInHubSceneSpec, inspectNestedWires } from '../../../../capability/layout/contract/index.ts';
const root = 'output/playwright/nested-wires/';
const projection = process.argv[2]?.startsWith('projection-');
const local = projection ? '.local/m10f2-projection/' : '.local/m10f-ownership/';
const phase = process.argv[2]?.replace('projection-', '');
assert(['before', 'after'].includes(phase));
mkdirSync(local, { recursive: true });
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const json = (value) => JSON.stringify(value);
const hash = (value) => createHash('sha256').update(json(value)).digest('hex');
const baseline = '1ff0be8';
const pinned = (path) => execFileSync('git', ['show', `${baseline}:${path}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const verifier = pinned(root + 'templates-scene/verify-templates-scene.mjs');
const specs = {
  default: defaultNestedSceneSpec,
  hub: fanInHubSceneSpec,
  templates: read(root + 'templates-scene/scene-spec.json'),
  scale: read(root + 'scale-scene/scale-scene-spec.json'),
  authoring: read(root + 'authoring-scene/scene-spec.json'),
};
const inside = (p, b) => [p.x >= b.x, p.x <= b.x + b.width, p.y >= b.y, p.y <= b.y + b.height].every(Boolean);
const both = (s, bounds) => [s.from, s.to].every((p) => inside(p, bounds));
const section = (start, end) => verifier.slice(verifier.indexOf(start), verifier.indexOf(end));
function catalogs(scene) {
  const failures = [];
  const check = (name, operation) => {
    try { operation(); } catch (error) { failures.push({ name, message: error.message }); }
  };
  const scope = { scene, wires: scene.wiring.value, lanes: scene.wireLanes, roads: new Map(scene.roads.map((r) => [r.id, r])), assert, check, containsPoint: inside, across: (r) => r.axis === 'horizontal' ? 'y' : 'x', trafficSign: (r) => r.axis === 'horizontal' ? 1 : -1 };
  const code = section('function intersection(a, b)', 'console.log(`OVERLAPS') +
    section('const hits = new Map();', "check(\n  'all distinct-wire contacts") +
    section('const laneById =', 'const certified =') +
    section('function coverage(hits, certificates)', "check('actual crossing count") +
    ';({overlaps, endpointCertificates, obstructions, lowerBound, certification});';
  const result = runInNewContext(code, { ...scope, certified: new Map() }, { timeout: 20000 });
  return JSON.parse(json({ ...result, failures }));
}
function supplementary(scene) {
  const roads = new Map(scene.roads.map((r) => [r.id, r]));
  const wires = new Map(scene.wiring.value.map((w) => [w.id, w]));
  const reversed = scene.wireLanes.flatMap((lane) => {
    const a = roads.get(lane.roadId).axis === 'horizontal' ? 'x' : 'y';
    return wires.get(lane.wireId).segments.map((s, i) => ({ s, id: `${lane.wireId}:${i + 1}` }))
      .filter(({ s }) => s.laneId === lane.id && Math.sign(s.to[a] - s.from[a]) !== lane.direction).map(({ id }) => id);
  });
  const missingGates = scene.wireLanes.filter((l) => l.roadId.startsWith('drive:section-')).filter((lane) => {
    const road = roads.get(lane.roadId), a = road.axis === 'horizontal' ? 'x' : 'y';
    const at = scene.ports.find((p) => p.portId === road.access.portId).point[a];
    return !wires.get(lane.wireId).segments.filter((s) => s.corridorId === road.id).some((s) =>
      [s.from[a] !== s.to[a], at >= Math.min(s.from[a], s.to[a]), at <= Math.max(s.from[a], s.to[a])].every(Boolean));
  }).map((l) => ({ wire: l.wireId, road: l.roadId }));
  return { reversed, missingGates };
}
function metadataChanges(before, after) {
  return after.wiring.value.flatMap((wire, w) => wire.segments.flatMap((s, i) => {
    const old = before.wiring.value[w].segments[i];
    if (s.corridorId === old.corridorId) return [];
    const road = after.roads.find((r) => r.id === s.corridorId);
    assert(both(s, road.bounds));
    assert.equal(road.kind, 'street');
    assert.equal(s.laneId, undefined);
    const junctions = after.junctions.filter((j) => [old.corridorId, s.corridorId].every((id) => j.roadIds.includes(id)) && both(s, j.bounds));
    assert(junctions.length > 0);
    return [{ wire: wire.id, segment: i + 1, before: old.corridorId, after: s.corridorId, junctions: junctions.map((j) => j.label) }];
  }));
}
function withoutOwner(segment) {
  return Object.fromEntries(Object.entries(segment).filter(([key]) => key !== 'corridorId'));
}
function geometry(scene) {
  return { ...scene, wiring: { ...scene.wiring, value: scene.wiring.value.map((w) => ({ ...w, segments: w.segments.map(withoutOwner) })) } };
}
function projectionAuthoring(scene) {
  const path = local + 'authoring-before.json';
  const committed = phase === 'before' ? scene : read(path);
  const inspection = inspectNestedWires(scene, scene.wiring.value);
  const current = catalogs(scene), extra = supplementary(scene);
  const diagonal = scene.wiring.value.flatMap((w) => w.segments.flatMap((s, i) =>
    s.from.x !== s.to.x && s.from.y !== s.to.y ? [`${w.id}:${i + 1}`] : []));
  const details = { inspection, diagonal, ...extra, catalogs: current };
  writeFileSync(root + `projection/${phase}-catalogs.json`, JSON.stringify(details, null, 2) + '\n');
  const counts = { corridors: inspection.corridors.length, reversed: extra.reversed.length,
    overlaps: current.overlaps.length, bodies: inspection.nodeBodies.length,
    boundaries: inspection.boundaries.length, uncertified: current.certification.uncovered.length,
    gateOmissions: extra.missingGates.length, diagonal: diagonal.length };
  console.log(JSON.stringify({ phase, counts }));
  assert.deepEqual({ ...scene, wiring: null }, { ...committed, wiring: null }, 'Non-wire scene data frozen');
  assert.deepEqual(inspection.continuity, []);
  const expected = {
    before: { corridors: 2, reversed: 28, overlaps: 18, bodies: 40, boundaries: 87,
      uncertified: 1273, gateOmissions: 96, diagonal: 2 },
    after: { corridors: 0, reversed: 0, overlaps: 4, bodies: 40, boundaries: 87,
      uncertified: 1273, gateOmissions: 96, diagonal: 0 },
  };
  assert.deepEqual(counts, expected[phase]);
  if (phase === 'after') {
    const original = read(root + 'projection/before-catalogs.json');
    assert.deepEqual(extra.missingGates, original.missingGates, 'Gate omission catalog retained');
    assert.deepEqual(current.overlaps, original.catalogs.overlaps.slice(14), 'Only O3 overlaps retained');
  }
  return counts;
}
function verifyAuthoring(scene) {
  const committed = JSON.parse(pinned(root + 'authoring-scene/scene.json'));
  assert.equal(json(geometry(scene)), json(geometry(committed)), 'All non-corridor metadata and geometry must match committed M10b');
  const inspection = inspectNestedWires(scene, scene.wiring.value);
  const audit = JSON.parse(pinned(root + 'authoring-scene/invariant-audit.json'));
  const expected = phase === 'before' ? audit.inspection : { ...audit.inspection, corridors: ['w03:5', 'w23:5'] };
  assert.deepEqual(inspection, expected);
  const current = catalogs(scene), original = catalogs(committed);
  assert.equal(json(current), json(original), 'Overlap/proof catalogs unchanged');
  assert.deepEqual(current.overlaps, audit.overlaps);
  assert.equal(current.certification.uncovered.length, 1273);
  assert.equal(current.lowerBound, 0);
  assert.equal(current.failures.length, 1);
  assert.equal(current.failures[0].message, 'J17/J145 proof regions overlap');
  const extra = supplementary(scene);
  assert.deepEqual(extra, supplementary(committed));
  assert.deepEqual([extra.reversed.length, extra.missingGates.length], [28, 96]);
  const changes = metadataChanges(committed, scene);
  assert.deepEqual(changes.map((c) => `${c.wire}:${c.segment}`), phase === 'before' ? [] : ['w41:16', 'w41:17']);
  return { inspection, changes, geometryHash: hash(geometry(scene)), overlaps: current.overlaps.length, overlapHash: hash(current.overlaps), uncertified: current.certification.uncovered.length, proofHash: hash(current), reversed: extra.reversed.length, gateOmissions: extra.missingGates.length };
}
const authoringVerifier = projection ? projectionAuthoring : verifyAuthoring;
function retained(name, scene) {
  if (name === 'authoring') return authoringVerifier(scene);
  const inspection = inspectNestedWires(scene, scene.wiring.value);
  assert.deepEqual(inspection, { corridors: [], nodeBodies: [], boundaries: [], continuity: [] });
  assert.equal(json(scene), gunzipSync(readFileSync(root + `ownership/${name}-baseline.json.gz`)).toString(), `${name} retained bytes`);
  return { inspection };
}
function verifyScene([name, spec]) {
  const stages = [];
  const scene = createNestedRoadScene({ spec, measure: (stage, run) => { stages.push(stage); return run(); } });
  assert(scene.wiring.ok);
  assert.equal(json(scene), json(createNestedRoadScene({ spec })), `${name} rebuild determinism`);
  const path = local + name + '-before.json';
  if (phase === 'before') writeFileSync(path, json(scene));
  const details = retained(name, scene);
  if (projection) writeFileSync(local + name + `-${phase}.json`, json(scene));
  writeFileSync(local + name + '-spec.json', json(spec));
  return [name, { sha256: hash(scene), bytes: Buffer.byteLength(json(scene)), deterministic: true, stages, ...details }];
}
const report = Object.fromEntries(Object.entries(specs).map(verifyScene));
writeFileSync(root + `${projection ? 'projection' : 'ownership'}/${phase}.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
