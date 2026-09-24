import type { Diagnostic } from '../../contract/errors.js';
import { diagnoseWhen } from './issues.js';

/**
 * Reports every item whose key already appeared earlier in the list. The first occurrence is not
 * reported; each later one gives a `duplicate` diagnostic at `<path>.<key>`, "Identity must be
 * unique in this scope", in list order. The caller chooses the scope (which list) and its path.
 *
 * @param items - The items to check.
 * @param keyOf - Returns an item's key; called once per item, in order.
 * @param path - The diagnostic path prefix for this scope.
 * @returns The diagnostics, or an empty list.
 * @throws Whatever `keyOf` throws.
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
