import type { FolderId } from '../../contract/brands.js';
import type { Catalog, Folder, CatalogEntry } from '../../contract/records/catalog.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../validation/outcomes.js';

/**
 * Walks up from `start` through parent links until it reaches the root, a missing folder, or a
 * folder already visited. A loop instead of recursion, so even a malformed cyclic graph ends.
 *
 * @param start - The folder to start from (included in `visited`).
 * @param folders - The catalog's folders.
 * @returns The folders visited, and `cycle: true` when the walk stopped at a folder it had
 * already visited.
 * @throws Never on parsed, plain catalog data (the only input it is given). Any unexpected throw
 * reaches the `protect` of the public operation that called it (`validateSnapshot`,
 * `planCatalog` or `queryLibrary`).
 */
export function ancestry(start: FolderId, folders: readonly Folder[]): Ancestry {
  const visited = new Set<FolderId>();
  let current: FolderId | undefined = start;
  while (canVisit(current, visited)) {
    visited.add(current);
    current = folders.find((folder) => folder.id === current)?.parent;
  }
  return { visited, cycle: current !== undefined };
}

/**
 * True when `folder` is `owner` itself or one of its descendants. Used for searches that include
 * subfolders. An entry at the root (`folder` undefined) is never within a folder.
 *
 * @param folder - The entry's folder, or `undefined` for the root.
 * @param owner - The folder searched.
 * @param folders - The catalog's folders.
 * @returns True when `owner` is `folder` or one of its ancestors.
 * @throws Never on parsed, plain catalog data (the only input it is given). Any unexpected throw
 * reaches the `protect` in `queryLibrary`.
 */
export function isWithin(
  folder: FolderId | undefined,
  owner: FolderId,
  folders: readonly Folder[],
): boolean {
  if (folder === undefined) {
    return false;
  }
  return ancestry(folder, folders).visited.has(owner);
}

/**
 * Removes one folder from a catalog.
 *
 * A missing folder is `not-found`. A folder with child folders or entries is `folder-not-empty`
 * under the `reject` policy. Under `rehome`, its direct child folders and its entries move to its
 * parent (the root when it has none); deeper descendants stay where they are. Planning validates
 * the resulting catalog afterwards; Authoring owns the commit and recovery.
 *
 * @param catalog - The catalog.
 * @param id - The folder to remove.
 * @param policy - `reject` or `rehome`.
 * @returns The new catalog, or a failure with no partial value.
 * @throws Never on parsed, plain catalog data (the only input it is given). Any unexpected throw
 * reaches the `protect` in `planCatalog`.
 */
export function removeFolder(
  catalog: Catalog,
  id: FolderId,
  policy: 'reject' | 'rehome',
): Result<Catalog> {
  const folder = catalog.folders.find((candidate) => candidate.id === id);
  if (folder === undefined) {
    return failure('not-found', `catalog.folders.${id}`, 'Folder must exist');
  }
  return removeExisting(catalog, folder, policy);
}

/** The result of {@link ancestry}. */
export interface Ancestry {
  readonly visited: ReadonlySet<FolderId>;
  readonly cycle: boolean;
}

/** Whether the walk may continue: not past the root, and not to a folder already visited. */
function canVisit(id: FolderId | undefined, visited: ReadonlySet<FolderId>): id is FolderId {
  return id !== undefined && !visited.has(id);
}

/** Rejects a folder with contents under `reject`; otherwise removes it and rehomes its contents. */
function removeExisting(
  catalog: Catalog,
  folder: Folder,
  policy: 'reject' | 'rehome',
): Result<Catalog> {
  const hasChildren =
    catalog.folders.some((child) => child.parent === folder.id) ||
    catalog.entries.some((entry) => entry.folder === folder.id);
  if (policy === 'reject' && hasChildren) {
    return failure(
      'folder-not-empty',
      `catalog.folders.${folder.id}`,
      'Choose rehome before removing a nonempty folder',
    );
  }
  return success(rehomeContents(catalog, folder));
}

/** Removes the folder and moves its direct contents to its parent; every collection is kept. */
function rehomeContents(catalog: Catalog, removed: Folder): Catalog {
  const surviving = catalog.folders.filter((folder) => folder.id !== removed.id);
  const folders = surviving.map((folder) => rehomeFolder(folder, removed));
  const entries = catalog.entries.map((entry) => rehomeEntry(entry, removed));
  return { ...catalog, folders, entries };
}

/** Moves a direct child of the removed folder to its parent; other folders are unchanged. */
function rehomeFolder(folder: Folder, removed: Folder): Folder {
  if (folder.parent !== removed.id) {
    return folder;
  }
  return moveFolder(folder, removed.parent);
}

/** Moves an entry in the removed folder to its parent; other entries are unchanged. */
function rehomeEntry(entry: CatalogEntry, removed: Folder): CatalogEntry {
  if (entry.folder !== removed.id) {
    return entry;
  }
  return moveEntry(entry, removed.parent);
}

/** A copy of the folder under `parent`. At the root the `parent` key is left out, not undefined. */
function moveFolder(folder: Folder, parent: FolderId | undefined): Folder {
  const { parent: previousParent, ...record } = folder;
  void previousParent;
  if (parent === undefined) {
    return record;
  }
  return { ...record, parent };
}

/** A copy of the entry in `folder`, keeping order and archive state. At the root the key is left out. */
function moveEntry(entry: CatalogEntry, folder: FolderId | undefined): CatalogEntry {
  const { folder: previousFolder, ...record } = entry;
  void previousFolder;
  if (folder === undefined) {
    return record;
  }
  return { ...record, folder };
}
