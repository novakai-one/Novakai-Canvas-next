#!/usr/bin/env node
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { parseArgs as parseNodeArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { isBuiltin } from 'node:module';
import ts from 'typescript';

type FunctionExport = { readonly id: string; readonly name: string };
type ModuleInfo = {
  readonly file: string;
  readonly id: string;
  readonly directory: string;
  readonly functions: readonly FunctionExport[];
  readonly exports: ReadonlyMap<string, FunctionExport>;
};
type ImportEdge = {
  readonly id: string;
  readonly source: ModuleInfo;
  readonly target: ModuleInfo;
  readonly targetFunction: FunctionExport;
  readonly imported: string;
};
type Options = {
  readonly root: string;
  readonly output: string | undefined;
  readonly tsconfig: string | undefined;
  readonly sourceRoot: string | undefined;
  readonly includeTests: boolean;
};

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs']);
const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'coverage',
  '.next',
  '.novakai',
  '.local',
  '.generated',
]);
const TEST_SEGMENTS = new Set([
  'test',
  'tests',
  '__tests__',
  'fixture',
  'fixtures',
  '__fixtures__',
]);

function main(): void {
  const started = performance.now();
  const options = parseArgs(process.argv.slice(2));
  const files = sourceFiles(options);
  const program = createProgram(files, options);
  const modules = collectModules(program, options, files);
  const edgeResult = collectEdges(program, modules);
  const source = render(options, modules, edgeResult.edges);
  if (options.output === undefined) process.stdout.write(source);
  else fs.writeFileSync(options.output, source, 'utf8');
  const elapsed = performance.now() - started;
  process.stderr.write(
    JSON.stringify({
      nodes: modules.length,
      wires: edgeResult.edges.length,
      ...edgeResult.counts,
      extractionMs: Number(elapsed.toFixed(2)),
    }) + '\n',
  );
}

function parseArgs(args: readonly string[]): Options {
  const parsed = parseNodeArgs({
    args: [...args],
    options: {
      out: { type: 'string' },
      tsconfig: { type: 'string' },
      'source-root': { type: 'string' },
      'include-tests': { type: 'boolean' },
    },
    allowPositionals: true,
    strict: true,
  });
  if (parsed.positionals.length > 1) throw new Error('Expected at most one repository path');
  const root = path.resolve(parsed.positionals[0] ?? process.cwd());
  return {
    root,
    output: parsed.values.out === undefined ? undefined : path.resolve(parsed.values.out),
    tsconfig: parsed.values.tsconfig,
    sourceRoot: parsed.values['source-root'],
    includeTests: parsed.values['include-tests'] ?? false,
  };
}

function sourceFiles(options: Options): readonly string[] {
  const sourceRoot =
    options.sourceRoot === undefined
      ? options.root
      : path.resolve(options.root, options.sourceRoot);
  return repositoryFiles(options.root).filter((file) => shouldInclude(file, options, sourceRoot));
}

/** Git supplies tracked and non-ignored files; no repository code or scripts are executed. */
function repositoryFiles(root: string): readonly string[] {
  try {
    const result = execFileSync(
      'git',
      ['-C', root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'],
      { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return [...new Set(result.split('\0').filter(Boolean))]
      .map((file) => path.resolve(root, file))
      .filter((file) => fs.existsSync(file));
  } catch {
    return walk(root);
  }
}
function findTsconfig(root: string): string | undefined {
  const candidate = path.join(root, 'tsconfig.json');
  return fs.existsSync(candidate) ? candidate : undefined;
}

function walk(directory: string): readonly string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => walkEntry(directory, entry));
}
function walkEntry(directory: string, entry: fs.Dirent<string>): readonly string[] {
  const item = path.join(directory, entry.name);
  if (EXCLUDED_DIRECTORIES.has(entry.name)) return [];
  return entry.isDirectory() ? walk(item) : [item];
}

function shouldInclude(file: string, options: Options, sourceRoot: string): boolean {
  return (
    sourceExtension(file) &&
    inRoot(file, sourceRoot) &&
    !excluded(file) &&
    testAllowed(file, options)
  );
}
function sourceExtension(file: string): boolean {
  return SOURCE_EXTENSIONS.has(path.extname(file)) && !/\.d\.(ts|mts|cts)$/.test(file);
}
function inRoot(file: string, root: string): boolean {
  return file.startsWith(root + path.sep) || file === root;
}
function excluded(file: string): boolean {
  return file.split(path.sep).some((part) => EXCLUDED_DIRECTORIES.has(part));
}
function testAllowed(file: string, options: Options): boolean {
  return (
    options.includeTests ||
    (!/\.(test|spec)\.[^.]+$/.test(file) &&
      !file.split(path.sep).some((part) => TEST_SEGMENTS.has(part)))
  );
}

function createProgram(files: readonly string[], options: Options): ts.Program {
  const configPath =
    options.tsconfig === undefined
      ? findTsconfig(options.root)
      : path.resolve(options.root, options.tsconfig);
  const compilerOptions =
    configPath === undefined
      ? {
          target: ts.ScriptTarget.ES2023,
          module: ts.ModuleKind.NodeNext,
          moduleResolution: ts.ModuleResolutionKind.NodeNext,
          allowJs: true,
          skipLibCheck: true,
        }
      : parsedCompilerOptions(configPath);
  return ts.createProgram({
    rootNames: [...files],
    options: { ...compilerOptions, noEmit: true, allowJs: true, skipLibCheck: true },
  });
}

function parsedCompilerOptions(configPath: string): ts.CompilerOptions {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(formatDiagnostics([diagnostic]));
      },
    },
  );
  if (parsed === undefined) throw new Error(`Could not read ${configPath}`);
  return parsed.options;
}

