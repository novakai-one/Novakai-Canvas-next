import type { LibrarySnapshot } from '../../contract/records/snapshot.js';
import type { CatalogEntry } from '../../contract/records/catalog.js';
import type { QueryRequest, SearchHit } from '../../contract/records/query.js';
import { isWithin } from '../catalog/folders.js';

/**
 * Keeps the hits the request asks for, before sorting and paging. A hit is kept when:
 * - its collection's entry matches the archive mode and the folder filter,
 * - its kind is in `kinds`, and
 * - every word of `text` appears in its label or description (lowercased).
 *
 * Objects in no section are kept like any other hit.
 *
 * @param hits - All hits of the snapshot.
 * @param snapshot - The validated snapshot.
 * @param request - The normalized request (text already lowercased).
 * @returns The kept hits, in their original order.
 */
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

/** `include`: every entry; `only`: archived entries; `exclude`: live entries. */
function archiveMatches(entry: CatalogEntry, mode: QueryRequest['archived']): boolean {
  if (mode === 'include') {
    return true;
  }
  if (mode === 'only') {
    return entry.archived;
  }
  return !entry.archived;
}

/**
 * No folder: every entry, root included. With a folder: entries directly in it, or also in its
 * subfolders when `descendants` is set.
 */
function folderMatches(
  entry: CatalogEntry,
  request: QueryRequest,
  snapshot: LibrarySnapshot,
): boolean {
  if (request.folder === undefined) {
    return true;
  }
  if (request.descendants) {
    return isWithin(entry.folder, request.folder, snapshot.catalog.folders);
  }
  return entry.folder === request.folder;
}

/** Every term occurs in the hit's lowercased label or description (no DOM content involved). */
function textMatches(hit: SearchHit, terms: readonly string[]): boolean {
  const searchable = `${hit.label} ${hit.description}`.toLowerCase();
  return terms.every((term) => searchable.includes(term));
}
