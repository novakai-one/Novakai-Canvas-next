import type { Diagnostic } from '../../contract/errors.js';
import { diagnoseWhen } from './issues.js';

/**
 * Reports every occurrence after the first with the same key, preserving input order.
 * The caller chooses the identity scope and supplies its diagnostic path. Pure and
 * repeatable; validate/plan return these failures and Authoring owns correction/commit.
 */
export function duplicates<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  path: string,
): readonly Diagnostic[] {
  const keys = items.map(keyOf);
  return keys.flatMap((key, index) => {
    const isRepeated = keys.indexOf(key) !== index;
    return diagnoseWhen(
      isRepeated,
      'duplicate',
      `${path}.${key}`,
      'Identity must be unique in this scope',
    );
  });
}
