/** M3 STOP reproduction through the public builder, accepted M2 fixture, and saved candidate.
 * Node owns assertion failures. Exit 1 means the brief's straight-through crossing prohibition fails.
 * Run: node --import tsx output/playwright/nested-wires/verify-m3-junction-blocker.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createNestedRoadScene } from '../../../capability/layout/contract/index.ts';
const directory = new URL('./', import.meta.url);
function contains(p, b) {
  return [p.x >= b.x, p.x <= b.x + b.width, p.y >= b.y, p.y <= b.y + b.height].every(Boolean);
}
function horizontal(s) {
  return s.from.y === s.to.y;
}
function crossing(a, b) {
  if (horizontal(a) === horizontal(b)) return [];
  return orderedCrossing(a, b);
}
function orderedCrossing(a, b) {
  return horizontal(a) ? intersection(a, b) : intersection(b, a);
}
function intersection(h, v) {
  const p = { x: v.from.x, y: h.from.y };
  const interior = [
    p.x > Math.min(h.from.x, h.to.x),
    p.x < Math.max(h.from.x, h.to.x),
    p.y > Math.min(v.from.y, v.to.y),
    p.y < Math.max(v.from.y, v.to.y),
  ].every(Boolean);
  return interior ? [{ point: p, horizontal: h, vertical: v }] : [];
}
function turns(wire, junction) {
  return wire.segments
    .slice(1)
    .filter(
      (s, i) => contains(s.from, junction.bounds) && horizontal(s) !== horizontal(wire.segments[i]),
    );
}
function diagnose(scene, label) {
  assert(scene.wiring.ok, label);
  const a = scene.wiring.value.find((w) => w.id === 'w05');
  const b = scene.wiring.value.find((w) => w.id === 'w06');
  const hits = a.segments.flatMap((x) => b.segments.flatMap((y) => crossing(x, y)));
  assert.equal(hits.length, 1, label);
  const hit = hits[0];
  const junction = scene.junctions.find((j) => contains(hit.point, j.bounds));
  assert(junction, label);
  assert.equal(turns(a, junction).length, 0, label);
  assert.equal(turns(b, junction).length, 0, label);
  assert.equal(hit.horizontal.corridorId, 'section-2:horizontal:672:1176');
  assert.equal(hit.vertical.corridorId, hit.horizontal.corridorId);
  console.log(
    `FAIL Part 2.6 (${label}): w05/w06 cross at ${JSON.stringify(hit.point)}; both have 0 turns inside ${junction.label}`,
  );
  console.log(
    JSON.stringify({
      label,
      junction: junction.bounds,
      horizontal: hit.horizontal,
      vertical: hit.vertical,
    }),
  );
}
const lawPath = 'capability/layout/core/nested-wire-law.ts';
assert.equal(
  readFileSync(lawPath, 'utf8'),
  execFileSync('git', ['show', `2c8ca32:${lawPath}`], { encoding: 'utf8' }),
);
console.log('PASS routing law byte-identical to accepted M2 commit 2c8ca32');
const accepted = JSON.parse(
  execFileSync('git', ['show', '2c8ca32:output/playwright/nested-wires/scene.json'], {
    encoding: 'utf8',
  }),
);
diagnose(accepted, 'accepted M2: 12 wires');
diagnose(createNestedRoadScene(), 'tracked source: 18 wires');
diagnose(
  JSON.parse(readFileSync(new URL('m3-candidate-scene.json', directory), 'utf8')),
  'saved lane candidate: 18 wires',
);
console.log(
  'STOP: fixed band/shared-road law crosses w05 straight through the horizontal road used by w06. Separate lane offsets cannot remove this crossing. A straight-through junction exemption or routing-law change is required.',
);
process.exitCode = 1;
