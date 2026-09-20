import type { Span, Declaration, LocatedValue, Token } from '../../contract/records/syntax.js';
import type { SourceMapping } from '../../contract/records/requests.js';
import { LanguageFault } from '../../contract/errors.js';
import { id } from './fields.js';
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
  const name = mappingPath(item, prefix);
  const expression = item.kind === 'type' ? item.fields.expression : undefined;
  const own = [
    { path: name, span: item.span },
    ...contentMappings(name, item),
    ...expressionMapping(name, expression),
    ...item.children.flatMap((child) => sourceMappings(child, name)),
  ];
  return own;
}

function contentMappings(name: string, item: Declaration): readonly SourceMapping[] {
  const mappings: SourceMapping[] = [];
  const operation = item.fields.operation;
  if (operation !== undefined) mappings.push({ path: `${name}.operation`, span: operation.span });
  if (item.kind !== 'signature') {
    const type = item.kind === 'member' ? item.fields.type : undefined;
    if (type !== undefined) mappings.push({ path: `${name}.type`, span: type.span });
    return mappings;
  }
  const returns = item.fields.returns;
  if (returns !== undefined) mappings.push({ path: `${name}.returns`, span: returns.span });
  const parameters = item.fields.parameters;
  (parameters?.items ?? []).forEach((parameter, index) => {
    if (typeof parameter.value === 'string') {
      mappings.push({ path: `${name}.parameters.${index}`, span: parameter.span });
      return;
    }
    const tuple = parameter.items ?? [];
    if (tuple[0] !== undefined)
      mappings.push({ path: `${name}.parameters.${index}.name`, span: tuple[0].span });
    if (tuple[1] !== undefined)
      mappings.push({ path: `${name}.parameters.${index}.type`, span: tuple[1].span });
  });
  return mappings;
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
