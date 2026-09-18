/** Deterministic source extraction. Node reports I/O failures; rerun regenerates both artifacts. */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, realpathSync, mkdirSync, writeFileSync } from 'node:fs';
import type { Dirent } from 'node:fs';
import { basename, dirname, relative, resolve, sep } from 'node:path';
import ts from 'typescript';
import type { NestedSectionSpec } from '@novakai/canvas-layout';

const root = resolve('capability/authoring');
const destination = resolve('output/playwright/nested-wires/authoring-scene');
assert.equal(realpathSync(root), root, 'Authoring root must not resolve through a symlink');
/** Descend only real in-scope directories; installed dependencies are never source. */
function walk(directory: string): readonly Dirent[] {
  const actual = realpathSync(directory);
  assert(actual === root || actual.startsWith(root + sep), 'Walk escaped Authoring root');
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !entry.isSymbolicLink() && entry.name !== 'node_modules')
    .flatMap((entry) => descend(directory, entry));
}
function descend(directory: string, entry: Dirent): readonly Dirent[] {
  if (!entry.isDirectory()) return [entry];
  return [entry, ...walk(resolve(directory, entry.name))];
}
const entries = walk(root);
const paths = entries.map((entry) => ({
  path: relative(root, resolve(entry.parentPath, entry.name)),
  directory: entry.isDirectory(),
}));
const files = paths.filter((entry) => !entry.directory && entry.path.endsWith('.ts'));
const nodes = files
  .map((entry) => entry.path)
  .sort()
  .map((file, index) => ({
    number: index + 1,
    file: `capability/authoring/${file}`,
    path: file,
    label: basename(file),
  }));
const directories = paths
  .filter((entry) => entry.directory)
  .map((entry) => entry.path)
  .sort();
const sectionRecords = directories.map((path, index) => ({ number: index + 1, path }));
const nodeNumbers = new Map(nodes.map((node) => [resolve(root, node.path), node.number]));

function section(record: (typeof sectionRecords)[number]): NestedSectionSpec {
  return {
    number: record.number,
    nodes: nodes
      .filter((node) => dirname(node.path) === record.path)
      .map(({ number, label }) => ({ number, label })),
    children: sectionRecords.filter((child) => dirname(child.path) === record.path).map(section),
  };
}
function importedName(element: ts.ImportSpecifier): string {
  return (element.propertyName ?? element.name).text;
}
function bindingsNames(bindings: ts.NamedImportBindings | undefined): readonly string[] {
  if (!bindings) return [];
  if (ts.isNamespaceImport(bindings)) return [bindings.name.text];
  return bindings.elements.filter((element) => !element.isTypeOnly).map(importedName);
}
function valueNames(clause: ts.ImportClause | undefined): readonly string[] {
  if (clause?.isTypeOnly) return [];
  const defaults = clause?.name ? ['default'] : [];
  return [...defaults, ...bindingsNames(clause?.namedBindings)];
}
function inlineTypes(bindings: ts.NamedImportBindings | undefined): readonly string[] {
  if (!bindings) return [];
  if (ts.isNamespaceImport(bindings)) return [];
  return bindings.elements.filter((element) => element.isTypeOnly).map(importedName);
}
function typeNames(clause: ts.ImportClause | undefined): readonly string[] {
  if (!clause?.isTypeOnly) return inlineTypes(clause?.namedBindings);
  return wholeTypeNames(clause);
}
function wholeTypeNames(clause: ts.ImportClause): readonly string[] {
  const bindings = clause.namedBindings;
  if (!bindings) return [clause.name?.text ?? 'namespace'];
  if (ts.isNamedImports(bindings)) return bindings.elements.map(importedName);
  return [bindings.name.text];
}
function moduleName(statement: ts.ImportDeclaration): string {
  if (ts.isStringLiteral(statement.moduleSpecifier)) return statement.moduleSpecifier.text;
  return statement.moduleSpecifier.getText();
}
function targetNumber(file: string, module: string): number | null {
  if (!module.startsWith('.')) return null;
  const path = resolve(root, dirname(file), module.replace(/\.js$/, '.ts'));
  // Membership in the symlink-free inventory is the only resolver; never consult node_modules.
  return (
    [path, `${path}.ts`, resolve(path, 'index.ts')]
      .map((candidate) => nodeNumbers.get(candidate))
      .find((number) => number !== undefined) ?? null
  );
}
function importRecord(
  source: ts.SourceFile,
  node: (typeof nodes)[number],
  statement: ts.ImportDeclaration,
) {
  const module = moduleName(statement);
  const symbols = valueNames(statement.importClause);
  return {
    from: node.number,
    to: targetNumber(node.path, module),
    file: node.file,
    line: source.getLineAndCharacterOfPosition(statement.getStart(source)).line + 1,
    module,
    symbols,
    excludedTypes: typeNames(statement.importClause),
    importKind: symbols.length ? 'value' : 'type-only',
    sourceText: statement.getText(source),
  };
}
function imports(node: (typeof nodes)[number]) {
  const source = ts.createSourceFile(
    node.file,
    readFileSync(node.file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  return source.statements
    .filter(ts.isImportDeclaration)
    .map((statement) => importRecord(source, node, statement));
}
const records = nodes.flatMap(imports);
const internal = records.filter((record) => record.importKind === 'value' && record.to !== null);
const wires = internal.map((record, index) => ({
  ...record,
  id: `w${String(index + 1).padStart(2, '0')}`,
  label: record.symbols.join(', '),
}));
const spec = {
  sections: sectionRecords.filter((record) => dirname(record.path) === '.').map(section),
  requests: wires.map((wire) => [wire.from, wire.to]),
  wires: wires.map(({ id, label }) => ({ id, label })),
  directories: sectionRecords,
};
const manifest = {
  scope:
    'All .ts files in capability/authoring, including tests; importer -> imported file. Import declarations only; re-exports are not import declarations.',
  nodes,
  wires,
  imports: records,
  excludedTypeOnlyImports: records.filter((record) => record.importKind === 'type-only').length,
  excludedTypeSymbols: records.reduce((count, record) => count + record.excludedTypes.length, 0),
  external: records.filter((record) => record.to === null),
};
mkdirSync(destination, { recursive: true });
writeFileSync(resolve(destination, 'scene-spec.json'), JSON.stringify(spec, null, 2) + '\n');
writeFileSync(
  resolve(destination, 'extraction-manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(
  `EXTRACTED files=${files.length}; nodes=${nodes.length}; sections=${directories.length}; wires=${wires.length}; excluded type-only imports=${manifest.excludedTypeOnlyImports}; excluded type symbols=${manifest.excludedTypeSymbols}; external imports=${manifest.external.length}`,
);
