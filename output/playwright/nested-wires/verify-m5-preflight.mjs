/** M5 scope preflight. Node owns failed assertions; rerun replaces only M5 evidence. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  createNestedRoadScene,
  fanInHubSceneSpec,
  inspectNestedWires,
} from '../../../capability/layout/contract/index.ts';

const directory = 'output/playwright/nested-wires/m5-swap';
mkdirSync(directory, { recursive: true });
const original = fanInHubSceneSpec.sections[0];
assert.deepEqual(original.nodes.map((node) => node.number), [1, 2, 3, 4, 23, 24]);
const swappedNodes = [...original.nodes];
[swappedNodes[0], swappedNodes[3]] = [swappedNodes[3], swappedNodes[0]];
const spec = {
  ...fanInHubSceneSpec,
  sections: [{ ...original, nodes: swappedNodes }, ...fanInHubSceneSpec.sections.slice(1)],
};
const before = createNestedRoadScene({ spec: fanInHubSceneSpec });
const scene = createNestedRoadScene({ spec });
assert(scene.wiring.ok);
assert.equal(scene.wiring.value.length, 26);
assert.deepEqual(inspectNestedWires(scene, scene.wiring.value), {
  corridors: [], nodeBodies: [], boundaries: [], continuity: [],
});
const bounds = (subject, id) => subject.nodes.find((node) => node.id === id).bounds;
assert.deepEqual(bounds(scene, 'node-4'), bounds(before, 'node-1'));
assert.deepEqual(bounds(scene, 'node-1'), bounds(before, 'node-4'));
const unchanged = before.nodes.filter((node) => !['node-1', 'node-4'].includes(node.id));
assert.equal(unchanged.length, 22);
unchanged.forEach((node) => assert.deepEqual(bounds(scene, node.id), node.bounds));
assert.equal(JSON.stringify(scene), JSON.stringify(createNestedRoadScene({ spec })));
const restoredNodes = [...swappedNodes];
[restoredNodes[0], restoredNodes[3]] = [restoredNodes[3], restoredNodes[0]];
const restored = { ...spec, sections: [{ ...original, nodes: restoredNodes }, ...spec.sections.slice(1)] };
assert.equal(JSON.stringify(createNestedRoadScene({ spec: restored })), JSON.stringify(before));
const save = (name, value) => writeFileSync(`${directory}/${name}.json`, JSON.stringify(value, null, 2) + '\n');
save('swapped-spec', spec);
save('preflight-scene', scene);
console.log('PASS builder-only preflight: semantic order [4,2,3,1,23,24]; exactly two nodes exchange bounds; other 22 unchanged');
console.log('PASS builder-only preflight: all 26 wires route; corridors/nodeBodies/boundaries/continuity empty; deterministic build and exact round-trip');
console.log('NOTE no UI drag, selection, render timing or screenshot claim; preflight precedes interaction implementation');
console.log(`MEASURE node-1 ${JSON.stringify(bounds(before, 'node-1'))} -> ${JSON.stringify(bounds(scene, 'node-1'))}`);
console.log(`MEASURE node-4 ${JSON.stringify(bounds(before, 'node-4'))} -> ${JSON.stringify(bounds(scene, 'node-4'))}`);
const result = spawnSync(process.execPath, [
  '--import', 'tsx', 'output/playwright/nested-wires/count-operations.mjs',
  '--spec', `${directory}/swapped-spec.json`, '--output', `${directory}/calculations.json`,
], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
