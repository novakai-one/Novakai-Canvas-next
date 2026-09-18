/** Independent manifest gates. Node owns assertion reporting; rerun after authorized correction. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import manifest from './extraction-manifest.json' with { type: 'json' };
import spec from './scene-spec.json' with { type: 'json' };

const files = execFileSync(
  'find',
  ['capability/authoring', '-name', '*.ts', '-not', '-path', '*/node_modules/*'],
  { encoding: 'utf8' },
)
  .trim()
  .split('\n')
  .sort();
console.log(`NODE COUNT extracted=${manifest.nodes.length} | find=${files.length}`);
assert.deepEqual(manifest.nodes.map((node) => node.file).sort(), files);
assert.equal(new Set(manifest.nodes.map((node) => node.number)).size, files.length);
const flatten = (section: (typeof spec.sections)[number]): number[] => [
  ...section.nodes.map((node) => node.number),
  ...section.children.flatMap(flatten),
];
assert.deepEqual(
  spec.sections.flatMap(flatten).sort(),
  manifest.nodes.map((node) => node.number).sort(),
);
assert.equal(spec.requests.length, manifest.wires.length);
assert.deepEqual(
  spec.requests,
  manifest.wires.map((wire) => [wire.from, wire.to]),
);
assert.deepEqual(
  spec.wires,
  manifest.wires.map(({ id, label }) => ({ id, label })),
);
const bare = spec.wires.filter((wire) => /^w\d+$/.test(wire.label));
assert.equal(bare.length, 0);
assert(manifest.wires.every((wire) => wire.importKind === 'value'));
assert.deepEqual(
  manifest.external,
  manifest.imports.filter((record) => record.to === null),
);
assert(
  manifest.external.every(
    (record) =>
      !manifest.wires.some((wire) => wire.file === record.file && wire.line === record.line),
  ),
);
function symbols(statement: ts.ImportDeclaration): string[] {
  const clause = statement.importClause;
  assert(clause && !clause.isTypeOnly, 'Wire must cite a value import');
  const defaults = clause.name ? ['default'] : [];
  return [...defaults, ...named(clause.namedBindings)];
}
function named(bindings: ts.NamedImportBindings | undefined): string[] {
  if (!bindings) return [];
  if (ts.isNamespaceImport(bindings)) return [bindings.name.text];
  return bindings.elements
    .filter((element) => !element.isTypeOnly)
    .map((element) => (element.propertyName ?? element.name).text);
}
function verify(wire: (typeof manifest.wires)[number]): string {
  const text = readFileSync(wire.file, 'utf8');
  const source = ts.createSourceFile(wire.file, text, ts.ScriptTarget.Latest, true);
  const statement = source.statements
    .filter(ts.isImportDeclaration)
    .find(
      (statement) =>
        source.getLineAndCharacterOfPosition(statement.getStart(source)).line + 1 === wire.line,
    );
  assert(statement, `${wire.id}: missing file:line import`);
  assert.equal(statement.getText(source), wire.sourceText);
  assert.deepEqual(symbols(statement), wire.symbols);
  assert.equal(wire.label, wire.symbols.join(', '));
  assert(wire.symbols.length > 0);
  return `PASS ${wire.id} ${wire.file}:${wire.line} — ${wire.label}`;
}
manifest.wires.forEach(verify);
// Hash ordering gives a deterministic pseudorandom sample without mutable RNG state.
const rank = (id: string) => createHash('sha256').update(`m10b-amendment-1:${id}`).digest('hex');
const sample = manifest.wires.toSorted((a, b) => rank(a.id).localeCompare(rank(b.id))).slice(0, 10);
assert.equal(sample.length, 10);
sample.forEach((wire) => console.log(verify(wire)));
console.log(
  `PASS ${manifest.wires.length} wire citations; bare ID labels=${bare.length}; type-only wires=0; excluded type-only imports=${manifest.excludedTypeOnlyImports}; excluded type symbols=${manifest.excludedTypeSymbols}; external=${manifest.external.length}`,
);
