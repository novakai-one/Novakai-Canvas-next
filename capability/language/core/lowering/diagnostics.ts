import type { Span, Declaration } from '../../contract/records/syntax.js';
import type { SourceMapping } from '../../contract/records/requests.js';
import { LanguageFault } from '../../contract/errors.js';
import { id } from './fields.js';
interface OwnerDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}
type OwnerOutcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly diagnostics: readonly OwnerDiagnostic[] };
/** Translate structured Model paths to source spans; never parse human error-message strings. */
export function ownerValue<T>(
  result: OwnerOutcome<T>,
  mappings: readonly SourceMapping[],
  fallback: Span,
): T {
  if (result.ok) return structuredClone(result.value);
  throw new LanguageFault(
    result.diagnostics.map((issue) => ({
      code: 'domain',
      target: issue.path,
      span: nearestSpan(issue.path, mappings, fallback),
      expected: issue.code,
      message: issue.message,
      recovery:
        'Correct the referenced diagram declaration; check again before Authoring admission.',
    })),
  );
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
  return [
    { path: name, span: item.span },
    ...item.children.flatMap((child) => sourceMappings(child, name)),
  ];
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
