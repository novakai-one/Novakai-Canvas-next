import type {
  Span,
  Declaration,
  Document,
  LocatedValue,
  Reference,
  Token,
} from '../../contract/records/syntax.js';
import type { SourceMapping } from '../../contract/records/requests.js';
import { LanguageFault } from '../../contract/errors.js';
import { field, id } from './fields.js';
import type { OwnerDiagnostic, Result, Diagnostic } from '../../contract/errors.js';
interface OwnerError {
  readonly code: 'validation-failed';
  readonly diagnostics: readonly [OwnerDiagnostic, ...OwnerDiagnostic[]];
}
/** Translate structured Model paths to source spans; never parse human error-message strings. */
export function ownerValue<T>(
  result: Result<T, OwnerError>,
  mappings: readonly SourceMapping[],
  fallback: Span,
): T {
  if (result.ok) return structuredClone(result.value);
  const [first, ...remaining] = result.error.diagnostics;
  return rejectOwner(first, remaining, mappings, fallback);
}
/** Most-specific owner path wins; fallback is the complete source when no narrower target exists. */
function nearestSpan(path: string, mappings: readonly SourceMapping[], fallback: Span): Span {
  return (
    mappings
      .filter((mapping) => path.includes(mapping.path))
      .toSorted((a, b) => {
        const pathOrder = b.path.length - a.path.length;
        if (pathOrder !== 0) return pathOrder;
        return spanWidth(a.span) - spanWidth(b.span);
      })[0]?.span ?? fallback
  );
}

function spanWidth(span: Span): number {
  return span.end.offset - span.start.offset;
}
/** Stable IDs produce diagnostic anchors without depending on formatting or declaration order. */
export function sourceMappings(item: Declaration, prefix = ''): readonly SourceMapping[] {
  if (isMultiIdType(item)) return typeIdMappings(item, prefix);
  const name = mappingPath(item, prefix);
  const expression = item.kind === 'type' ? item.fields.expression : undefined;
  return [
    { path: name, span: item.span },
    ...contentMappings(name, item),
    ...entryMappings(name, item),
    ...expressionMapping(name, expression),
    ...item.children.flatMap((child) => sourceMappings(child, name)),
  ];
}
/** v2 facts live under declare; their canonical paths are already top-level. */
export function documentMappings(document: Document): readonly SourceMapping[] {
  const declared = (document.declare?.children ?? []).flatMap((child) => sourceMappings(child));
  return [...declared, ...sourceMappings(document.declaration)];
}
/** v2 `type @A @B` carries no own id field; each listed id anchors its own definition instead. */
function isMultiIdType(item: Declaration): boolean {
  return item.kind === 'type' && item.fields.id === undefined;
}
function typeIdMappings(item: Declaration, prefix: string): readonly SourceMapping[] {
  return (field(item.fields, 'ids').items ?? []).map((value) => typeIdMapping(value, prefix));
}
function typeIdMapping(value: LocatedValue, prefix: string): SourceMapping {
  return { path: typeDefinitionPath(prefix, (value.value as Reference).id), span: value.span };
}
/** A node-nested member keeps the `${nodeId}-${typeId}` definition id; a top-level type uses the bare id. */
function typeDefinitionPath(prefix: string, typeId: string): string {
  if (prefix === '') return `definitions.${typeId}`;
  return `definitions.${prefix.slice(prefix.lastIndexOf('.') + 1)}-${typeId}`;
}

/** Change entries are numbered across all op children in source order, as lowerV2Changes flattens them. */
function entryMappings(name: string, item: Declaration): readonly SourceMapping[] {
  if (item.kind !== 'change') return [];
  return item.children
    .flatMap((op) => op.fields.refs?.items ?? [])
    .map((ref, index) => ({ path: `${name}.entries.${index}`, span: ref.span }));
}

function contentMappings(name: string, item: Declaration): readonly SourceMapping[] {
  return [operationMapping(name, item), ...typeMappings(name, item)].filter(isMapping);
}

function operationMapping(name: string, item: Declaration): SourceMapping | undefined {
  const operation = item.fields.operation;
  return operation === undefined ? undefined : { path: `${name}.operation`, span: operation.span };
}

function typeMappings(name: string, item: Declaration): readonly SourceMapping[] {
  if (item.kind === 'member') return propertyMapping(name, 'type', item.fields.type);
  if (item.kind !== 'signature') return [];
  return [
    ...propertyMapping(name, 'returns', item.fields.returns),
    ...(item.fields.parameters?.items ?? []).flatMap((parameter, index) =>
      parameterMappings(name, parameter, index),
    ),
  ];
}

function propertyMapping(
  name: string,
  property: string,
  value: LocatedValue | undefined,
): readonly SourceMapping[] {
  return value === undefined ? [] : [{ path: `${name}.${property}`, span: value.span }];
}

function parameterMappings(
  name: string,
  parameter: LocatedValue,
  index: number,
): readonly SourceMapping[] {
  if (typeof parameter.value === 'string')
    return [{ path: `${name}.parameters.${index}`, span: parameter.span }];
  const tuple = parameter.items ?? [];
  return [
    parameterPartMapping(name, index, 'name', tuple[0]),
    parameterPartMapping(name, index, 'type', tuple[1]),
  ].filter(isMapping);
}

function parameterPartMapping(
  name: string,
  index: number,
  part: 'name' | 'type',
  value: LocatedValue | undefined,
): SourceMapping | undefined {
  return value === undefined
    ? undefined
    : { path: `${name}.parameters.${index}.${part}`, span: value.span };
}

