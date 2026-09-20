import type { Span, Declaration } from '../../contract/records/syntax.js';
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
      .toSorted((a, b) => b.path.length - a.path.length)[0]?.span ?? fallback
  );
}
/** Stable IDs produce diagnostic anchors without depending on formatting or declaration order. */
export function sourceMappings(item: Declaration, prefix = ''): readonly SourceMapping[] {
  const name = mappingPath(item, prefix);
  const own = [
    { path: name, span: item.span },
    ...(item.kind === 'type' && item.fields.expression !== undefined
      ? [{ path: `${name}.expression`, span: item.fields.expression.span }]
      : []),
    ...item.children.flatMap((child) => sourceMappings(child, name)),
  ];
  return own;
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