function collectModules(
  program: ts.Program,
  options: Options,
  files: readonly string[],
): readonly ModuleInfo[] {
  const checker = program.getTypeChecker();
  const selected = new Set(files.map((file) => path.resolve(file)));
  return program
    .getSourceFiles()
    .filter((file) => selected.has(path.resolve(file.fileName)))
    .sort((a, b) => a.fileName.localeCompare(b.fileName))
    .map((file) => moduleInfo(file, checker, options));
}

/** Runtime visibility follows ESM syntax; the checker alone also exposes type-only aliases. */
function runtimeNames(
  file: ts.SourceFile,
  checker: ts.TypeChecker,
  seen = new Set<string>(),
): readonly string[] {
  if (seen.has(file.fileName)) return [];
  const trail = new Set([...seen, file.fileName]);
  return file.statements.flatMap((statement) => statementNames(statement, checker, trail));
}
function statementNames(
  statement: ts.Statement,
  checker: ts.TypeChecker,
  seen: Set<string>,
): readonly string[] {
  if (ts.isExportDeclaration(statement)) return reexportNames(statement, checker, seen);
  if (ts.isExportAssignment(statement)) return ['default'];
  return declaredNames(statement);
}
function declaredNames(statement: ts.Statement): readonly string[] {
  if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) return [];
  if (hasModifier(statement, ts.SyntaxKind.DefaultKeyword)) return ['default'];
  return namedDeclaration(statement);
}
function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  return ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) ?? false;
}
function namedDeclaration(statement: ts.Statement): readonly string[] {
  if (ts.isFunctionDeclaration(statement)) return [statement.name?.text ?? 'default'];
  if (ts.isVariableStatement(statement))
    return statement.declarationList.declarations.flatMap(variableName);
  return [];
}
function variableName(declaration: ts.VariableDeclaration): readonly string[] {
  return ts.isIdentifier(declaration.name) ? [declaration.name.text] : [];
}
function reexportNames(
  statement: ts.ExportDeclaration,
  checker: ts.TypeChecker,
  seen: Set<string>,
): readonly string[] {
  if (statement.isTypeOnly) return [];
  if (statement.exportClause === undefined) return starNames(statement, checker, seen);
  return namedReexports(statement, checker, seen);
}
function starNames(
  statement: ts.ExportDeclaration,
  checker: ts.TypeChecker,
  seen: Set<string>,
): readonly string[] {
  const target = exportedFile(statement.moduleSpecifier, checker);
  if (target === undefined) return [];
  return runtimeNames(target, checker, seen).filter((name) => name !== 'default');
}
function namedReexports(
  statement: ts.ExportDeclaration,
  checker: ts.TypeChecker,
  seen: Set<string>,
): readonly string[] {
  const clause = statement.exportClause;
  if (clause === undefined || !ts.isNamedExports(clause)) return [];
  return clause.elements
    .filter((item) => runtimeSpecifier(item, statement, checker, seen))
    .map((item) => item.name.text);
}
function runtimeSpecifier(
  item: ts.ExportSpecifier,
  statement: ts.ExportDeclaration,
  checker: ts.TypeChecker,
  seen: Set<string>,
): boolean {
  if (item.isTypeOnly) return false;
  if (statement.moduleSpecifier === undefined) return localRuntime(item, checker, seen);
  return exportedRuntime(item, statement, checker, seen);
}
function exportedRuntime(
  item: ts.ExportSpecifier,
  statement: ts.ExportDeclaration,
  checker: ts.TypeChecker,
  seen: Set<string>,
): boolean {
  const target = exportedFile(statement.moduleSpecifier, checker);
  if (target === undefined) return false;
  return runtimeNames(target, checker, seen).includes(item.propertyName?.text ?? item.name.text);
}
function localRuntime(
  item: ts.ExportSpecifier,
  checker: ts.TypeChecker,
  seen: Set<string>,
): boolean {
  const symbol = checker.getExportSpecifierLocalTargetSymbol(item);
  return (
    symbol?.declarations?.some((declaration) => runtimeBinding(declaration, checker, seen)) ?? false
  );
}
function runtimeBinding(
  declaration: ts.Declaration,
  checker: ts.TypeChecker,
  seen: Set<string>,
): boolean {
  if (ts.isImportSpecifier(declaration)) return runtimeImportSpecifier(declaration, checker, seen);
  if (ts.isImportClause(declaration)) return runtimeImportClause(declaration, checker, seen);
  return true;
}
function runtimeImportSpecifier(
  item: ts.ImportSpecifier,
  checker: ts.TypeChecker,
  seen: Set<string>,
): boolean {
  if (item.isTypeOnly || item.parent.parent.isTypeOnly) return false;
  const target = exportedFile(item.parent.parent.parent.moduleSpecifier, checker);
  return visibleInTarget(target, item.propertyName?.text ?? item.name.text, checker, seen);
}
function runtimeImportClause(
  clause: ts.ImportClause,
  checker: ts.TypeChecker,
  seen: Set<string>,
): boolean {
  if (clause.isTypeOnly) return false;
  return visibleInTarget(
    exportedFile(clause.parent.moduleSpecifier, checker),
    'default',
    checker,
    seen,
  );
}
function visibleInTarget(
  target: ts.SourceFile | undefined,
  name: string,
  checker: ts.TypeChecker,
  seen: Set<string>,
): boolean {
  if (target === undefined) return false;
  return runtimeNames(target, checker, seen).includes(name);
}
function exportedFile(
  specifier: ts.Expression | undefined,
  checker: ts.TypeChecker,
): ts.SourceFile | undefined {
  if (specifier === undefined) return undefined;
  return checker.getSymbolAtLocation(specifier)?.declarations?.find(ts.isSourceFile);
}
function moduleInfo(file: ts.SourceFile, checker: ts.TypeChecker, options: Options): ModuleInfo {
  const relative = path.relative(options.root, file.fileName).split(path.sep).join('/');
  const symbol = checker.getSymbolAtLocation(file);
  const symbols = symbol === undefined ? [] : checker.getExportsOfModule(symbol);
  const visible = new Set(runtimeNames(file, checker));
  const functions = symbols
    .filter((item) => visible.has(item.name))
    .filter((item) => callableSymbol(item, checker))
    .map((item) => ({ id: `f_${slug(relative + ':' + item.name)}`, name: item.name }))
    .sort((left, right) => left.name.localeCompare(right.name));
  return {
    file: file.fileName,
    id: `m_${slug(relative)}`,
    directory: path.dirname(relative),
    functions,
    exports: new Map(functions.map((item) => [item.name, item])),
  };
}
function callableSymbol(symbol: ts.Symbol, checker: ts.TypeChecker): boolean {
  const resolved = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const declaration = resolved.valueDeclaration ?? resolved.declarations?.[0];
  if (declaration === undefined) return false;
  return checker.getTypeOfSymbolAtLocation(resolved, declaration).getCallSignatures().length > 0;
}

