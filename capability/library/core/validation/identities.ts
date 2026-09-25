/*
 * Duplicate-ID detection within one scope (folders, entries, collections, sections, objects,
 * visible sections, recent visits). Pure; the caller corrects the input, and Authoring owns commit
 * and recovery.
 */
import type { Diagnostic } from '../../contract/errors.js';
import { diagnoseWhen } from './outcomes.js';

/**
 * Reports every repeated key within one scope. The first occurrence of a key is fine; each later
 * occurrence gives one `duplicate` diagnostic at `<path>.<key>`, in input order.
 */
export function duplicateIssues<T, K extends string>(
  items: readonly T[],
  keyOf: (item: T) => K,
  path: string,
): readonly Diagnostic[] {
  const keys = items.map(keyOf);
  const firstIndex = firstIndexes(keys);
  return keys.flatMap((key, index) =>
    diagnoseWhen(firstIndex.get(key) !== index, {
      code: 'duplicate',
      path: `${path}.${key}`,
      message: 'Identity must be unique in this scope',
    }),
  );
}

/** Each key's first position in `keys`, built in one pass (later repeats do not overwrite it). */
function firstIndexes<K extends string>(keys: readonly K[]): ReadonlyMap<K, number> {
  return new Map(keys.map((key, index) => [key, index] as const).toReversed());
}
