/** Independent exact preservation proof against immutable M3 evidence. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { register } from 'tsx/esm/api';
register();
const { createNestedRoadScene } = await import('../../../capability/layout/contract/index.ts');
const baselineText = execFileSync(
  'git',
  ['show', '2f9b762:output/playwright/nested-wires/scene.json'],
  { encoding: 'utf8' },
);
const baseline = JSON.parse(baselineText);
const scene = createNestedRoadScene();
const permitted = {
  'node-1:exit-right': ['w01', 'w15'],
  'node-5:exit-right': ['w04', 'w13'],
  'node-11:exit-right': ['w07', 'w14'],
  'node-12:exit-bottom': ['w12', 'w18'],
  'node-16:exit-right': ['w11', 'w17'],
  'node-18:entry-top': ['w10', 'w17'],
};
const groups = new Map();
for (const wire of baseline.wiring.value)
  for (const id of [wire.sourcePortId, wire.targetPortId]) {
    const bucket = groups.get(id) ?? [];
    bucket.push(wire.id);
    groups.set(id, bucket);
  }
assert.deepEqual(Object.fromEntries([...groups].filter(([, ids]) => ids.length > 1)), permitted);
const expected = structuredClone(baseline);
const segment = (from, to, corridorId) =>
  JSON.stringify(from) === JSON.stringify(to) ? [] : [{ from, to, corridorId }];
for (const [portId, ids] of Object.entries(permitted)) {
  const port = baseline.ports.find((p) => p.portId === portId);
  const across = ['left', 'right'].includes(port.side) ? 'y' : 'x';
  const along = across === 'x' ? 'y' : 'x';
  const pins = [];
  for (const [index, id] of ids.entries()) {
    const wire = expected.wiring.value.find((w) => w.id === id);
    const source = wire.sourcePortId === portId;
    const drive = `drive:${portId}`;
    const lane = baseline.wireLanes.find((l) => l.wireId === id && l.roadId === drive);
    assert.equal(lane.index, index);
    const pin = {
      ...port.point,
      [across]: port.point[across] + (index - (ids.length - 1) / 2) * 6 * Math.sign(lane.offset),
    };
    pins.push(pin);
    const bend = {
      ...pin,
      [along]: pin[along] + (source ? 1 : -1) * lane.direction * (ids.length - index - 1) * 6,
    };
    const laneEnd = { ...bend, [across]: port.point[across] + lane.offset };
    const originalStem = wire.segments.find((s) => s.laneId === lane.id);
    const stem = { ...originalStem, [source ? 'from' : 'to']: laneEnd };
    const fan = source
      ? [...segment(pin, bend, drive), ...segment(bend, laneEnd, drive), stem]
      : [stem, ...segment(laneEnd, bend, drive), ...segment(bend, pin, drive)];
    const positions = wire.segments.flatMap((s, i) => (s.corridorId === drive ? [i] : []));
    assert.equal(positions.at(-1) - positions[0] + 1, positions.length);
    wire.segments.splice(positions[0], positions.length, ...fan);
    const actual = scene.wiring.value.find((w) => w.id === id);
    assert.deepEqual(source ? actual.segments[0].from : actual.segments.at(-1).to, pin);
  }
  assert.equal(Math.abs(pins[1][across] - pins[0][across]), 6);
  assert.equal((pins[0][across] + pins[1][across]) / 2, port.point[across]);
  console.log(
    `PASS 3b ${portId}: order=${ids}; exact pins=${JSON.stringify(pins)}; pitch=6; centered`,
  );
}
assert.equal(JSON.stringify(scene, null, 2) + '\n', JSON.stringify(expected, null, 2) + '\n');
console.log(
  'PASS 3b complete default serialization equals immutable M3 plus ONLY the six exact computed terminal fans; every other byte preserved',
);
