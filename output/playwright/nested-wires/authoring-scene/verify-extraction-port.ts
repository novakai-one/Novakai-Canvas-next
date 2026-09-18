/** Amendment-5 boundary evidence. Node reports assertion failures; rerun after authorized correction. */
import assert from 'node:assert/strict';
import { extractAuthoringScene } from '../../../../apps/web/cli/extract-authoring-scene.js';
import type {
  ExtractionEntry,
  ExtractionFilesystem,
  ExtractionFailure,
} from '../../../../apps/web/contract/ports/authoring-extraction.js';

const root = '/memory/authoring';
function entry(
  parentPath: string,
  name: string,
  directory = false,
  symlink = false,
): ExtractionEntry {
  return { parentPath, name, isDirectory: () => directory, isSymbolicLink: () => symlink };
}
const directories = new Map<string, readonly ExtractionEntry[]>([
  [
    root,
    [
      entry(root, 'core', true),
      entry(root, 'node_modules', true),
      entry(root, 'linked', true, true),
    ],
  ],
  [
    `${root}/core`,
    [
      entry(`${root}/core`, 'b.ts'),
      entry(`${root}/core`, 'a.ts'),
      entry(`${root}/core`, 'empty', true),
    ],
  ],
  [`${root}/core/empty`, []],
]);
const sources = new Map([
  [
    `${root}/core/a.ts`,
    "import { work as alias, type Shape } from './b.js';\nimport type { OnlyType } from './b.js';\nimport external from 'external';",
  ],
  [`${root}/core/b.ts`, 'export const work = 1;'],
]);
function required<T>(entries: ReadonlyMap<string, T>, path: string): T {
  const value = entries.get(path);
  assert.notEqual(value, undefined, `Unexpected filesystem access: ${path}`);
  if (value === undefined) throw new Error(path);
  return value;
}
const memory: ExtractionFilesystem = {
  readFile: (path) => required(sources, path),
  readdir: (path) => required(directories, path),
  realpath: (path) => path,
};
const first = extractAuthoringScene(memory, root);
assert(first.ok);
assert.deepEqual(first, extractAuthoringScene(memory, root));
assert.equal(first.value.manifest.nodes.length, 2);
assert.equal(first.value.manifest.wires.length, 1);
assert.equal(first.value.manifest.wires[0]?.label, 'work');
assert.equal(first.value.manifest.wires[0]?.line, 1);
assert.equal(first.value.manifest.external.length, 1);
assert.equal(first.value.manifest.excludedTypeOnlyImports, 1);
assert.equal(first.value.manifest.excludedTypeSymbols, 2);
assert.equal(first.value.spec.directories.length, 2);
assert.equal(first.value.spec.sections[0]?.children[0]?.nodes.length, 0);
console.log(
  'PASS memory-only extraction: aliases, mixed/type-only imports, external imports, empty directories, symlink/node_modules exclusion, deterministic retry',
);

const sentinel = new Error('injected I/O failure');
function unavailable(): never {
  throw sentinel;
}
function rejects(fs: ExtractionFilesystem, code: ExtractionFailure['code'], path: string) {
  const result = extractAuthoringScene(fs, root);
  assert(!result.ok);
  assert.equal(result.error.code, code);
  assert.equal(result.error.path, path);
  return result.error;
}
assert.equal(
  rejects({ ...memory, readFile: unavailable }, 'unreadable-file', 'capability/authoring/core/a.ts')
    .source,
  sentinel,
);
assert.equal(
  rejects({ ...memory, readdir: unavailable }, 'unreadable-directory', root).source,
  sentinel,
);
assert.equal(
  rejects({ ...memory, realpath: unavailable }, 'unresolvable-path', root).source,
  sentinel,
);
rejects({ ...memory, realpath: () => '/outside' }, 'symlink-escape', root);
rejects(
  { ...memory, realpath: (path) => (path === root ? root : '/outside') },
  'symlink-escape',
  `${root}/core`,
);
const malformed = { ...entry(root, 'broken'), isDirectory: unavailable };
assert.equal(
  rejects({ ...memory, readdir: () => [malformed] }, 'extraction-failed', root).source,
  sentinel,
);
assert.deepEqual(first, extractAuthoringScene(memory, root));
console.log(
  'PASS all five named failure codes, root/descendant escapes, original failure evidence, retry after failures; no real filesystem required',
);
