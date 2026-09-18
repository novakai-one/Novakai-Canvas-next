#!/usr/bin/env -S node --import tsx
/** Analysis-only source probes and immutable ownership counterfactual.
 * No product files or committed fixtures are written. CLI recovery: correct inputs and rerun.
 * Exit 2 returns a structured failure. Success demonstrates only the reported local delta.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { inspectNestedWires } from '../../../../capability/layout/contract/index.ts';
const revision = '534fd8dd4e6b22e143008b975795125c1b538c73';
const read = (path) => execFileSync('git', ['show', `${revision}:${path}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const axes = { horizontal: { along: 'x', across: 'y', length: 'width', breadth: 'height' }, vertical: { along: 'y', across: 'x', length: 'height', breadth: 'width' } };
const samePoint = (a, b) => a.x === b.x && a.y === b.y;
const inside = (p, b) => [p.x >= b.x, p.x <= b.x + b.width, p.y >= b.y, p.y <= b.y + b.height].every(Boolean);
function projectionModule(readSource) {
  const source = readSource('capability/layout/core/nested-lane-projection.ts');
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  const isolated = compiled.replace(/^import .*;$/gm, '').replace(/^export /gm, '');
  return runInNewContext(isolated + ';({medianBridge, forwardConnection, connectionLine});', { axes, nestedLanePitch: 6, samePoint }, { timeout: 1000 });
}
function travel(scene, wire, port) {
  const road = scene.roads.find((r) => r.id === `drive:${port}`);
  const lane = scene.wireLanes.find((l) => l.wireId === wire && l.roadId === road.id);
  const group = scene.wireLanes.filter((l) => l.roadId === road.id && l.direction === lane.direction);
  const a = axes[road.axis];
  return { road, lane, direction: lane.direction, count: group.length, at: road.bounds[a.across] + road.bounds[a.breadth] / 2 + lane.offset };
}
function medianProbe(scene, projection, id) {
  const wire = scene.wiring.value.find((w) => w.id === id);
  const t = travel(scene, id, wire.sourcePortId), next = travel(scene, id, wire.targetPortId);
  const street = scene.roads.find((r) => r.id === wire.segments[4].corridorId);
  const raw = projection.medianBridge(t, next, street);
  // Initial source fan's end is the beginning of the retained quarter-pitch stem.
  const previous = { to: wire.segments[2].from };
  const clamped = projection.forwardConnection(raw, t, previous);
  const emitted = JSON.parse(JSON.stringify(projection.connectionLine(clamped)));
  assert.deepEqual(emitted, wire.segments.slice(3, 5));
  assert.equal(clamped.via[0].x, clamped.via[1].x);
  return { wire: id, t, next, street, previous, raw, clamped, emitted };
}
function overlapReplay(scene, source) {
  const start = source.indexOf('function intersection(a, b)');
  const end = source.indexOf('console.log(`OVERLAPS');
  assert(start >= 0 && end > start);
  return JSON.parse(JSON.stringify(runInNewContext(source.slice(start, end) + ';overlaps;', { wires: scene.wiring.value }, { timeout: 10000 })));
}
function repairOwner(wire, oldOwner, newOwner) {
  if (wire.id !== 'w41') return wire;
  const segments = wire.segments.map((s, i) => repairedSegment(s, i, oldOwner, newOwner));
  return { ...wire, segments };
}
function repairedSegment(segment, index, oldOwner, newOwner) {
  if (![15, 16].includes(index)) return segment;
  assert.equal(segment.corridorId, oldOwner);
  return { ...segment, corridorId: newOwner };
}
function geometry(wires) {
  return wires.map((w) => ({ ...w, segments: w.segments.map(({ from, to, laneId }) => ({ from, to, laneId })) }));
}
function ownershipProbe(scene, verifier, audit) {
  const oldOwner = 'section-14:horizontal:1792:6208';
  const newOwner = 'section-14:vertical:6208:1552';
  const road = scene.roads.find((r) => r.id === newOwner);
  const wire = scene.wiring.value.find((w) => w.id === 'w41');
  const selected = wire.segments.slice(15, 17);
  assert(selected.every((s) => [s.from, s.to].every((p) => inside(p, road.bounds))));
  const junctions = scene.junctions.filter((j) => selected.every((s) => [s.from, s.to].every((p) => inside(p, j.bounds))));
  assert(junctions.some((j) => [oldOwner, newOwner].every((id) => j.roadIds.includes(id))));
  const changed = { ...scene, wiring: { ok: true, value: scene.wiring.value.map((w) => repairOwner(w, oldOwner, newOwner)) } };
  assert.deepEqual(geometry(changed.wiring.value), geometry(scene.wiring.value));
  const before = inspectNestedWires(scene, scene.wiring.value);
  const after = inspectNestedWires(changed, changed.wiring.value);
  assert.deepEqual(after, { ...before, corridors: ['w03:5', 'w23:5'] });
  assert.deepEqual(overlapReplay(scene, verifier), audit.overlaps);
  assert.deepEqual(overlapReplay(changed, verifier), audit.overlaps);
  return { status: 'ANALYSIS_COUNTERFACTUAL_ONLY', changed: ['w41:16', 'w41:17'], oldOwner, newOwner, roadBounds: road.bounds,
    junctions: junctions.map((j) => ({ label: j.label, id: j.id, bounds: j.bounds, roadIds: j.roadIds })),
    before, after, geometryAndLaneIdsUnchanged: true, positiveLengthOverlapCatalogUnchanged: true,
    note: 'No product fix implemented. Generic ownership allocation still requires baseline replay; uncertified crossings remain 1273.' };
}
function supplementary(scene) {
  const wires = scene.wiring.value;
  const reversed = scene.wireLanes.flatMap((lane) => reversedSegments(scene, lane));
  const gates = scene.wireLanes.filter((l) => l.roadId.startsWith('drive:section-'));
  const missingGates = gates.filter((l) => !ownedGate(scene, l)).map((l) => ({ wire: l.wireId, road: l.roadId }));
  const pins = wires.flatMap((w) => pinMargins(scene, w));
  return { reversedAssignedSegments: reversed, missingOwnedGateTraversals: missingGates, pinsOutsideSixUnitMargin: pins };
}
function reversedSegments(scene, lane) {
  const road = scene.roads.find((r) => r.id === lane.roadId);
  const a = axes[road.axis].along;
  const wire = scene.wiring.value.find((w) => w.id === lane.wireId);
  return wire.segments.map((s, i) => ({ identity: `${wire.id}:${i + 1}`, segment: s }))
    .filter((x) => x.segment.laneId === lane.id)
    .filter((x) => Math.sign(x.segment.to[a] - x.segment.from[a]) !== lane.direction)
    .map((x) => ({ ...x, lane }));
}
function ownedGate(scene, lane) {
  const road = scene.roads.find((r) => r.id === lane.roadId);
  const port = scene.ports.find((p) => p.portId === road.access.portId);
  const a = axes[road.axis].along;
  const wire = scene.wiring.value.find((w) => w.id === lane.wireId);
  return wire.segments.filter((s) => s.corridorId === road.id)
    .some((s) => gateCrossing(s, a, port.point[a]));
}
function gateCrossing(s, axis, at) {
  return [s.from[axis] !== s.to[axis], at >= Math.min(s.from[axis], s.to[axis]), at <= Math.max(s.from[axis], s.to[axis])].every(Boolean);
}
function pinMargins(scene, wire) {
  const ends = [[wire.sourcePortId, wire.segments[0].from], [wire.targetPortId, wire.segments.at(-1).to]];
  return ends.map(([id, point]) => pinMargin(scene, wire.id, id, point)).filter((p) => p.margin < 6);
}
function pinMargin(scene, wire, id, point) {
  const road = scene.roads.find((r) => r.id === `drive:${id}`);
  const node = scene.nodes.find((n) => n.id === road.access.nodeId);
  const a = axes[road.axis];
  return { wire, port: id, point, margin: Math.min(point[a.across] - node.bounds[a.across], node.bounds[a.across] + node.bounds[a.breadth] - point[a.across]) };
}
function run(readSource) {
  const prefix = 'output/playwright/nested-wires/authoring-scene/';
  const scene = JSON.parse(readSource(prefix + 'scene.json'));
  const audit = JSON.parse(readSource(prefix + 'invariant-audit.json'));
  const projection = projectionModule(readSource);
  const verifier = readSource('output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs');
  return { revision, supplementary: supplementary(scene), medianProbes: ['w03', 'w23'].map((id) => medianProbe(scene, projection, id)), ownershipProbe: ownershipProbe(scene, verifier, audit) };
}
/**
 * @template T
 * @param {() => T} operation
 * @returns {{ok:true,value:T}|{ok:false,error:{code:'probe-failed',detail:string,source:unknown}}}
 * Read-only CLI recovery: correct the evidence/diagnostic and rerun.
 */
function outcome(operation) {
  try { return { ok: true, value: operation() }; }
  catch (error) { return { ok: false, error: { code: 'probe-failed', detail: String(error), source: error } }; }
}
const result = outcome(() => run(read));
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 2;
