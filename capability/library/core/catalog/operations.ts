import type { Catalog, CatalogEntry, Folder } from '../../contract/records/catalog.js';
import type { CatalogChange } from '../../contract/records/change.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../validation/outcomes.js';
import { removeFolder } from './folders.js';

type WriteMode = 'create' | 'replace';
type Handler = (catalog: Catalog, change: CatalogChange) => Result<Catalog>;

/** Existing IDs reject creation; missing IDs reject replacement. */
function checkIdentity(mode: WriteMode, exists: boolean, path: string): Result<true> {
  if (mode === 'create') return requireAbsent(exists, path);
  if (!exists) return failure('not-found', path, 'Replacement requires an existing identity');
  return success(true);
}
/** Creation never silently replaces an existing folder or entry. */
function requireAbsent(exists: boolean, path: string): Result<true> {
  if (exists) return failure('already-exists', path, 'Creation requires an absent identity');
  return success(true);
}
/** A matched replacement stays at the existing array position. */
function replaceMatching<T>(item: T, value: T, keyOf: (record: T) => string): T {
  if (keyOf(item) !== keyOf(value)) return item;
  return value;
}
/** Ordered immutable list updates share one identity-preserving implementation. */
function writeList<T>(
  items: readonly T[],
  value: T,
  keyOf: (record: T) => string,
  mode: WriteMode,
): readonly T[] {
  if (mode === 'create') return [...items, value];
  return items.map((item) => replaceMatching(item, value, keyOf));
}
/** Complete folder replacement handles rename, move and order without partial field patches. */
function writeFolder(catalog: Catalog, value: Folder, mode: WriteMode): Result<Catalog> {
  const exists = catalog.folders.some((folder) => folder.id === value.id);
  const identity = checkIdentity(mode, exists, `catalog.folders.${value.id}`);
  if (!identity.ok) return identity;
  const folders = writeList(catalog.folders, value, (folder) => folder.id, mode);
  return success({ ...catalog, folders });
}
/** Complete entry replacement handles move, order, archive and restore. */
function writeEntry(catalog: Catalog, value: CatalogEntry, mode: WriteMode): Result<Catalog> {
  const exists = catalog.entries.some((entry) => entry.collection === value.collection);
  const identity = checkIdentity(mode, exists, `catalog.entries.${value.collection}`);
  if (!identity.ok) return identity;
  const entries = writeList(catalog.entries, value, (entry) => entry.collection, mode);
  return success({ ...catalog, entries });
}
/** Inventory consistency is deferred to the final candidate so deletion can be coordinated atomically. */
function unregister(
  catalog: Catalog,
  change: Extract<CatalogChange, { op: 'unregister' }>,
): Result<Catalog> {
  const exists = catalog.entries.some((entry) => entry.collection === change.collection);
  if (!exists)
    return failure('not-found', `catalog.entries.${change.collection}`, 'Membership must exist');
  const entries = catalog.entries.filter((entry) => entry.collection !== change.collection);
  return success({ ...catalog, entries });
}
/** A mismatched internal dispatch is a typed rejection, never a silently accepted no-op. */
function unsupported(): Result<Catalog> {
  return failure('shape', 'changes', 'Unsupported catalog operation');
}
const handlers: Readonly<Record<CatalogChange['op'], Handler>> = {
  'create-folder': (catalog, change) => {
    if (change.op !== 'create-folder') return unsupported();
    return writeFolder(catalog, change.value, 'create');
  },
  'replace-folder': (catalog, change) => {
    if (change.op !== 'replace-folder') return unsupported();
    return writeFolder(catalog, change.value, 'replace');
  },
  'remove-folder': (catalog, change) => {
    if (change.op !== 'remove-folder') return unsupported();
    return removeFolder(catalog, change.id, change.policy);
  },
  register: (catalog, change) => {
    if (change.op !== 'register') return unsupported();
    return writeEntry(catalog, change.value, 'create');
  },
  'replace-entry': (catalog, change) => {
    if (change.op !== 'replace-entry') return unsupported();
    return writeEntry(catalog, change.value, 'replace');
  },
  unregister: (catalog, change) => {
    if (change.op !== 'unregister') return unsupported();
    return unregister(catalog, change);
  },
};
/**
 * Apply one parsed catalog operation. Intermediate references may be repaired later in the
 * batch. Failures stop planning; same-snapshot replay is pure. Authoring owns commit/recovery.
 */
export function applyOperation(catalog: Catalog, change: CatalogChange): Result<Catalog> {
  return handlers[change.op](catalog, change);
}