function isMapping(value: SourceMapping | undefined): value is SourceMapping {
  return value !== undefined;
}

function expressionMapping(
  name: string,
  expression: LocatedValue | undefined,
): readonly SourceMapping[] {
  if (expression === undefined) return [];
  return [
    ...expressionReferenceMappings(expression.tokens ?? [], `${name}.expression`),
    { path: `${name}.expression`, span: expression.span },
  ];
}

interface MappingParse {
  readonly next: number;
  readonly mappings: readonly SourceMapping[];
  readonly items: number;
}

function expressionReferenceMappings(
  tokens: readonly Token[],
  path: string,
): readonly SourceMapping[] {
  if (tokens.length === 0) return [];
  return hasTopLevelUnion(tokens)
    ? mapUnion(tokens, 0, path).mappings
    : mapAtom(tokens, 0, path).mappings;
}

function hasTopLevelUnion(tokens: readonly Token[]): boolean {
  let depth = 0;
  return tokens.some((token) => {
    depth = unionDepth(token.text, depth);
    return depth === 0 && token.text === '|';
  });
}

function unionDepth(token: string, depth: number): number {
  return depth + (unionDepthDelta[token] ?? 0);
}

const unionDepthDelta: Readonly<Record<string, number>> = { '(': 1, ')': -1 };

function mapUnion(tokens: readonly Token[], start: number, path: string): MappingParse {
  const mappings: SourceMapping[] = [];
  let next = start;
  let item = 0;
  let continueUnion = true;
  while (continueUnion) {
    const parsed = mapAtom(tokens, next, `${path}.items.${item}`);
    mappings.push(...parsed.mappings);
    next = parsed.next;
    continueUnion = tokens[next]?.text === '|';
    next += Number(continueUnion);
    item += Number(continueUnion);
  }
  return { next, mappings, items: item + 1 };
}

function mapAtom(tokens: readonly Token[], start: number, path: string): MappingParse {
  const token = tokens[start];
  if (token?.text === '(') return mapParenthesized(tokens, start, path);
  if (token?.text.startsWith('@') === true) return mapReference(token, start, path);
  return { next: atomEnd(tokens, start), mappings: [], items: 1 };
}

function mapParenthesized(tokens: readonly Token[], start: number, path: string): MappingParse {
  const nested = mapUnion(tokens, start + 1, path);
  const mappings = nested.items === 1 ? collapseSingleItem(nested.mappings, path) : nested.mappings;
  return { next: nested.next + 1, mappings, items: nested.items };
}

function mapReference(token: Token, start: number, path: string): MappingParse {
  return { next: start + 1, mappings: [{ path, span: token.span }], items: 1 };
}

function collapseSingleItem(
  mappings: readonly SourceMapping[],
  path: string,
): readonly SourceMapping[] {
  const prefix = `${path}.items.0`;
  return mappings.map((mapping) =>
    mapping.path === prefix || mapping.path.startsWith(`${prefix}.`)
      ? { ...mapping, path: `${path}${mapping.path.slice(prefix.length)}` }
      : mapping,
  );
}

function atomEnd(tokens: readonly Token[], start: number): number {
  let next = start + 1;
  while (next < tokens.length && !['|', ')'].includes(tokens[next]?.text ?? '')) next += 1;
  return next;
}
/** Match canonical owner path namespaces, including nested content, rows and groups. */
function mappingPath(item: Declaration, prefix: string): string {
  if (item.kind === 'collection') return '';
  if (item.fields.id === undefined) return prefix;
  return ownedPath(item, prefix);
}
/** Canonical top-level namespaces supersede the syntactic collection wrapper. */
function ownedPath(item: Declaration, prefix: string): string {
  const namespaces: Readonly<Record<string, string>> = {
    node: 'objects',
    wire: 'relationships',
    section: 'sections',
    asset: 'assets',
    source: 'sources',
    type: 'definitions',
    change: 'changes',
  };
  const top = namespaces[item.kind];
  if (top !== undefined) return `${top}.${id(item.fields)}`;
  return descendantPath(item, prefix);
}
/** Nested canonical arrays are named explicitly so nearest-owner diagnostics point to useful source spans. */
function descendantPath(item: Declaration, prefix: string): string {
  const namespaces: Readonly<Record<string, string>> = {
    port: 'ports',
    row: 'rows',
    group: 'groups',
    event: 'sequence',
    fragment: 'sequence',
    branch: 'branches',
  };
  const name = namespaces[item.kind] ?? 'content';
  return `${prefix}.${name}.${id(item.fields)}`;
}

/** Translate every issue while preserving order and non-emptiness at the compiler boundary. */
function rejectOwner(
  first: OwnerDiagnostic,
  remaining: readonly OwnerDiagnostic[],
  mappings: readonly SourceMapping[],
  fallback: Span,
): never {
  throw new LanguageFault([
    sourceDiagnostic(first, mappings, fallback),
    ...remaining.map((issue) => sourceDiagnostic(issue, mappings, fallback)),
  ]);
}
/** Enrichment adds a source span; it never replaces the original owner code or path. */
function sourceDiagnostic(
  issue: OwnerDiagnostic,
  mappings: readonly SourceMapping[],
  fallback: Span,
): Diagnostic {
  return {
    code: 'domain',
    target: issue.path,
    span: nearestSpan(issue.path, mappings, fallback),
    expected: issue.code,
    message: issue.message,
    source: issue,
    recovery: 'Correct the referenced diagram declaration; check again before Authoring admission.',
  };
}
