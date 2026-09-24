/*
 * Lowering layout: a collection's or section's layout attributes and its `rank`, `align`,
 * `before` and `below` constraints become one plain layout record for Model. No side effects.
 * Language owns correcting the source; Authoring owns commit recovery.
 */
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

/** The declarations that are layout constraints. */
const constraintKinds = ['rank', 'align', 'before', 'below'];

/**
 * Whether a declaration is a layout constraint (`rank`, `align`, `before` or `below`).
 *
 * @param declaration - Any parsed declaration.
 * @returns `true` for a constraint.
 * @throws Never.
 */
export function isConstraint(declaration: Declaration): boolean {
  return constraintKinds.includes(declaration.kind);
}

/**
 * Lowers layout attributes and constraints. Missing attributes take their defaults: the
 * algorithm `fallback`, direction `right` and gap `normal`; `columns` is left out when not
 * written. Constraint targets keep their written order.
 *
 * @param fields - The collection's or section's parsed fields.
 * @param children - Its declarations; only constraints are read.
 * @param fallback - The algorithm when `layout=` is not written; defaults to `flow`.
 * @returns The deep-frozen layout record; or `validation-failed` with an `invalid-value`
 * diagnostic for a non-text attribute, a constraint without a target list, or a target that is
 * not a plain object, `group:` or `section:` reference.
 * @throws Never.
 */
export function lowerLayout(
  fields: Fields,
  children: readonly Declaration[],
  fallback = 'flow',
): Result<RawRecord> {
  return protect(
    /** Builds the layout record. */
    () => {
      return {
        ...optional('columns', fields.columns?.value),
        algorithm: textOr(fields, 'layout', fallback),
        direction: textOr(fields, 'direction', defaults.direction),
        gap: textOr(fields, 'gap', defaults.gap),
        constraints: children.filter(isConstraint).map(lowerConstraint),
      };
    },
  );
}

/**
 * The layout algorithm a section `mode` uses by default.
 *
 * @param mode - A section mode.
 * @returns The mode's algorithm, or `flow` for an unknown mode.
 * @throws Never.
 */
export function modeLayout(mode: string): string {
  return layouts[mode] ?? 'flow';
}

/** One constraint: its kind and its targets in written order. */
function lowerConstraint(declaration: Declaration): RawRecord {
  return {
    kind: declaration.kind,
    targets: list(declaration.fields, 'targets').map(
      /** Lowers one target. */ (value) => lowerTarget(value, declaration.span),
    ),
  };
}

/**
 * One constraint target: `{ kind: 'group' | 'section', id }` for a `group:` or `section:`
 * reference, otherwise `{ kind: 'object', id }`. It must be a reference.
 */
function lowerTarget(value: SyntaxValue, span: Span): RawRecord {
  if (!isReference(value))
    reject('invalid-value', span, 'Reference', 'Constraint needs reference targets');
  checkTarget(value, span);
  return { kind: value.namespace ?? 'object', id: value.id };
}

/** Rejects a target with a member or section part, which a layout constraint cannot place. */
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
