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
 *
 * @param items - The records in the scope.
 * @param keyOf - Reads a record's identity.
 * @param path - The scope's path, for example `catalog.folders`.
 * @returns The diagnostics; empty when every key is unique.
 * @throws Never for parsed records.
 */
export function duplicateIssues<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  path: string,
): readonly Diagnostic[] {
  const keys = items.map(keyOf);
  const seen = new Set<string>();
  return keys.flatMap(
    /** Reports this key if seen before. */ (key) => repeatIssue(key, seen, path),
  );
}

/** A `duplicate` diagnostic when `key` is already in `seen`; then records `key` as seen. */
function repeatIssue(key: string, seen: Set<string>, path: string): readonly Diagnostic[] {
  const repeated = seen.has(key);
  seen.add(key);
  return diagnoseWhen(repeated, {
    code: 'duplicate',
    path: `${path}.${key}`,
    message: 'Identity must be unique in this scope',
  });
}