type ScanCounts = {
  external: number;
  nonCode: number;
  outsideScope: number;
  unresolved: number;
  unsupported: number;
};
type EdgeContext = {
  program: ts.Program;
  byFile: ReadonlyMap<string, ModuleInfo>;
  edges: ImportEdge[];
  counts: ScanCounts;
};
function collectEdges(
  program: ts.Program,
  modules: readonly ModuleInfo[],
): { readonly edges: readonly ImportEdge[]; readonly counts: ScanCounts } {
  const context: EdgeContext = {
    program,
    byFile: new Map(modules.map((item) => [path.normalize(item.file), item])),
    edges: [],
    counts: { external: 0, nonCode: 0, outsideScope: 0, unresolved: 0, unsupported: 0 },
  };
  modules.forEach((source) => scanModule(source, context));
  return { edges: dedupeEdges(context.edges), counts: context.counts };
}
function scanModule(source: ModuleInfo, context: EdgeContext): void {
  context.program
    .getSourceFile(source.file)
    ?.statements.forEach((statement) => scanStatement(statement, source, context));
}
function scanStatement(statement: ts.Statement, source: ModuleInfo, context: EdgeContext): void {
  if (ts.isImportDeclaration(statement)) scanImport(statement, source, context);
  if (ts.isExportDeclaration(statement)) scanReexport(statement, source, context);
}
function scanImport(
  statement: ts.ImportDeclaration,
  source: ModuleInfo,
  context: EdgeContext,
): void {
  const clause = statement.importClause;
  if (clause === undefined || clause.isTypeOnly) return;
  const target = resolveTarget(statement.moduleSpecifier, source, context);
  if (target === undefined) return;
  addImportEdges(clause, source, target, context.edges);
}
function scanReexport(
  statement: ts.ExportDeclaration,
  source: ModuleInfo,
  context: EdgeContext,
): void {
  if (statement.isTypeOnly || statement.moduleSpecifier === undefined) return;
  const target = resolveTarget(statement.moduleSpecifier, source, context);
  if (target === undefined) return;
  addReexportEdges(statement, source, target, context);
}
function resolveTarget(
  specifier: ts.Expression,
  source: ModuleInfo,
  context: EdgeContext,
): ModuleInfo | undefined {
  if (!ts.isStringLiteral(specifier)) return undefined;
  const resolved = ts.resolveModuleName(
    specifier.text,
    source.file,
    context.program.getCompilerOptions(),
    ts.sys,
  ).resolvedModule;
  if (resolved === undefined) return unresolvedTarget(specifier.text, context.counts);
  return classifyTarget(resolved, context);
}
function unresolvedTarget(specifier: string, counts: ScanCounts): undefined {
  if (isBuiltin(specifier)) counts.external += 1;
  else countUnresolved(specifier, counts);
  return undefined;
}
function countUnresolved(specifier: string, counts: ScanCounts): void {
  if (/\.(css|scss|sass|less|json|svg|png|jpg|jpeg|webp|woff2?)(\?.*)?$/.test(specifier))
    counts.nonCode += 1;
  else counts.unresolved += 1;
}
function classifyTarget(
  resolved: ts.ResolvedModuleFull,
  context: EdgeContext,
): ModuleInfo | undefined {
  const target = context.byFile.get(path.normalize(resolved.resolvedFileName));
  if (target !== undefined) return target;
  countExcluded(resolved, context.counts);
  return undefined;
}
function countExcluded(resolved: ts.ResolvedModuleFull, counts: ScanCounts): void {
  if (resolved.isExternalLibraryImport) counts.external += 1;
  else counts.outsideScope += 1;
}
function addImportEdges(
  clause: ts.ImportClause,
  source: ModuleInfo,
  target: ModuleInfo,
  edges: ImportEdge[],
): void {
  if (clause.name !== undefined) addExportEdge(source, target, 'default', clause.name.text, edges);
  if (clause.namedBindings !== undefined) addBindings(clause.namedBindings, source, target, edges);
}
function addBindings(
  bindings: ts.NamedImportBindings,
  source: ModuleInfo,
  target: ModuleInfo,
  edges: ImportEdge[],
): void {
  if (ts.isNamespaceImport(bindings)) {
    addNamespace(source, target, bindings.name.text, edges);
    return;
  }
  bindings.elements
    .filter((item) => !item.isTypeOnly)
    .forEach((item) =>
      addExportEdge(
        source,
        target,
        item.propertyName?.text ?? item.name.text,
        item.name.text,
        edges,
      ),
    );
}
function addNamespace(
  source: ModuleInfo,
  target: ModuleInfo,
  name: string,
  edges: ImportEdge[],
): void {
  target.exports.forEach((_, exported) =>
    addExportEdge(source, target, exported, `${name}.${exported}`, edges),
  );
}
function addReexportEdges(
  statement: ts.ExportDeclaration,
  source: ModuleInfo,
  target: ModuleInfo,
  context: EdgeContext,
): void {
  if (statement.exportClause === undefined) {
    addStar(source, target, context.edges);
    return;
  }
  addExportClause(statement.exportClause, source, target, context);
}
function addStar(source: ModuleInfo, target: ModuleInfo, edges: ImportEdge[]): void {
  [...target.exports.keys()]
    .filter((name) => name !== 'default')
    .forEach((name) => addExportEdge(source, target, name, name, edges));
}
function addExportClause(
  clause: ts.NamedExportBindings,
  source: ModuleInfo,
  target: ModuleInfo,
  context: EdgeContext,
): void {
  if (!ts.isNamedExports(clause)) {
    context.counts.unsupported += 1;
    return;
  }
  clause.elements
    .filter((item) => !item.isTypeOnly)
    .forEach((item) =>
      addExportEdge(
        source,
        target,
        item.propertyName?.text ?? item.name.text,
        item.name.text,
        context.edges,
      ),
    );
}

