/** Read-only rejected-candidate audit. Node reports assertion failures; reruns are safe. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import {
  createNestedRoadScene,
  fanInHubSceneSpec,
} from '../../../../capability/layout/contract/index.ts';

const directory = new URL('./', import.meta.url);
const read = (name) => readFileSync(new URL(name, directory), 'utf8');
// Execute the predicate from the retained patch, not a separately reimplemented rule.
const additions = read('candidate-placement.patch').split('\n')
  .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
  .map((line) => line.slice(1)).join('\n');
const predicate = additions.match(/function compactSection\(directNodeCount: number\): boolean \{\n  return directNodeCount <= 2;\n\}/)?.[0];
assert(predicate, 'Candidate must contain the exact single-argument, ambient-free predicate');
const compact = runInNewContext(ts.transpile(predicate) + '\ncompactSection');
console.log('CANDIDATE ONLY: rejected production change is retained as a patch, not installed');
console.log('PASS predicate uses only its own directNodeCount parameter: return directNodeCount <= 2');
const nested = createNestedRoadScene({ spec: fanInHubSceneSpec });
const enumeration = nested.sections.map((section) => {
  const directNodeCount = nested.nodes.filter((node) => node.sectionId === section.id).length;
  return { section: section.id, directNodeCount, compact: compact(directNodeCount) };
});
for (const row of enumeration) console.log('ENUMERATION ' + JSON.stringify(row));
assert.deepEqual(enumeration.map((row) => row.directNodeCount), [6, 6, 6, 6]);
assert.equal(enumeration.filter((row) => row.compact).length, 0);
console.log('PASS rejected compacting predicate matches zero ?nested sections');
const baselineNested = execFileSync('git', [
  'show', 'b20053d:output/playwright/nested-wires/scene.json',
], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
assert.equal(JSON.stringify(nested, null, 2) + '\n', baselineNested);
console.log('PASS restored ?nested full serialization byte-identical to b20053d');
const before = JSON.parse(execFileSync('git', [
  'show', 'b20053d:output/playwright/nested-wires/templates-scene/scene.json',
], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
const after = JSON.parse(read('rejected-scene.json'));
const area = (item) => item.bounds.width * item.bounds.height;
function occupancy(scene, section) {
  const children = scene.sections.filter((item) => item.parentSectionId === section.id);
  const nodes = scene.nodes.filter((item) => item.sectionId === section.id);
  const occupied = [...children, ...nodes].reduce((sum, item) => sum + area(item), 0);
  return { direct: nodes.length, children: children.length, emptyPercent: 100 * (1 - occupied / area(section)) };
}
for (const section of before.sections) {
  const previous = occupancy(before, section);
  const current = occupancy(after, after.sections.find((item) => item.id === section.id));
  console.log('OCCUPANCY ' + JSON.stringify({ section: section.id, before: previous, rejectedCandidate: current }));
  if (current.children !== 0) continue;
  const limit = current.direct === 1 ? 60 : 65;
  assert(current.emptyPercent <= limit);
}
console.log('PASS rejected candidate meets leaf occupancy thresholds; invariant failure still rejects it');
