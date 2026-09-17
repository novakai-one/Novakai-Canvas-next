/** Full inherited geometry/certification audit, with independent semantic scale gates.
 * Node owns assertion failures; correct the source fixture and rerun, never rebaseline failures.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createNestedRoadScene } from '../../../../capability/layout/contract/index.ts';
const spec = JSON.parse(readFileSync(new URL('scale-scene-spec.json', import.meta.url), 'utf8'));
const flatten = (section) => [section, ...section.children.flatMap(flatten)];
const groups = spec.sections.flatMap(flatten);
const nodes = groups.flatMap((section) => section.nodes);
assert.equal(spec.seed, 7007);
assert.equal(spec.sections.length, 6);
assert.deepEqual(
  spec.sections
    .map((s) => s.children.length)
    .filter(Boolean)
    .sort(),
  [2, 4],
);
assert.equal(groups.length, 12);
assert.equal(nodes.length, 40);
assert.equal(spec.requests.length, 75);
assert.equal(new Set(nodes.map((node) => node.number)).size, 40);
assert.equal(new Set(spec.requests.map((pair) => pair.join('/'))).size, 75);
assert(!/"(?:x|y|width|height|bounds|position)"\s*:/.test(JSON.stringify(spec)));
const degree = (endpoint) =>
  Math.max(
    ...nodes.map((node) => spec.requests.filter((pair) => pair[endpoint] === node.number).length),
  );
assert(degree(0) >= 8);
assert(degree(1) >= 6);
const owners = new Map(
  spec.sections.flatMap((s, index) =>
    flatten(s).flatMap((child) => child.nodes.map((node) => [node.number, index])),
  ),
);
const longRange = spec.requests.filter(([a, b]) => Math.abs(owners.get(a) - owners.get(b)) >= 2);
assert(longRange.length >= 4);
spec.requests.forEach(([a, b]) => assert(a !== b && owners.has(a) && owners.has(b)));
const scene = createNestedRoadScene({ spec });
assert(scene.nodes.every((node) => node.ports.length === 4));
console.log(
  `PASS semantic shape: 6 top / children 2+4 / 40 nodes / 75 unique wires / four ports each / fan-out ${degree(0)} / fan-in ${degree(1)} / long-range ${longRange.length}`,
);
const shape = (section) => [
  section.number,
  section.nodes.map((n) => n.label),
  section.children.map(shape),
];
execFileSync(
  process.execPath,
  [
    '--import',
    'tsx',
    new URL('../templates-scene/verify-templates-scene.mjs', import.meta.url).pathname,
    JSON.stringify({
      directory: '../scale-scene/',
      specFile: 'scale-scene-spec.json',
      nodeCount: 40,
      sectionCount: 12,
      wireCount: 75,
      expectedShape: spec.sections.map(shape),
    }),
  ],
  { stdio: 'inherit' },
);
