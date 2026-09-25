/*
 * Removing a folder from a catalog, refusing or rehoming its contents. Returns a new catalog and
 * never changes the one given. Planning validates the result afterwards; Authoring owns the commit
 * and recovery.
 */
import type { FolderId } from '../../contract/brands.js';
import type { Catalog, Folder, CatalogEntry } from '../../contract/records/catalog.js';
import type { ChangeOf, RemovalPolicy } from '../../contract/records/change.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../validation/outcomes.js';

/**
 * Removes one folder from a catalog.
 *
 * A missing folder is `not-found`. A folder with child folders or entries is `folder-not-empty`
 * under the `reject` policy. Under `rehome`, its direct child folders and its entries move to its
 * parent (the root when it has none); deeper descendants stay where they are.
 *
 * Pure: the same catalog and change always give the same result.
 *
 * @param catalog - The catalog.
 * @param removal - The `remove-folder` change: the folder ID and the policy.
 * @returns The new catalog, or a failure with no partial value.
 * @throws Never on parsed, plain catalog data (the only input it is given). Any unexpected throw
 * reaches the `protect` in `planCatalog`.
 */
export function removeFolder(
  catalog: Catalog,
  removal: ChangeOf<'remove-folder'>,
): Result<Catalog> {
  const folder = catalog.folders.find(
    /** Whether this is the folder to remove. */ (candidate) => candidate.id === removal.id,
  );
  if (folder === undefined) {
    return failure({
      code: 'not-found',
      path: `catalog.folders.${removal.id}`,
      message: 'Folder must exist',
    });
  }
  return removeExisting(catalog, folder, removal.policy);
}

/** Rejects a folder with contents under `reject`; otherwise removes it and rehomes its contents. */
function removeExisting(catalog: Catalog, folder: Folder, policy: RemovalPolicy): Result<Catalog> {
  if (policy === 'reject' && hasContents(catalog, folder.id)) {
    return failure({
      code: 'folder-not-empty',
      path: `catalog.folders.${folder.id}`,
      message: 'Choose rehome before removing a nonempty folder',
    });
  }
  return success(rehomeContents(catalog, folder));
}

/** Whether any folder has this folder as its parent, or any entry sits in it. */
function hasContents(catalog: Catalog, id: FolderId): boolean {
  const hasChildFolder = catalog.folders.some(
    /** Whether this folder is a direct child. */ (child) => child.parent === id,
  );
  const hasEntries = catalog.entries.some(
    /** Whether this entry sits in the folder. */ (entry) => entry.folder === id,
  );
  return hasChildFolder || hasEntries;
}

/** Removes the folder and moves its direct contents to its parent; every collection is kept. */
function rehomeContents(catalog: Catalog, removed: Folder): Catalog {
  const surviving = catalog.folders.filter(
    /** Whether this folder is kept. */ (folder) => folder.id !== removed.id,
  );
  const folders = surviving.map(
    /** Moves a direct child to the parent. */ (folder) => rehomeFolder(folder, removed),
  );
  const entries = catalog.entries.map(
    /** Moves an entry in the folder to the parent. */ (entry) => rehomeEntry(entry, removed),
  );
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
  // The old parent is replaced below; `void` marks the variable as deliberately unused.
  void previousParent;
  if (parent === undefined) {
    return record;
  }
  return { ...record, parent };
}

/** A copy of the entry in `folder`, keeping order and archive state; no `folder` key at root. */
function moveEntry(entry: CatalogEntry, folder: FolderId | undefined): CatalogEntry {
  const { folder: previousFolder, ...record } = entry;
  // The old folder is replaced below; `void` marks the variable as deliberately unused.
  void previousFolder;
  if (folder === undefined) {
    return record;
  }
  return { ...record, folder };
}
