import type { Catalog, CatalogEntry, Folder } from '../../contract/records/catalog.js';
import type { CatalogChange } from '../../contract/records/change.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../validation/outcomes.js';
import { removeFolder } from './folders.js';

/**
 * Applies one parsed catalog change and returns the new catalog.
 *
 * - `create-folder` / `register`: appended; an existing ID is `already-exists`.
 * - `replace-folder` / `replace-entry`: replaced in place; a missing ID is `not-found`.
 * - `remove-folder`: see `removeFolder` (`not-found`, `folder-not-empty`, or rehomed contents).
 * - `unregister`: the entry is removed; a missing one is `not-found`.
 *
 * References are not checked here, so a later change in the batch may repair them; planning
 * validates the final catalog. A failure stops the batch. The same inputs always give the same
 * result; Authoring owns the commit and recovery.
 *
 * @param catalog - The catalog so far.
 * @param change - The change to apply.
 * @returns The new catalog, or a failure with no partial value.
 * @throws Never on parsed, plain catalog data (the only input it is given). Any unexpected throw
 * reaches the `protect` in `planCatalog`.
 */
export function applyOperation(catalog: Catalog, change: CatalogChange): Result<Catalog> {
  return handlers[change.op](catalog, change);
}

/**
 * One handler per operation. Each re-checks `op` because the lookup cannot narrow the change's
 * type; a mismatch is a typed `shape` failure, never a silent no-op.
 */
const handlers: Readonly<Record<CatalogChange['op'], Handler>> = {
  'create-folder': (catalog, change) => {
    if (change.op !== 'create-folder') {
      return unsupported();
    }
    return writeFolder(catalog, change.value, 'create');
  },
  'replace-folder': (catalog, change) => {
    if (change.op !== 'replace-folder') {
      return unsupported();
    }
    return writeFolder(catalog, change.value, 'replace');
  },
  'remove-folder': (catalog, change) => {
    if (change.op !== 'remove-folder') {
      return unsupported();
    }
    return removeFolder(catalog, change.id, change.policy);
  },
  register: (catalog, change) => {
    if (change.op !== 'register') {
      return unsupported();
    }
    return writeEntry(catalog, change.value, 'create');
  },
  'replace-entry': (catalog, change) => {
    if (change.op !== 'replace-entry') {
      return unsupported();
    }
    return writeEntry(catalog, change.value, 'replace');
  },
  unregister: (catalog, change) => {
    if (change.op !== 'unregister') {
      return unsupported();
    }
    return unregister(catalog, change);
  },
};

/** The failure for a change routed to the wrong handler. */
function unsupported(): Result<Catalog> {
  return failure('shape', 'changes', 'Unsupported catalog operation');
}

/** Creates or replaces a complete folder (covering rename, move and reorder; no field patches). */
function writeFolder(catalog: Catalog, value: Folder, mode: WriteMode): Result<Catalog> {
  const exists = catalog.folders.some((folder) => folder.id === value.id);
  const identity = checkIdentity(mode, exists, `catalog.folders.${value.id}`);
  if (!identity.ok) {
    return identity;
  }
  const folders = writeList(catalog.folders, value, (folder) => folder.id, mode);
  return success({ ...catalog, folders });
}

/** Creates or replaces a complete entry (covering move, reorder, archive and restore). */
function writeEntry(catalog: Catalog, value: CatalogEntry, mode: WriteMode): Result<Catalog> {
  const exists = catalog.entries.some((entry) => entry.collection === value.collection);
  const identity = checkIdentity(mode, exists, `catalog.entries.${value.collection}`);
  if (!identity.ok) {
    return identity;
  }
  const entries = writeList(catalog.entries, value, (entry) => entry.collection, mode);
  return success({ ...catalog, entries });
}

/**
 * Removes a collection's entry. Whether the collection itself is gone is checked on the final
 * candidate, so a deletion can be planned together with its collection's removal.
 */
function unregister(
  catalog: Catalog,
  change: Extract<CatalogChange, { op: 'unregister' }>,
): Result<Catalog> {
  const exists = catalog.entries.some((entry) => entry.collection === change.collection);
  if (!exists) {
    return failure('not-found', `catalog.entries.${change.collection}`, 'Membership must exist');
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
    return failure('not-found', path, 'Replacement requires an existing identity');
  }
  return success(true);
}

/** Create never silently replaces an existing folder or entry. */
function requireAbsent(exists: boolean, path: string): Result<true> {
  if (exists) {
    return failure('already-exists', path, 'Creation requires an absent identity');
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

/** Whether a write creates a record or replaces an existing one. */
type WriteMode = 'create' | 'replace';

/** Applies one change of any kind. */
type Handler = (catalog: Catalog, change: CatalogChange) => Result<Catalog>;
