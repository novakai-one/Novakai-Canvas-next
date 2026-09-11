import type { LibrarySnapshot, CollectionProjection } from '../../contract/records/snapshot.js';
import type { ReadVersions } from '../../contract/types.js';
import type { SearchHit } from '../../contract/records/query.js';

/** Code-unit order is deterministic across machines and independent of the user's locale. */
export function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
/** Return original revision provenance in canonical collection-ID order. */
export function readVersions(snapshot: LibrarySnapshot): ReadVersions {
  const collections = snapshot.collections
    .map((collection) => ({ id: collection.id, revision: collection.revision }))
    .toSorted((left, right) => compareText(left.id, right.id));
  return { catalog: { id: snapshot.catalog.id, revision: snapshot.catalog.revision }, collections };
}
/** All semantic objects produce hits, including those with no visible appearance. */
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
/** Rebuild a discovery projection from one validated snapshot; no cache or catalog mutation. */
export function projectHits(snapshot: LibrarySnapshot): readonly SearchHit[] {
  return snapshot.collections.flatMap(projectCollection);
}
