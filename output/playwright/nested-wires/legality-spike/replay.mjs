#!/usr/bin/env -S node --import tsx
/** Read-only committed-evidence replay. CLI recovery: correct inputs and rerun.
 * Exit 0 reproduces the illegal catalog; --assert-legal is an expected exit-1 control.
 * Infrastructure/assertion errors are returned as {ok:false,error:{code,detail}}; exit 2.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { inspectNestedWires } from '../../../../capability/layout/contract/index.ts';

const revision = '534fd8dd4e6b22e143008b975795125c1b538c73';
const prefix = 'output/playwright/nested-wires/authoring-scene/';
const verifierPath = 'output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs';
const gitRead = (path) => execFileSync('git', ['show', `${revision}:${path}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const hash = (text) => createHash('sha256').update(text).digest('hex');
const pairs = (xs) => xs.flatMap((a, i) => xs.slice(i + 1).map((b) => [a, b]));
const both = (s, fn) => [s.from, s.to].every(fn);
const within = (v, a, b) => v >= Math.min(a, b) && v <= Math.max(a, b);
const containsPoint = (p, b) => [within(p.x, b.x, b.x + b.width), within(p.y, b.y, b.y + b.height)].every(Boolean);
const orthogonal = (s) => s.from.x === s.to.x || s.from.y === s.to.y;
const across = (r) => r.axis === 'horizontal' ? 'y' : 'x';
const trafficSign = (r) => r.axis === 'horizontal' ? 1 : -1;
const openOverlap = (a, b, c, d) => Math.max(Math.min(a, b), c) < Math.min(Math.max(a, b), d);
const countBy = (xs, key) => Object.fromEntries([...new Set(xs.map(key))].sort().map((k) => [k, xs.filter((x) => key(x) === k).length]));
function bodyHit(s, b) {
  const horizontal = [s.from.y > b.y, s.from.y < b.y + b.height, openOverlap(s.from.x, s.to.x, b.x, b.x + b.width)].every(Boolean);
  const vertical = [s.from.x > b.x, s.from.x < b.x + b.width, openOverlap(s.from.y, s.to.y, b.y, b.y + b.height)].every(Boolean);
  return horizontal || vertical;
}
function planeHit(s, axis, other, at, low, high) {
  if (s.from[axis] === s.to[axis]) return [];
  if (![within(at, s.from[axis], s.to[axis]), within(s.from[other], low, high)].every(Boolean)) return [];
  return [{ ...s.from, [axis]: at }];
}
function touches(s, b) {
  return [
    ...[b.x, b.x + b.width].flatMap((v) => planeHit(s, 'x', 'y', v, b.y, b.y + b.height)),
    ...[b.y, b.y + b.height].flatMap((v) => planeHit(s, 'y', 'x', v, b.x, b.x + b.width)),
  ];
}
function witness(context, identity) {
  const [id, ordinal] = identity.split(':');
  const wire = context.wires.get(id);
  const segment = wire.segments[Number(ordinal) - 1];
  return { identity, from: wire.from, to: wire.to, segment, road: context.roads.get(segment.corridorId) };
}
function corridor(context, identity) {
  const w = witness(context, identity);
  const mechanism = orthogonal(w.segment) ? 'C2-forward-turn-outside-owner' : 'C1-forward-clamp-collapses-median-dogleg';
  return { ...w, mechanism, orthogonal: orthogonal(w.segment), endpointsInside: both(w.segment, (p) => containsPoint(p, w.road.bounds)) };
}
function nodeBody(context, identity) {
  const w = witness(context, identity);
  const bodies = context.scene.nodes.filter((n) => bodyHit(w.segment, n.bounds)).map((n) => ({ id: n.id, bounds: n.bounds }));
  return { ...w, mechanism: 'N-demand-outgrows-fixed-body-clearance', diagonal: !orthogonal(w.segment), bodies };
}
function assignedGate(context, wire, gate) {
  const port = context.ports.get(gate);
  const road = context.roads.get(`drive:${gate}`);
  const lane = context.scene.wireLanes.find((l) => l.wireId === wire.id && l.roadId === road.id);
  const a = across(road);
  return { gate, owner: road.access.nodeId, point: { ...port.point, [a]: port.point[a] + lane.offset }, roadBounds: road.bounds };
}
function boundaryContact(point, section, gates) {
  const owned = gates.filter((g) => g.owner === section.id);
  const distances = owned.map((g) => Math.abs(g.point.x - point.x) + Math.abs(g.point.y - point.y));
  return { section: section.id, sectionBounds: section.bounds, point, gates: owned, distances,
    mechanism: distances.includes(1.5) ? 'B1-quarter-pitch-turn-outside-gate-plane' : 'B2-capacity-spill-crosses-unplanned-wall' };
}
function boundary(context, identity) {
  const w = witness(context, identity);
  assert(orthogonal(w.segment));
  const wire = context.wires.get(identity.split(':')[0]);
  const gates = wire.gates.map((g) => assignedGate(context, wire, g));
  const contacts = context.scene.sections.flatMap((section) => touches(w.segment, section.bounds).map((p) => boundaryContact(p, section, gates)))
    .filter((c) => !c.distances.includes(0));
  assert(contacts.length > 0);
  const mechanisms = [...new Set(contacts.map((c) => c.mechanism))].sort();
  return { ...w, mechanism: mechanisms.join('+'), contacts };
}
function segmentOrdinal(context, wire, segment) {
  return context.wires.get(wire).segments.findIndex((s) => JSON.stringify(s) === JSON.stringify(segment)) + 1;
}
function overlapMechanism(o) {
  if (![o.first, o.second].every(orthogonal)) return 'O1-diagonal-bounding-box-artifact';
  if (o.first.corridorId === o.second.corridorId) return 'O2-terminal-backtrack-shares-assigned-lane';
  return 'O3-independent-channels-share-physical-space';
}
function overlap(context, o, index) {
  return { identity: `overlap:${index + 1}`, ...o, mechanism: overlapMechanism(o),
    segments: [segmentOrdinal(context, o.wires[0], o.first), segmentOrdinal(context, o.wires[1], o.second)] };
}
function proofReplay(context, source) {
  const start = source.indexOf('const laneById =');
  const end = source.indexOf('const certified =');
  assert(start >= 0 && end > start);
  const failures = [];
  function check(name, operation) {
    try { operation(); } catch (e) { failures.push({ name, code: e.code, message: e.message }); }
  }
  const scope = { scene: context.scene, lanes: context.scene.wireLanes, wires: [...context.wires.values()], roads: context.roads,
    assert, check, pairs, containsPoint, across, trafficSign };
  const suffix = ';({proofRegions, endpointCertificates, constraints, obstructions, disjointRegions, events});';
  const proof = runInNewContext(source.slice(start, end) + suffix, scope, { timeout: 10000 });
  assert.equal(failures.length, 1);
  assert.equal(failures[0].message, 'J17/J145 proof regions overlap');
  assert.equal(proof.endpointCertificates.length + proof.constraints.length + proof.obstructions.length, 0);
  const overlappingRegions = pairs(proof.proofRegions).filter(([a, b]) => !proof.disjointRegions(a.bounds, b.bounds))
    .map(([a, b]) => ({ first: a, second: b }));
  return { failures, overlappingRegions, proof };
}
function crossing(context, proof, hit, index) {
  const regions = proof.proofRegions.filter((r) => hit.registeredJunctions.includes(r.id));
  return { identity: `uncertified:${index + 1}`, ...hit, mechanism: 'U-global-proof-abort-before-any-pair',
    // Diagnostic only: events are observed without bypassing the abort or issuing certificates.
    events: regions.map((r) => ({ region: r.label, bounds: r.bounds,
      paths: hit.wires.map((id) => ({ wire: id, perimeterEvents: proof.events(context.wires.get(id), r.bounds) })) })) };
}
function adjacency(manifest) {
  return new Map(manifest.nodes.map((n) => [n.number, manifest.wires.filter((w) => w.from === n.number).map((w) => w.to)]));
}
function visitCycle(graph, start, path, target) {
  if (target === start) return [[...path, start]];
  if (target < start || path.includes(target)) return [];
  return cyclesFrom(graph, start, [...path, target]);
}
function cyclesFrom(graph, start, path) {
  return graph.get(path.at(-1)).flatMap((target) => visitCycle(graph, start, path, target));
}
function degreeRows(manifest) {
  return manifest.nodes.map((n) => ({ number: n.number, path: n.path,
    in: manifest.wires.filter((w) => w.to === n.number).length,
    out: manifest.wires.filter((w) => w.from === n.number).length }));
}
function descendants(section) {
  return [...section.nodes.map((n) => n.number), ...section.children.flatMap(descendants)];
}
function sectionRow(section, spec, manifest) {
  const direct = section.nodes.map((n) => n.number);
  const all = descendants(section);
  return { section: section.number, path: spec.directories.find((d) => d.number === section.number).path,
    direct: density(direct, manifest.wires), subtree: density(all, manifest.wires) };
}
function density(nodes, wires) {
  const internal = wires.filter((w) => nodes.includes(w.from) && nodes.includes(w.to));
  const possible = nodes.length * (nodes.length - 1);
  return { nodes: nodes.length, edges: internal.length, possible, density: possible === 0 ? null : internal.length / possible, wires: internal.map((w) => w.id) };
}
function sectionsFlat(sections) {
  return sections.flatMap((s) => [s, ...sectionsFlat(s.children)]);
}
function topology(manifest, spec) {
  assert.deepEqual(manifest.wires.map((w) => [w.from, w.to]), spec.requests);
  assert.deepEqual(manifest.wires.map((w) => ({ id: w.id, label: w.label })), spec.wires);
  const graph = adjacency(manifest);
  const rows = degreeRows(manifest);
  const top = (direction) => rows.toSorted((a, b) => b[direction] - a[direction] || a.number - b.number).slice(0, 5);
  return { scope: manifest.scope, nodes: rows.length, edges: manifest.wires.length,
    cycles: manifest.nodes.flatMap((n) => cyclesFrom(graph, n.number, [n.number])),
    degrees: rows, histogramIn: countBy(rows, (r) => r.in), histogramOut: countBy(rows, (r) => r.out),
    topIn: top('in'), topOut: top('out'),
    topFiveInShare: top('in').reduce((n, r) => n + r.in, 0) / manifest.wires.length,
    topFiveOutShare: top('out').reduce((n, r) => n + r.out, 0) / manifest.wires.length,
    sections: sectionsFlat(spec.sections).map((s) => sectionRow(s, spec, manifest)),
    kernelNodes: rows.filter((r) => r.path.includes('kernel')) };
}
function run(read) {
  const names = ['scene.json', 'invariant-audit.json', 'crossing-certificates.json', 'scene-spec.json', 'extraction-manifest.json'];
  const inputs = names.map((name) => ({ name, text: read(prefix + name) }));
  const [scene, audit, certificates, spec, manifest] = inputs.map((i) => JSON.parse(i.text));
  assert(scene.wiring.ok);
  const inspection = inspectNestedWires(scene, scene.wiring.value);
  assert.deepEqual(inspection, audit.inspection);
  assert.deepEqual([inspection.corridors.length, inspection.nodeBodies.length, inspection.boundaries.length, audit.overlaps.length, certificates.uncovered.length], [4, 40, 87, 18, 1273]);
  const context = { scene, wires: new Map(scene.wiring.value.map((w) => [w.id, w])), roads: new Map(scene.roads.map((r) => [r.id, r])), ports: new Map(scene.ports.map((p) => [p.portId, p])) };
  const verifier = read(verifierPath);
  const replay = proofReplay(context, verifier);
  assert.equal(certificates.covered.length + certificates.lowerBound + certificates.endpointCertificates.length + certificates.obstructions.length, 0);
  const catalog = {
    corridor: inspection.corridors.map((id) => corridor(context, id)),
    nodeBody: inspection.nodeBodies.map((id) => nodeBody(context, id)),
    boundary: inspection.boundaries.map((id) => boundary(context, id)),
    overlap: audit.overlaps.map((o, i) => overlap(context, o, i)),
    uncertified: certificates.uncovered.map((h, i) => crossing(context, replay.proof, h, i)),
  };
  return { revision, inputs: inputs.map((i) => ({ path: prefix + i.name, sha256: hash(i.text) })), verifier: { path: verifierPath, sha256: hash(verifier) },
    interpretation: 'Classification success reproduces known illegal output; not a legality certificate.',
    summary: Object.fromEntries(Object.entries(catalog).map(([k, rows]) => [k, countBy(rows, (r) => r.mechanism)])),
    boundaryContactCounts: countBy(catalog.boundary.flatMap((b) => b.contacts), (c) => c.mechanism),
    proofAbort: { failures: replay.failures, overlappingRegions: replay.overlappingRegions },
    topology: topology(manifest, spec), catalog };
}
/**
 * @template T
 * @param {() => T} operation
 * @returns {{ok:true,value:T}|{ok:false,error:{code:'evidence-replay-failed',detail:string,source:unknown}}}
 * Read-only CLI recovery: correct the evidence/diagnostic and rerun.
 */
function outcome(operation) {
  try { return { ok: true, value: operation() }; }
  catch (error) { return { ok: false, error: { code: 'evidence-replay-failed', detail: String(error), source: error } }; }
}
const result = outcome(() => run(gitRead));
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 2;
if (result.ok && process.argv.includes('--assert-legal')) assert.equal(result.value.catalog.corridor.length, 0, 'Recorded real graph is illegal');
