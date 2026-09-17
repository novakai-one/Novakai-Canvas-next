#!/usr/bin/env -S node --import tsx
/** Read-only fixture replay. Node owns failures: correct inputs and rerun; no files are mutated.
 * Default exit 0 means the recorded failure was reproduced, NOT that the layout is legal.
 * --assert-legal deliberately exits 1 for variant-a. Assertions carry ERR_ASSERTION codes.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { inspectNestedWires } from '../../../../capability/layout/contract/index.ts';

const fixture = new URL('../order-trial-scale/', import.meta.url);
const verifier = new URL('../templates-scene/verify-templates-scene.mjs', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, fixture), 'utf8'));
const pairs = (items) => items.flatMap((a, i) => items.slice(i + 1).map((b) => [a, b]));
function across(road) {
  if (road.axis === 'horizontal') return 'y';
  return 'x';
}
function trafficSign(road) {
  if (road.axis === 'horizontal') return 1;
  return -1;
}
const containsPoint = (p, b) =>
  [p.x >= b.x, p.x <= b.x + b.width, p.y >= b.y, p.y <= b.y + b.height].every(Boolean);
const within = (value, a, b) => value >= Math.min(a, b) && value <= Math.max(a, b);

function ownedGateSegments(wire, gate, plane) {
  return wire.segments.filter((segment) =>
    [
      segment.corridorId === gate.id,
      segment.from.x !== segment.to.x,
      within(plane, segment.from.x, segment.to.x),
    ].every(Boolean),
  );
}

function boundaryWitness(scene, identity) {
  const [id, ordinal] = identity.split(':');
  const wire = scene.wiring.value.find((w) => w.id === id);
  const segment = wire.segments[Number(ordinal) - 1];
  const street = scene.roads.find((r) => r.id === segment.corridorId);
  const gate = scene.roads.find((r) => r.id === 'drive:section-1:entry-left');
  const port = scene.ports.find((p) => p.portId === gate.access.portId);
  const lane = scene.wireLanes.find((l) => l.wireId === id && l.roadId === gate.id);
  const assignedY = port.point.y + lane.offset;
  assert.equal(segment.from.y, assignedY - 6 / 4);
  assert.equal(segment.from.x, street.bounds.x + 6 / 2);
  assert(segment.from.x < port.point.x && segment.to.x > port.point.x);
  assert.equal(ownedGateSegments(wire, gate, port.point.x).length, 0);
  return {
    identity, from: wire.from, to: wire.to, targetPort: wire.targetPortId,
    street: street.id, streetBounds: street.bounds, streetDemand: street.wireLaneCount,
    gateBounds: gate.bounds, gatePlane: port.point.x, assignedY,
    actualBoundaryPoint: { x: port.point.x, y: segment.from.y }, segment,
    ownedGateCrossings: 0,
    violatedAssumption: 'Left-turn start must follow the gate plane; street edge + half-pitch is 559 < 576. Crossing moves off its assigned gate by -1.5.',
  };
}

/** Execute the existing prover's unchanged, read-only section against captured scene data.
 * Explicit sentinels fail closed when upstream structure changes. No verifier/product writes.
 */
function proofReplay(scene, source) {
  const start = source.indexOf('const laneById =');
  const end = source.indexOf('const certified =');
  assert(start >= 0 && end > start);
  const context = {
    scene, lanes: scene.wireLanes, wires: scene.wiring.value,
    roads: new Map(scene.roads.map((r) => [r.id, r])),
    assert, check: (...args) => args[1](), pairs, containsPoint, across, trafficSign,
  };
  const result = ';({ constraints, endpointCertificates, proofRegions, events, obstructions });';
  return runInNewContext(source.slice(start, end) + result, context, { timeout: 10000 });
}

