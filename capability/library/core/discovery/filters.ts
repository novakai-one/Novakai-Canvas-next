import type { LibrarySnapshot } from '../../contract/records/snapshot.js';
import type { CatalogEntry } from '../../contract/records/catalog.js';
import type { QueryRequest, SearchHit } from '../../contract/records/query.js';
import { isWithin } from '../catalog/folders.js';

/** Include/exclude/only archive states share the same catalog authority. */
function archiveMatches(entry: CatalogEntry, mode: QueryRequest['archived']): boolean {
  if (mode === 'include') return true;
  if (mode === 'only') return entry.archived;
  return !entry.archived;
}
/** Omitted folder spans root and all folders; descendants is an explicit opt-in. */
function folderMatches(
  entry: CatalogEntry,
  request: QueryRequest,
  snapshot: LibrarySnapshot,
): boolean {
  if (request.folder === undefined) return true;
  if (request.descendants) return isWithin(entry.folder, request.folder, snapshot.catalog.folders);
  return entry.folder === request.folder;
}
/** Every term must occur in this hit's label or description, without depending on DOM content. */
function textMatches(hit: SearchHit, terms: readonly string[]): boolean {
  const searchable = `${hit.label} ${hit.description}`.toLowerCase();
  return terms.every((term) => searchable.includes(term));
}
/** Scope filtering happens before ranking and paging; unplaced objects are not filtered out. */
export function filterHits(
  hits: readonly SearchHit[],
  snapshot: LibrarySnapshot,
  request: QueryRequest,
): readonly SearchHit[] {
  const entries = snapshot.catalog.entries.filter(
    (entry) => archiveMatches(entry, request.archived) && folderMatches(entry, request, snapshot),
  );
  const visibleCollections = new Set(entries.map((entry) => entry.collection));
  const terms = request.text.split(/\s+/).filter((term) => term.length > 0);
  return hits.filter(
    (hit) =>
      visibleCollections.has(hit.collection) &&
      request.kinds.includes(hit.kind) &&
      textMatches(hit, terms),
  );
}
