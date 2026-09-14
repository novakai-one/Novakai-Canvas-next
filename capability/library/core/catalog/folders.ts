import type { FolderId } from '../../contract/brands.js';
import type { Catalog, Folder, CatalogEntry } from '../../contract/records/catalog.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../validation/outcomes.js';

interface Ancestry {
  readonly visited: ReadonlySet<FolderId>;
  readonly cycle: boolean;
}
/** Stop before revisiting a parent or reading beyond the implicit root. */
function canVisit(id: FolderId | undefined, visited: ReadonlySet<FolderId>): id is FolderId {
  return id !== undefined && !visited.has(id);
}
/** Bounded local traversal; even malformed cyclic graphs terminate without recursion. */
export function ancestry(start: FolderId, folders: readonly Folder[]): Ancestry {
  const visited = new Set<FolderId>();
  let current: FolderId | undefined = start;
  while (canVisit(current, visited)) {
    visited.add(current);
    current = folders.find((folder) => folder.id === current)?.parent;
  }
  return { visited, cycle: current !== undefined };
}
/** Direct folder membership includes the owner itself when descendant discovery is enabled. */
export function isWithin(
  folder: FolderId | undefined,
  owner: FolderId,
  folders: readonly Folder[],
): boolean {
  if (folder === undefined) return false;
  return ancestry(folder, folders).visited.has(owner);
}
/** Moving to root omits parent rather than storing undefined. */
function moveFolder(folder: Folder, parent: FolderId | undefined): Folder {
  const { parent: previousParent, ...record } = folder;
  void previousParent;
  if (parent === undefined) return record;
  return { ...record, parent };
}
/** Moving a collection to root omits folder while retaining order/archive flags. */
function moveEntry(entry: CatalogEntry, folder: FolderId | undefined): CatalogEntry {
  const { folder: previousFolder, ...record } = entry;
  void previousFolder;
  if (folder === undefined) return record;
  return { ...record, folder };
}
/** Only direct children change parent; their own nested descendants stay attached. */
function rehomeFolder(folder: Folder, removed: Folder): Folder {
  if (folder.parent !== removed.id) return folder;
  return moveFolder(folder, removed.parent);
}
/** Entries in surviving descendant folders keep their existing membership. */
function rehomeEntry(entry: CatalogEntry, removed: Folder): CatalogEntry {
  if (entry.folder !== removed.id) return entry;
  return moveEntry(entry, removed.parent);
}
/** Remove the container while preserving all collections and surviving folder identities. */
function rehomeContents(catalog: Catalog, removed: Folder): Catalog {
  const surviving = catalog.folders.filter((folder) => folder.id !== removed.id);
  const folders = surviving.map((folder) => rehomeFolder(folder, removed));
  const entries = catalog.entries.map((entry) => rehomeEntry(entry, removed));
  return { ...catalog, folders, entries };
}
/** Reject a nonempty folder unless rehome was explicitly requested. */
function removeExisting(
  catalog: Catalog,
  folder: Folder,
  policy: 'reject' | 'rehome',
): Result<Catalog> {
  const hasChildren =
    catalog.folders.some((child) => child.parent === folder.id) ||
    catalog.entries.some((entry) => entry.folder === folder.id);
  if (policy === 'reject' && hasChildren)
    return failure(
      'folder-not-empty',
      `catalog.folders.${folder.id}`,
      'Choose rehome before removing a nonempty folder',
    );
  return success(rehomeContents(catalog, folder));
}
/**
 * Plan one folder removal. Missing/nonempty targets are typed failures with no partial value.
 * Pure snapshot replay; catalog planning validates the result and Authoring owns commit/recovery.
 */
export function removeFolder(
  catalog: Catalog,
  id: FolderId,
  policy: 'reject' | 'rehome',
): Result<Catalog> {
  const folder = catalog.folders.find((candidate) => candidate.id === id);
  if (folder === undefined)
    return failure('not-found', `catalog.folders.${id}`, 'Folder must exist');
  return removeExisting(catalog, folder, policy);
}
