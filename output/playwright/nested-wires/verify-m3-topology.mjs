/** M3 preflight through tracked public source. Node owns failures; reruns have no side effects.
 * Run: node --import tsx output/playwright/nested-wires/verify-m3-topology.mjs
 * This checks topology prerequisites, not lane allocation or completed M3 acceptance.
 */
import assert from 'node:assert/strict';
import { createNestedRoadScene } from '../../../capability/layout/contract/index.ts';

const scene = createNestedRoadScene();
assert(scene.wiring?.ok, JSON.stringify(scene.wiring));
const wires = scene.wiring.value;
assert.equal(wires.length, 18);
const expected = [
  [5, 7],
  [11, 12],
  [1, 4],
  [9, 17],
  [16, 18],
  [12, 8],
];
assert.deepEqual(
  wires.slice(12).map((wire) => [wire.id, wire.from, wire.to]),
  expected.map(([from, to], i) => [`w${i + 13}`, `node-${from}`, `node-${to}`]),
);
console.log('PASS DoD 2: tracked source, ok=true, wires=18; exact six addendum pairs');
const byId = new Map(wires.map((wire) => [wire.id, wire]));
function wire(id) {
  const value = byId.get(id);
  assert(value, id);
  return value;
}
for (const [first, second] of [
  ['w10', 'w16'],
  ['w11', 'w17'],
  ['w12', 'w18'],
]) {
  assert.deepEqual(wire(first).gates, wire(second).gates);
  console.log(`PASS DoD 2: ${first}/${second} gates=${JSON.stringify(wire(first).gates)}`);
}
function roads(id) {
  return new Set(wire(id).segments.map((segment) => segment.corridorId));
}
const requirements = [
  ['w04', 'w13', 1],
  ['w07', 'w14', 1],
  ['w02', 'w15', 1],
  ['w10', 'w16', 2],
  ['w11', 'w17', 2],
  ['w12', 'w18', 2],
];
const failures = [];
function sharing([first, second, minimum]) {
  const secondRoads = roads(second);
  const shared = [...roads(first)].filter((id) => secondRoads.has(id));
  const passed = shared.length >= minimum;
  const label = passed ? 'PASS' : 'FAIL';
  console.log(
    `${label} DoD 3c: ${first}/${second} shared=${JSON.stringify(shared)}; required>=${minimum}`,
  );
  if (!passed) failures.push(`${first}/${second}`);
}
requirements.forEach(sharing);
console.log(
  `Diagnostic only: w01/w15 shared=${JSON.stringify([...roads('w01')].filter((id) => roads('w15').has(id)))}`,
);
for (const id of ['w02', 'w15']) {
  const item = wire(id);
  console.log(
    `${id}: ${item.sourcePortId} -> ${item.targetPortId}; corridors=${JSON.stringify([...roads(id)])}`,
  );
}
assert.equal(JSON.stringify(scene), JSON.stringify(createNestedRoadScene()));
console.log('PASS DoD 3g: complete scene regeneration is byte-identical');
function finish() {
  if (failures.length === 0) return;
  console.log(`STOP: unchanged routing law fails required road sharing: ${failures.join(', ')}`);
  process.exitCode = 1;
}
finish();
