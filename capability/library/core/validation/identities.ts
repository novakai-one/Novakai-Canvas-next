import type { Diagnostic } from '../../contract/errors.js';
import { diagnoseWhen } from './outcomes.js';

/**
 * Reports every repeated key within one scope. The first occurrence of a key is fine; each later
 * occurrence gives one `duplicate` diagnostic at `<path>.<key>`, in input order.
 *
 * @param items - The records in the scope.
 * @param keyOf - Reads a record's identity.
 * @param path - The scope's path, for example `catalog.folders`.
 * @returns The diagnostics; empty when every key is unique.
 */
export function duplicateIssues<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  path: string,
): readonly Diagnostic[] {
  const keys = items.map(keyOf);
  return keys.flatMap((key, index) =>
    diagnoseWhen(
      keys.indexOf(key) !== index,
      'duplicate',
      `${path}.${key}`,
      'Identity must be unique in this scope',
    ),
  );
}
