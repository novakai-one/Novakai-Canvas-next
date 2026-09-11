import type { Declaration, Fields, SyntaxValue } from '../../contract/records/syntax.js';
import { layouts } from '../vocabulary/defaults.js';
import { isReference } from '../parsing/value-types.js';
import { reject } from '../validation/outcomes.js';
import { list, textOr, type RawRecord } from './fields.js';
const constraintKinds = ['rank', 'align', 'before', 'below'];
/** Determine constraints by their fixed construct kind, never by arbitrary properties. */
export function isConstraint(declaration: Declaration): boolean {
  return constraintKinds.includes(declaration.kind);
}
/** Layout intention remains semantic; no coordinate is calculated or requested by Language. */
export function lowerLayout(
  fields: Fields,
  children: readonly Declaration[],
  fallback = 'flow',
): RawRecord {
  return {
    algorithm: textOr(fields, 'layout', fallback),
    direction: textOr(fields, 'direction', 'right'),
    gap: textOr(fields, 'gap', 'normal'),
    constraints: children.filter(isConstraint).map(lowerConstraint),
  };
}
/** Mode-specific omitted layout follows the shared vocabulary, not a renderer guess. */
export function modeLayout(mode: string): string {
  return layouts[mode] ?? 'flow';
}
/** Constraint target order is authored meaning and must survive round trips exactly. */
function lowerConstraint(declaration: Declaration): RawRecord {
  return { kind: declaration.kind, targets: list(declaration.fields, 'targets').map(lowerTarget) };
}
/** Explicit group/section selectors remain namespace-qualified; ordinary references target objects. */
function lowerTarget(value: SyntaxValue): RawRecord {
  if (!isReference(value))
    reject(
      'invalid-value',
      { start: { offset: 0, line: 1, column: 1 }, end: { offset: 0, line: 1, column: 1 } },
      'Reference',
      'Constraint needs reference targets',
    );
  return { kind: value.namespace ?? 'object', id: value.id };
}
