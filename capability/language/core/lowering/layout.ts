/** Pure semantic layout lowering is protected by Language protect; callers correct source and retry without partial writes. */
import type {
  Declaration,
  Fields,
  SyntaxValue,
  Span,
  Reference,
} from '../../contract/records/syntax.js';
import { defaults, layouts } from '../vocabulary/defaults.js';
import { isReference } from '../parsing/value-types.js';
import type { Result } from '../../contract/errors.js';
import { protect, reject } from '../validation/outcomes.js';
import { list, optional, textOr, type RawRecord } from './fields.js';
const constraintKinds = ['rank', 'align', 'before', 'below'];
/** Select constraint kinds without writes; Language owns correction and Authoring owns commit recovery. */
export function isConstraint(declaration: Declaration): boolean {
  return constraintKinds.includes(declaration.kind);
}
/** Lower semantic intent without writes; Language owns source correction and Authoring owns commit recovery. */
export function lowerLayout(
  fields: Fields,
  children: readonly Declaration[],
  fallback = 'flow',
): Result<RawRecord> {
  return protect(() => {
    return {
      ...optional('columns', fields.columns?.value),
      algorithm: textOr(fields, 'layout', fallback),
      direction: textOr(fields, 'direction', defaults.direction),
      gap: textOr(fields, 'gap', defaults.gap),
      constraints: children.filter(isConstraint).map(lowerConstraint),
    };
  });
}
/** Read mode defaults without writes; Language owns correction and Authoring owns commit recovery. */
export function modeLayout(mode: string): string {
  return layouts[mode] ?? 'flow';
}
/** Constraint target order is authored meaning and must survive round trips exactly. */
function lowerConstraint(declaration: Declaration): RawRecord {
  return {
    kind: declaration.kind,
    targets: list(declaration.fields, 'targets').map((value) =>
      lowerTarget(value, declaration.span),
    ),
  };
}
/** Explicit group/section selectors remain namespace-qualified; ordinary references target objects. */
function lowerTarget(value: SyntaxValue, span: Span): RawRecord {
  if (!isReference(value))
    reject('invalid-value', span, 'Reference', 'Constraint needs reference targets');
  checkTarget(value, span);
  return { kind: value.namespace ?? 'object', id: value.id };
}

/** Descendant and section-address selectors cannot be represented by a relative layout target. */
function checkTarget(value: Reference, span: Span): void {
  if (value.member !== undefined || value.section !== undefined)
    reject(
      'invalid-value',
      span,
      'Plain object or explicit group/section reference',
      'Constraint target cannot select a member or section address',
      value.id,
    );
}