function addExportEdge(
  source: ModuleInfo,
  target: ModuleInfo,
  exported: string,
  imported: string,
  edges: ImportEdge[],
): void {
  const targetFunction = target.exports.get(exported);
  if (targetFunction !== undefined)
    edges.push({
      id: `w_${slug(source.id + ':' + target.id + ':' + targetFunction.id + ':' + imported)}`,
      source,
      target,
      targetFunction,
      imported,
    });
}

function dedupeEdges(edges: readonly ImportEdge[]): readonly ImportEdge[] {
  return [
    ...new Map(
      edges.map((edge) => [
        `${edge.source.id}:${edge.target.id}:${edge.targetFunction.id}:${edge.imported}`,
        edge,
      ]),
    ).values(),
  ].sort((left, right) => left.id.localeCompare(right.id));
}

function render(
  options: Options,
  modules: readonly ModuleInfo[],
  edges: readonly ImportEdge[],
): string {
  const groups = directoryTree(modules);
  const declarations = modules.map(
    (item) =>
      `node @${item.id} module ${quote(path.basename(item.file))} {\n${item.functions.map((fn) => `  member @${fn.id} ${quote(fn.name)} type="function" visibility=public`).join('\n')}\n}`,
  );
  const wires = edges.map(
    (edge) =>
      `wire @${edge.id} @${edge.source.id} -> @${edge.target.id}.@${edge.targetFunction.id} ${quote(`imports ${edge.imported}`)} kind=imports`,
  );
  const section = `section @repository "Repository map" mode=modules {\n${renderTree(groups)}\n  ${edges.map((edge) => `connect @${edge.id}`).join(' ')}\n}`;
  return (
    [
      `canvas 1 collection @repository ${quote(path.basename(options.root))} {`,
      ...declarations,
      ...wires,
      section,
      '}',
    ].join('\n') + '\n'
  );
}

