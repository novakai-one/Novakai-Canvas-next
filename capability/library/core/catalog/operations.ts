/*
 * Applying one parsed catalog change. Each change returns a new catalog and never changes the one
 * given. References are checked later, on the final candidate. Pure; Authoring owns the commit
 * and recovery.
 */
import type { Catalog, CatalogEntry, Folder } from '../../contract/records/catalog.js';
import type { CatalogChange, ChangeOf } from '../../contract/records/change.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../validation/outcomes.js';
import { entryKey, folderKey, hasEntry, hasFolder } from '../validation/lookups.js';
import { removeFolder } from './removal.js';

/**
 * Applies one parsed catalog change and returns the new catalog.
 *
 * - `create-folder` / `register`: appended; an existing ID is `already-exists`.
 * - `replace-folder` / `replace-entry`: replaced in place; a missing ID is `not-found`.
 * - `remove-folder`: see `removeFolder` (`not-found`, `folder-not-empty`, or rehomed contents).
 * - `unregister`: the entry is removed; a missing one is `not-found`.
 *
 * References are not checked here, so a later change in the batch may repair them; planning
 * validates the final catalog. A failure stops the batch.
 */
export function applyOperation(catalog: Catalog, change: CatalogChange): Result<Catalog> {
  switch (change.op) {
    case 'create-folder':
      return writeFolder(catalog, change.value, 'create');
    case 'replace-folder':
      return writeFolder(catalog, change.value, 'replace');
    case 'remove-folder':
      return removeFolder(catalog, change);
    case 'register':
      return writeEntry(catalog, change.value, 'create');
    case 'replace-entry':
      return writeEntry(catalog, change.value, 'replace');
    case 'unregister':
      return unregister(catalog, change);
    default:
      return unsupported(change);
  }
}

/** Whether a write creates a record or replaces an existing one. */
type WriteMode = 'create' | 'replace';

/**
 * The failure for a change of no known kind. Parsing makes this unreachable; the `never` type
 * proves every kind above is handled.
 */
function unsupported(change: never): Result<Catalog> {
  void change;
  return failure({ code: 'shape', path: 'changes', message: 'Unsupported catalog operation' });
}

/** Creates or replaces a complete folder (covering rename, move and reorder; no field patches). */
function writeFolder(catalog: Catalog, value: Folder, mode: WriteMode): Result<Catalog> {
  const exists = hasFolder(catalog.folders, value.id);
  const identity = checkIdentity(mode, exists, `catalog.folders.${value.id}`);
  if (!identity.ok) {
    return identity;
  }
  const folders = writeList(catalog.folders, value, folderKey, mode);
  return success({ ...catalog, folders });
}

/** Creates or replaces a complete entry (covering move, reorder, archive and restore). */
function writeEntry(catalog: Catalog, value: CatalogEntry, mode: WriteMode): Result<Catalog> {
  const exists = hasEntry(catalog.entries, value.collection);
  const identity = checkIdentity(mode, exists, `catalog.entries.${value.collection}`);
  if (!identity.ok) {
    return identity;
  }
  const entries = writeList(catalog.entries, value, entryKey, mode);
  return success({ ...catalog, entries });
}

/**
 * Removes a collection's entry. Whether the collection itself is gone is checked on the final
 * candidate, so a deletion can be planned together with its collection's removal.
 */
function unregister(catalog: Catalog, change: ChangeOf<'unregister'>): Result<Catalog> {
  if (!hasEntry(catalog.entries, change.collection)) {
    return failure({
      code: 'not-found',
      path: `catalog.entries.${change.collection}`,
      message: 'Membership must exist',
    });
  }
  const entries = catalog.entries.filter((entry) => entry.collection !== change.collection);
  return success({ ...catalog, entries });
}

/** Create needs an absent ID (`already-exists`); replace needs an existing one (`not-found`). */
function checkIdentity(mode: WriteMode, exists: boolean, path: string): Result<true> {
  if (mode === 'create') {
    return requireAbsent(exists, path);
  }
  if (!exists) {
    return failure({
      code: 'not-found',
      path,
      message: 'Replacement requires an existing identity',
    });
  }
  return success(true);
}

/** Create never silently replaces an existing folder or entry. */
function requireAbsent(exists: boolean, path: string): Result<true> {
  if (exists) {
    return failure({
      code: 'already-exists',
      path,
      message: 'Creation requires an absent identity',
    });
  }
  return success(true);
}

/** A new list: `value` appended (create), or put in place of the item with its key (replace). */
function writeList<T, K extends string>(
  items: readonly T[],
  value: T,
  keyOf: (record: T) => K,
  mode: WriteMode,
): readonly T[] {
  if (mode === 'create') {
    return [...items, value];
  }
  return items.map((item) => replaceMatching(item, value, keyOf));
}

/** `value` when it has the item's key, so a replacement keeps its position; otherwise the item. */
function replaceMatching<T, K extends string>(item: T, value: T, keyOf: (record: T) => K): T {
  if (keyOf(item) !== keyOf(value)) {
    return item;
  }
  return value;
}
