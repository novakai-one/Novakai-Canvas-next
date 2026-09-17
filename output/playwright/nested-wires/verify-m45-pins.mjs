/** M4.5's corrected contract permits derived pin movement; verify the exact row law. */
import assert from 'node:assert/strict';
import { createNestedRoadScene, fanInHubSceneSpec } from '../../../capability/layout/contract/index.ts';
for (const spec of [undefined, fanInHubSceneSpec]) {
  const scene = createNestedRoadScene({ spec });
  assert(scene.wiring.ok);
  let rows = 0;
  for (const port of scene.ports.filter((p) => p.nodeId.startsWith('node-'))) {
    const lanes = scene.wireLanes.filter((l) => l.roadId === `drive:${port.portId}`).toSorted((a, b) => a.index - b.index);
    const across = ['left', 'right'].includes(port.side) ? 'y' : 'x';
    for (const [index, lane] of lanes.entries()) {
      assert.equal(lane.index, index);
      const wire = scene.wiring.value.find((w) => w.id === lane.wireId);
      const actual = wire.sourcePortId === port.portId ? wire.segments[0].from : wire.segments.at(-1).to;
      const expected = { ...port.point, [across]: port.point[across] + (index - (lanes.length - 1) / 2) * 6 * Math.sign(lane.offset) };
      assert.deepEqual(actual, expected, `${wire.id}/${port.portId}`);
    }
    if (lanes.length) rows += 1;
  }
  console.log(`PASS M4.5 derived pins: ${scene.wiring.value.length} wires; ${rows} exact centered rows in assigned lane order; pitch 6`);
}
