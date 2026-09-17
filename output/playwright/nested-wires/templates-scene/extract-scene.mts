/** Deterministic source evidence. Node owns IO failures; fix the source/input and rerun safely. */
import assert from 'node:assert/strict';
import { readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../../../../capability/templates/', import.meta.url));
const output = new URL('./', import.meta.url);
const roots = ['contract', 'core', 'adapters'];
function walk(directory: string): readonly string[] {
  return readdirSync(resolve(root, directory), { withFileTypes: true })
    .flatMap(entry => entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
}
const files = roots.flatMap(walk).filter(file => file.endsWith('.ts')).sort();
assert.equal(files.length, 16, 'M6 production file count');
const directories = ['contract', 'contract/ports', 'contract/records', 'core', 'core/admission', 'core/discovery', 'core/expansion', 'core/validation', 'adapters'];
assert.deepEqual([...new Set(files.map(dirname))].sort(), directories.filter(dir => dir !== 'core').sort());
const options: ts.CompilerOptions = { module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, target: ts.ScriptTarget.ESNext };
const program = ts.createProgram(files.map(file => resolve(root, file)), options);
const checker = program.getTypeChecker();
const members = new Set(files);
interface Edge { readonly consumer: string; readonly provider: string; readonly line: number; readonly source: string; readonly names: readonly string[] }
interface Dropped { readonly consumer: string; readonly line: number; readonly reason: string; readonly source: string }
const dropped: Dropped[] = [];
function hasValue(node: ts.Node): boolean {
  const symbol = checker.getSymbolAtLocation(node);
  if (!symbol) return false;
  const actual = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  return (actual.flags & ts.SymbolFlags.Value) !== 0;
}
function edge(file: string, source: ts.SourceFile, statement: ts.Statement): readonly Edge[] {
  if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) return [];
  return declarationEdge(file, source, statement);
}
function declarationEdge(file: string, source: ts.SourceFile, statement: ts.ImportDeclaration | ts.ExportDeclaration): readonly Edge[] {
  const module = statement.moduleSpecifier;
  if (!module || !ts.isStringLiteral(module)) return [];
  const resolved = ts.resolveModuleName(module.text, source.fileName, options, ts.sys).resolvedModule;
  const provider = relative(root, resolved?.resolvedFileName ?? module.text);
  const line = source.getLineAndCharacterOfPosition(statement.getStart(source)).line + 1;
  const text = statement.getText(source).replace(/\s+/g, ' ');
  const names = valueNames(statement);
  return admit({ consumer: file, provider, line, source: text, names });
}
function admit(candidate: Edge): readonly Edge[] {
  if (!members.has(candidate.provider)) return drop(candidate, 'external');
  if (candidate.names.length === 0) return drop(candidate, 'type-only / no value binding');
  return [candidate];
}
function drop(candidate: Edge, reason: string): readonly Edge[] {
  dropped.push({ consumer: candidate.consumer, line: candidate.line, reason, source: candidate.source });
  return [];
}
function sourceEdges(file: string): readonly Edge[] {
  const source = program.getSourceFile(resolve(root, file));
  assert(source, `Missing parsed source ${file}`);
  return source.statements.flatMap(statement => edge(file, source, statement));
}
const declarations = files.flatMap(sourceEdges);
const pairs = [...new Map(declarations.map(edge => [`${edge.provider}:${edge.consumer}`, edge])).values()]
  .sort((a, b) => files.indexOf(a.provider) - files.indexOf(b.provider) || files.indexOf(a.consumer) - files.indexOf(b.consumer));
function section(path: string): object {
  return {
    number: directories.indexOf(path) + 1,
    nodes: files.filter(file => dirname(file) === path).map(file => ({ number: files.indexOf(file) + 1, label: basename(file) })),
    children: directories.filter(child => dirname(child) === path).map(section),
  };
}
/** Source spelling/order is retained, aliases use the imported (provider) name. */
function specifierNames(elements: readonly (ts.ImportSpecifier | ts.ExportSpecifier)[]): readonly string[] {
  return elements.filter(element => !element.isTypeOnly && hasValue(element.name))
    .map(element => (element.propertyName ?? element.name).text);
}
function bindingNames(bindings: ts.NamedImportBindings | undefined): readonly string[] {
  if (!bindings) return [];
  if (ts.isNamespaceImport(bindings)) return namespaceNames(bindings.name);
  return specifierNames(bindings.elements);
}
function importedNames(clause: ts.ImportClause | undefined): readonly string[] {
  if (!clause || clause.isTypeOnly) return [];
  return [...defaultNames(clause.name), ...bindingNames(clause.namedBindings)];
}
function exportedNames(statement: ts.ExportDeclaration): readonly string[] {
  if (statement.isTypeOnly) return [];
  const clause = statement.exportClause;
  if (!clause) return exportedModuleNames(statement.moduleSpecifier);
  return exportClauseNames(clause);
}
function namespaceNames(name: ts.Identifier | ts.StringLiteral): readonly string[] {
  return hasValue(name) ? [name.text] : [];
}
function defaultNames(name: ts.Identifier | undefined): readonly string[] {
  if (!name) return [];
  return hasValue(name) ? ['default'] : [];
}
function exportClauseNames(clause: ts.NamedExportBindings): readonly string[] {
  if (ts.isNamespaceExport(clause)) return namespaceNames(clause.name);
  return specifierNames(clause.elements);
}
function exportedModuleNames(node: ts.Expression | undefined): readonly string[] {
  if (!node) return [];
  const symbol = checker.getSymbolAtLocation(node);
  if (!symbol) return [];
  return checker.getExportsOfModule(symbol).filter(value => (value.flags & ts.SymbolFlags.Value) !== 0)
    .map(value => value.name);
}
function valueNames(statement: ts.ImportDeclaration | ts.ExportDeclaration): readonly string[] {
  return ts.isImportDeclaration(statement) ? importedNames(statement.importClause) : exportedNames(statement);
}
function wireMetadata(pair: Edge, index: number): { readonly id: string; readonly label: string } {
  const names = [...new Set(declarations.filter(edge => edge.provider === pair.provider && edge.consumer === pair.consumer)
    .flatMap(edge => edge.names))];
  assert(names.length > 0, `Missing value names for ${pair.provider} -> ${pair.consumer}`);
  const label = names.length <= 2 ? names.join(', ') : `${names[0]} + ${names.length - 1} more`;
  return { id: `w${String(index + 1).padStart(2, '0')}`, label };
}
const spec = {
  sections: roots.map(section),
  requests: pairs.map(edge => [files.indexOf(edge.provider) + 1, files.indexOf(edge.consumer) + 1]),
  wires: pairs.map(wireMetadata),
};
const connected = new Set(pairs.flatMap(edge => [edge.provider, edge.consumer]));
const report = [
  '# Templates scene extraction', '',
  `TypeScript compiler API: ${files.length} production nodes; ${directories.length} directory sections; ${pairs.length} value wires.`, '',
  'Node IDs follow sorted relative source paths. Direct nodes are alphabetical by file name. Root section order: contract, core, adapters; child directories alphabetical. Wire IDs follow provider ID, then consumer ID. Requests are provider → consumer (OUT → IN). No coordinates are authored.', '',
  'Imports and re-exports must carry a value symbol according to the TypeScript checker. Explicit type statements/specifiers are excluded. Multiple value bindings or declarations for a pair produce one wire. Dropped counts count declarations, not individual named bindings, with external taking precedence over type-only. Side-effect-only imports carry no value binding. Tests and fixtures are excluded by walking only the three production roots.', '',
  `Delta from grep estimate 29: ${pairs.length - 29}. The AST/checker filters type-only dependencies and external modules and deduplicates file pairs; the table below is authoritative.`, '',
  '## Nodes', '', '| Node | File |', '| --- | --- |',
  ...files.map((file, index) => `| node-${index + 1} | ${file} |`), '',
  '## Sections', '', '| Section | Directory | Direct nodes |', '| --- | --- | --- |',
  ...directories.map((dir, index) => `| section-${index + 1} | ${dir} | ${files.filter(file => dirname(file) === dir).length} |`), '',
  'Labels retain exact imported value names in source order, deduplicated per provider/consumer pair. One or two names are comma-joined; three or more render first + N more, where N is the remaining count. Type-only names are excluded. The wires array adds id/label presentation metadata beside unchanged sections and requests; the host attaches it after layout. Nested synthetic scenes retain wire IDs.', '',
  '## Value wires', '', '| Wire | Provider | Consumer | Source evidence (consumer:line) |', '| --- | --- | --- | --- |',
  ...pairs.map((edge, index) => `| w${String(index + 1).padStart(2, '0')} | ${edge.provider} | ${edge.consumer} | ${declarations.filter(item => item.provider === edge.provider && item.consumer === edge.consumer).map(item => `${item.consumer}:${item.line} — \`${item.source}\``).join('<br>')} |`), '',
  '## Dropped declarations', '',
  `- External: ${dropped.filter(item => item.reason === 'external').length}`,
  `- Type-only / no value binding (internal): ${dropped.filter(item => item.reason !== 'external').length}`,
  `- Duplicate value declarations collapsed: ${declarations.length - pairs.length}`, '',
  '| Source | Reason | Declaration |', '| --- | --- | --- |',
  ...dropped.map(item => `| ${item.consumer}:${item.line} | ${item.reason} | \`${item.source}\` |`), '',
  '## Isolated nodes', '', ...files.filter(file => !connected.has(file)).map(file => `- ${file}`), '',
].join('\n');
writeFileSync(new URL('scene-spec.json', output), JSON.stringify(spec, null, 2) + '\n');
writeFileSync(new URL('extraction-report.md', output), report);
console.log(`${files.length} nodes / ${directories.length} sections / ${pairs.length} wires; ${dropped.length} dropped declarations`);
