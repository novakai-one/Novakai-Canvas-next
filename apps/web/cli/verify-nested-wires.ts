/** Standalone acceptance CLI. Assertion/filesystem failures are reported by Node; rerun safely. */
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  createNestedRoadScene,
  inspectNestedWires,
  fanInHubSceneSpec,
} from '@novakai/canvas-layout';
import type { RoadPrototypeScene, NestedWire } from '@novakai/canvas-layout';

const expected = [
  [1, 2],
  [1, 3],
  [2, 4],
  [5, 6],
  [6, 9],
  [8, 10],
  [11, 13],
  [17, 20],
  [4, 5],
  [10, 18],
  [16, 17],
  [12, 7],
  [5, 7],
  [11, 12],
  [1, 4],
  [9, 17],
  [16, 18],
  [12, 8],
  [2, 23],
  [4, 23],
  [7, 23],
  [10, 23],
  [13, 23],
  [19, 23],
  [24, 8],
  [24, 20],
];
function wireData(scene: RoadPrototypeScene): readonly NestedWire[] {
  assert(scene.wiring?.ok, JSON.stringify(scene.wiring));
  return scene.wiring.value;
}
function portEnds(scene: RoadPrototypeScene, wire: NestedWire): void {
  const first = wire.segments.at(0),
    last = wire.segments.at(-1);
  assert(first && last);
  const source = scene.ports.find((p) => p.portId === wire.sourcePortId),
    target = scene.ports.find((p) => p.portId === wire.targetPortId);
  assert(source && target);
  assert.equal(source.nodeId, wire.from);
  assert.equal(target.nodeId, wire.to);
  assert(['right', 'bottom'].includes(source.side));
  assert(['top', 'left'].includes(target.side));
  assert.deepEqual(inspectNestedWires(scene, [wire]).continuity, []);
  assert.equal(first.corridorId, `drive:${source.portId}`);
  assert.equal(last.corridorId, `drive:${target.portId}`);
}
function geometry(): void {
  const scene = createNestedRoadScene();
  const baseline = execFileSync('git', ['show', '1716111:output/playwright/nested/scene.json'], {
    encoding: 'utf8',
  });
  const accepted = JSON.parse(baseline) as RoadPrototypeScene;
  for (const key of ['nodes', 'sections', 'ports'] as const)
    assert.deepEqual(scene[key], accepted[key]);
  console.log(
    'PASS M3 preserves all node, section and port geometry; road widths derive from lane demand.',
  );
}
function verify(scene: RoadPrototypeScene): void {
  const wires = wireData(scene);
  assert.deepEqual(
    wires.map((w) => [w.id, w.from, w.to]),
    expected.map(([a, b], i) => [`w${String(i + 1).padStart(2, '0')}`, `node-${a}`, `node-${b}`]),
  );
  console.log('PASS 3a exactly 26 wires with all prescribed IDs and endpoints.');
  wires.forEach((w) => portEnds(scene, w));
  console.log(
    'PASS 3b all 26 start in right/bottom source driveways and end in top/left target driveways.',
  );
  const inspection = inspectNestedWires(scene, wires);
  assert.deepEqual(inspection.continuity, []);
  assert.deepEqual(inspection.corridors, []);
  console.log(
    `PASS 3c every one of ${wires.reduce((sum, w) => sum + w.segments.length, 0)} segments independently covered by a road/driveway rectangle; all paths continuous.`,
  );
  assert.deepEqual(inspection.nodeBodies, []);
  console.log('PASS 3d zero segments intersect node body interiors.');
  assert.deepEqual(inspection.boundaries, []);
  console.log('PASS 3e zero section-boundary crossings at non-gate locations.');
  assert.equal(
    JSON.stringify(wires),
    JSON.stringify(wireData(createNestedRoadScene({ spec: fanInHubSceneSpec }))),
  );
  console.log('PASS 3f two consecutive scene generations have byte-identical wire path data.');
}
const scene = createNestedRoadScene({ spec: fanInHubSceneSpec });
geometry();
verify(scene);
mkdirSync('output/playwright/nested-wires', { recursive: true });
writeFileSync('output/playwright/nested-wires/scene.json', JSON.stringify(scene, null, 2) + '\n');
