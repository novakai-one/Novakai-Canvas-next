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
interface Edge { readonly consumer: string; readonly provider: string; readonly line: number; readonly source: string }
interface Dropped { readonly consumer: string; readonly line: number; readonly reason: string; readonly source: string }
const dropped: Dropped[] = [];
function hasValue(node: ts.Node): boolean {
  const symbol = checker.getSymbolAtLocation(node);
  if (!symbol) return false;
  const actual = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  return (actual.flags & ts.SymbolFlags.Value) !== 0;
}
function importValues(clause: ts.ImportClause | undefined): boolean {
  if (!clause || clause.isTypeOnly) return false;
  const bindings = clause.namedBindings;
  return Boolean(clause.name && hasValue(clause.name)) || namedValues(bindings);
}
function namedValues(bindings: ts.NamedImportBindings | undefined): boolean {
  if (!bindings) return false;
  if (ts.isNamespaceImport(bindings)) return hasValue(bindings.name);
  return bindings.elements.some(element => !element.isTypeOnly && hasValue(element.name));
}
function exportValues(statement: ts.ExportDeclaration): boolean {
  if (statement.isTypeOnly) return false;
  const clause = statement.exportClause;
  if (!clause) return moduleValues(statement.moduleSpecifier);
  if (ts.isNamespaceExport(clause)) return hasValue(clause.name);
  return clause.elements.some(element => !element.isTypeOnly && hasValue(element.name));
}
function moduleValues(node: ts.Expression | undefined): boolean {
  if (!node) return false;
  const symbol = checker.getSymbolAtLocation(node);
  if (!symbol) return false;
  return checker.getExportsOfModule(symbol).some(value => (value.flags & ts.SymbolFlags.Value) !== 0);
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
  const value = ts.isImportDeclaration(statement) ? importValues(statement.importClause) : exportValues(statement);
  return admit({ consumer: file, provider, line, source: text }, value);
}
function admit(candidate: Edge, value: boolean): readonly Edge[] {
  const reason = members.has(candidate.provider) ? 'type-only / no value binding' : 'external';
  if (members.has(candidate.provider) && value) return [candidate];
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
const spec = { sections: roots.map(section), requests: pairs.map(edge => [files.indexOf(edge.provider) + 1, files.indexOf(edge.consumer) + 1]) };
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
