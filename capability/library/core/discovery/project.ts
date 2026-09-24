import type { LibrarySnapshot, CollectionProjection } from '../../contract/records/snapshot.js';
import type { ReadVersions } from '../../contract/types.js';
import type { SearchHit } from '../../contract/records/query.js';

/**
 * Compares two strings by UTF-16 code unit, so the order is the same on every machine and in every
 * locale.
 *
 * @param left - The first string.
 * @param right - The second string.
 * @returns -1 when `left` sorts first, 1 when it sorts after, 0 when equal.
 * @throws Never.
 */
export function compareText(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

/**
 * The source revisions of a snapshot: the catalog's, and each collection's sorted by collection ID.
 *
 * @param snapshot - The validated snapshot.
 * @returns A new `ReadVersions` record.
 * @throws Never for a validated snapshot; any throw reaches the caller's `protect`.
 */
export function readVersions(snapshot: LibrarySnapshot): ReadVersions {
  const collections = snapshot.collections
    .map((collection) => ({ id: collection.id, revision: collection.revision }))
    .toSorted((left, right) => compareText(left.id, right.id));
  return { catalog: { id: snapshot.catalog.id, revision: snapshot.catalog.revision }, collections };
}

/**
 * Builds every search hit of a snapshot, in inventory order: for each collection, the collection
 * itself, then its sections, then its objects (including objects in no section). Rebuilt on every
 * call; nothing is cached and the catalog is not touched. Pure; nothing is written, and Authoring
 * owns recovery.
 *
 * @param snapshot - The validated snapshot.
 * @returns The hits, before filtering and sorting.
 * @throws Never for a validated snapshot; any throw reaches the `protect` in `queryLibrary`.
 */
export function projectHits(snapshot: LibrarySnapshot): readonly SearchHit[] {
  return snapshot.collections.flatMap(projectCollection);
}

/** The hits of one collection: the collection, its sections, then its objects. */
function projectCollection(collection: CollectionProjection): readonly SearchHit[] {
  const collectionHit: SearchHit = {
    kind: 'collection',
    collection: collection.id,
    id: collection.id,
    label: collection.title,
    description: collection.description,
    visibleIn: [],
  };
  const sections = collection.sections.map((section): SearchHit => ({
    kind: 'section',
    collection: collection.id,
    id: section.id,
    label: section.title,
    description: '',
    visibleIn: [section.id],
  }));
  const objects = collection.objects.map((object): SearchHit => ({
    kind: 'object',
    collection: collection.id,
    id: object.id,
    label: object.label,
    description: object.description,
    visibleIn: object.visibleIn,
  }));
  return [collectionHit, ...sections, ...objects];
}
