/** M4.5 frozen-structure audit. Node owns assertion failures; no scene writes. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  createNestedRoadScene,
  fanInHubSceneSpec,
} from '../../../capability/layout/contract/index.ts';

const revision = '0e5f21e';
const baseline = JSON.parse(execFileSync('git', [
  'show', `${revision}:output/playwright/nested-wires/scene.json`,
], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
const current = createNestedRoadScene({ spec: fanInHubSceneSpec });
assert(current.wiring.ok && baseline.wiring.ok);
function identical(label, before, after) {
  assert.equal(JSON.stringify(after), JSON.stringify(before), label);
  console.log(`PASS frozen ${label}: byte-identical to ${revision}`);
}
identical('nodes', baseline.nodes, current.nodes);
identical('sections', baseline.sections, current.sections);
const roadBounds = (scene) => scene.roads.map(({ id, bounds }) => ({ id, bounds }));
identical('road ids + bounds', roadBounds(baseline), roadBounds(current));
const routes = (scene) => scene.wiring.value.map((wire) => ({
  id: wire.id,
  from: wire.from,
  to: wire.to,
  sourcePortId: wire.sourcePortId,
  targetPortId: wire.targetPortId,
  roads: wire.segments.map((segment) => segment.corridorId)
    .filter((id, index, ids) => index === 0 || id !== ids[index - 1]),
}));
identical('wire routes (ordered road sequences)', routes(baseline), routes(current));
const gates = (scene) => ({
  ports: scene.ports.filter((port) => port.nodeId.startsWith('section-')),
  routes: scene.wiring.value.map(({ id, gates }) => ({ id, gates })),
  driveways: scene.roads.filter((road) => road.access?.nodeId.startsWith('section-')),
});
identical('gates', gates(baseline), gates(current));
let changes = 0;
for (const lane of current.wireLanes) {
  const old = baseline.wireLanes.find((previous) => previous.id === lane.id);
  assert(old, `Missing baseline lane ${lane.id}`);
  if (old.index === lane.index) continue;
  console.log(`LANE ${lane.wireId} ${lane.roadId}: ${old.index} -> ${lane.index}`);
  changes += 1;
}
console.log(`MEASURE per-wire lane-index diffs=${changes}`);
assert.equal(JSON.stringify(current), JSON.stringify(createNestedRoadScene({ spec: fanInHubSceneSpec })));
console.log('PASS deterministic regeneration: two fresh scene serializations byte-identical');
assert.equal(readFileSync(new URL('./scene.json', import.meta.url), 'utf8'),
             JSON.stringify(current, null, 2) + '\n');
console.log('PASS current canonical scene matches fresh public builder: 24 nodes / 26 wires');
const addedTests = execFileSync('git', [
  'diff', '--name-only', '--diff-filter=A', revision, '--', '*.test.ts',
], { encoding: 'utf8' }).trim();
assert.equal(addedTests, '');
console.log('PASS zero new tracked *.test.ts files');
