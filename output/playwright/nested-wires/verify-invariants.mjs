/** Retained fixture invariants. Node owns assertion failures; rerunning has no side effects. */
import assert from 'node:assert/strict';
import {
  createNestedRoadScene,
  inspectNestedWires,
} from '../../../capability/layout/contract/index.ts';

const scene = createNestedRoadScene();
assert(scene.wiring?.ok);
const wires = scene.wiring.value;
assert.equal(wires.length, 18);
assert.deepEqual(inspectNestedWires(scene, wires), {
  corridors: [],
  nodeBodies: [],
  boundaries: [],
  continuity: [],
});
assert.equal(JSON.stringify(createNestedRoadScene().wiring), JSON.stringify(scene.wiring));
const original = wires[0];
assert(original);
function corrupted(segment) {
  return inspectNestedWires(scene, [
    { ...original, segments: [segment, ...original.segments.slice(1)] },
  ]);
}
assert(
  corrupted({
    from: { x: -100, y: -100 },
    to: { x: -50, y: -100 },
    corridorId: 'missing',
  }).corridors.includes('w01:1'),
);
assert(
  corrupted({
    from: { x: 440, y: 448 },
    to: { x: 632, y: 448 },
    corridorId: 'drive:node-1:exit-right',
  }).nodeBodies.includes('w01:1'),
);
assert(
  corrupted({
    from: { x: 300, y: 500 },
    to: { x: 304, y: 500 },
    corridorId: 'missing',
  }).boundaries.includes('w01:1'),
);
assert(
  corrupted({
    from: { x: 632, y: 448 },
    to: { x: 650, y: 448 },
    corridorId: 'drive:node-1:exit-right',
  }).continuity.includes('w01'),
);
console.log(
  'PASS retained six fixture cases: 18-wire admission, determinism, off-road rejection, node-body rejection, nongate rejection, disconnected-path rejection.',
);

const gateWire = wires.find((wire) => wire.id === 'w10');
const gateSegment = gateWire.segments.find((segment) => segment.corridorId === 'drive:section-2:exit-bottom');
const shifted = { ...gateSegment, from: { ...gateSegment.from, x: gateSegment.from.x + 1 }, to: { ...gateSegment.to, x: gateSegment.to.x + 1 } };
const illegal = inspectNestedWires(scene, [{ ...gateWire, segments: [shifted] }]);
assert.equal(illegal.corridors.length, 0);
assert(illegal.boundaries.length > 0);
console.log('PASS gate mouth refinement: wrong lane inside the permitted mouth is rejected; exact assigned lanes accepted.');