function terminalWitness(wire, box, scene) {
  const terminals = [
    { port: wire.sourcePortId, pin: wire.segments[0].from },
    { port: wire.targetPortId, pin: wire.segments.at(-1).to },
  ];
  return terminals.filter((t) => containsPoint(t.pin, box)).map((t) => ({
    ...t,
    strictlyInterior: [
      t.pin.x > box.x, t.pin.x < box.x + box.width,
      t.pin.y > box.y, t.pin.y < box.y + box.height,
    ].every(Boolean),
    driveway: scene.roads.find((r) => r.id === `drive:${t.port}`).bounds,
  }));
}

function crossingWitness(hit, scene, proof) {
  const region = proof.proofRegions.find((r) => hit.registeredJunctions.includes(r.id));
  const events = hit.wires.map((id) => {
    const wire = scene.wiring.value.find((w) => w.id === id);
    return { wire: id, events: proof.events(wire, region.bounds), terminals: terminalWitness(wire, region.bounds, scene) };
  });
  const key = hit.wires.join('/');
  const constraints = proof.constraints.filter((c) => c.wires.join('/') === key);
  assert.equal(proof.obstructions.filter((o) => o.wires.join('/') === key).length, 0);
  return {
    ...hit, region: { bounds: region.bounds, roadIds: region.roadIds }, events,
    reason: failureReason(events),
    constraints,
  };
}

function failureReason(events) {
  if (events.some((w) => w.events.length !== 2))
    return 'junctionPath discards a path: pin lies inside the proof rectangle, not on its perimeter';
  return 'linked road-order table admits zero crossings; no positive obstruction retained';
}

function run(scene, baseline, audit, certificates, source) {
  assert(scene.wiring.ok && baseline.wiring.ok);
  const inspection = inspectNestedWires(scene, scene.wiring.value);
  assert.deepEqual(inspection, audit.inspection);
  assert.deepEqual(inspection.boundaries, ['w16:19', 'w17:20', 'w18:21', 'w19:21']);
  assert.deepEqual(inspectNestedWires(baseline, baseline.wiring.value), {
    corridors: [], nodeBodies: [], boundaries: [], continuity: [],
  });
  const proof = proofReplay(scene, source);
  const lowerBound = proof.endpointCertificates.length + proof.obstructions.reduce((n, o) => n + o.lowerBound, 0);
  assert.equal(lowerBound, certificates.lowerBound);
  assert.equal(lowerBound, 85);
  assert.equal(certificates.covered.length, 85);
  assert.equal(certificates.uncovered.length, 16);
  const crossings = certificates.uncovered.map((hit) => crossingWitness(hit, scene, proof));
  assert.equal(crossings.filter((c) => c.events.some((e) => e.events.length !== 2)).length, 12);
  return {
    status: 'REPRODUCED_ILLEGAL_GEOMETRY_AND_PROOF_GAPS',
    verifierSha256: createHash('sha256').update(source).digest('hex'),
    inspection, boundaryWitnesses: inspection.boundaries.map((id) => boundaryWitness(scene, id)),
    certification: { actual: certificates.covered.length + certificates.uncovered.length, lowerBound, uncertified: crossings },
    baseline: { inspection: inspectNestedWires(baseline, baseline.wiring.value) },
  };
}

/** @template T
 * @typedef {{ok: true, value: T} | {ok: false, error: {code: 'evidence-replay-failed', source: unknown}}} Result
 */
/** CLI recovery owner: correct evidence and rerun; read-only retries are safe.
 * @template T
 * @param {() => T} operation
 * @returns {Result<T>}
 */
function outcome(operation) {
  try {
    return { ok: true, value: operation() };
  } catch (source) {
    return { ok: false, error: { code: 'evidence-replay-failed', source } };
  }
}

const result = outcome(() => run(
  readJson('variant-a/scene.json'), readJson('baseline/scene.json'),
  readJson('variant-a/invariant-audit.json'), readJson('variant-a/crossing-certificates.json'),
  readFileSync(verifier, 'utf8'),
));
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 2;
// Separate negative control deliberately retains Node's ERR_ASSERTION and exit 1.
if (process.argv.includes('--assert-legal')) assert.deepEqual(result.value.inspection.boundaries, []);
