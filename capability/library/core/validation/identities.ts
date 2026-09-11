import type { Diagnostic } from '../../contract/errors.js';
import { diagnoseWhen } from './outcomes.js';
/** Report repeated keys after their first occurrence within the caller's chosen scope. */
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
