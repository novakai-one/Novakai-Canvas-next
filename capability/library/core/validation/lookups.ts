/*
 * Existence checks by ID, shared by validation, catalog changes and search. Each check reads the
 * given list only. Pure: the same lists always give the same answer; Authoring owns commit and
 * recovery.
 */
import type { CollectionId, FolderId, SectionId } from '../../contract/brands.js';
import type { CatalogEntry, Folder } from '../../contract/records/catalog.js';
import type { CollectionProjection, SectionProjection } from '../../contract/records/snapshot.js';

/**
 * Whether a folder with this ID exists.
 *
 * @param folders - The catalog's folders.
 * @param id - The folder ID to look for.
 * @returns True when some folder has the ID.
 * @throws Never.
 */
export function hasFolder(folders: readonly Folder[], id: FolderId): boolean {
  return folders.some(/** Whether this folder has the ID. */ (folder) => folder.id === id);
}

/**
 * Whether a catalog entry lists this collection.
 *
 * @param entries - The catalog's entries.
 * @param collection - The collection ID to look for.
 * @returns True when some entry lists the collection.
 * @throws Never.
 */
export function hasEntry(entries: readonly CatalogEntry[], collection: CollectionId): boolean {
  return entries.some(
    /** Whether this entry lists the collection. */ (entry) => entry.collection === collection,
  );
}

/**
 * Whether a collection with this ID is in the inventory.
 *
 * @param collections - The collection inventory.
 * @param id - The collection ID to look for.
 * @returns True when some collection has the ID.
 * @throws Never.
 */
export function hasCollection(
  collections: readonly CollectionProjection[],
  id: CollectionId,
): boolean {
  return collections.some(
    /** Whether this collection has the ID. */ (collection) => collection.id === id,
  );
}

/**
 * Whether a section with this ID is in the collection.
 *
 * @param sections - The collection's sections.
 * @param id - The section ID to look for.
 * @returns True when some section has the ID.
 * @throws Never.
 */
export function hasSection(sections: readonly SectionProjection[], id: SectionId): boolean {
  return sections.some(/** Whether this section has the ID. */ (section) => section.id === id);
}