type Directory = {
  readonly name: string;
  readonly modules: readonly ModuleInfo[];
  readonly children: readonly Directory[];
};
function directoryTree(modules: readonly ModuleInfo[]): Directory {
  const root: MutableDirectory = { name: '.', modules: [], children: new Map() };
  modules.forEach((module) => addDirectoryModule(root, module));
  return freezeDirectory(root);
}
function addDirectoryModule(root: MutableDirectory, module: ModuleInfo): void {
  const parts = module.directory === '.' ? [] : module.directory.split('/');
  const destination = parts.reduce(directoryChild, root);
  destination.modules.push(module);
}
function directoryChild(parent: MutableDirectory, name: string): MutableDirectory {
  const child = parent.children.get(name) ?? { name, modules: [], children: new Map() };
  parent.children.set(name, child);
  return child;
}
type MutableDirectory = {
  name: string;
  modules: ModuleInfo[];
  children: Map<string, MutableDirectory>;
};
function freezeDirectory(directory: MutableDirectory): Directory {
  return {
    name: directory.name,
    modules: [...directory.modules].sort((a, b) => a.file.localeCompare(b.file)),
    children: [...directory.children.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(freezeDirectory),
  };
}

function renderTree(directory: Directory, parent = ''): string {
  const children = directory.children.map((child) => renderGroup(child, parent)).join('\n');
  const current = directory.modules.map((module) => `show @${module.id}`).join('\n  ');
  return [current, children].filter(Boolean).join('\n  ');
}

function renderGroup(directory: Directory, parent: string): string {
  const groupId = `g_${slug(parent + '/' + directory.name)}`;
  const inside = renderTree(directory, parent + '/' + directory.name);
  return `group @${groupId} ${quote(directory.name)} {\n  ${inside}\n}`;
}

/** Stable content-independent IDs avoid positional numbering when files are added. */
function slug(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 20);
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): string {
  return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => process.cwd(),
    getCanonicalFileName: (file) => file,
    getNewLine: () => '\n',
  });
}

main();
