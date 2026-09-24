import {
  querySchema,
  type QueryRequest,
  type QueryPage,
  type SearchHit,
} from '../../contract/records/query.js';
import type { LibrarySnapshot } from '../../contract/records/snapshot.js';
import type { Result } from '../../contract/errors.js';
import { failure, parse, protect, success } from '../validation/outcomes.js';
import { validateSnapshot } from '../validation/validate.js';
import { projectHits, readVersions, compareText } from './project.js';
import { filterHits } from './filters.js';
import { sortHits } from './ranking.js';
import { cursorOffset, nextCursor } from './cursor.js';

/**
 * Searches one snapshot and returns one page.
 *
 * Steps; the first failure stops the search and no partial page is returned:
 * 1. Validate the snapshot, then parse the request (defaults filled in).
 * 2. Normalize the criteria: text trimmed, lowercased and single-spaced; kinds de-duplicated and
 *    sorted. Display labels are never changed.
 * 3. Check the requested folder exists (`not-found`, path `query.folder`).
 * 4. Build every hit, filter, sort (see `sortHits`), then apply the cursor's offset. A bad or
 *    stale cursor is `stale-cursor` (path `query.cursor`).
 * 5. Return up to `limit` hits, the total, the source revisions and, when more hits follow, the
 *    next cursor. A next cursor longer than `MAX_CURSOR_LENGTH` is a `limit` failure instead.
 *
 * Reads no clock or locale and writes no storage or index. A throw while reading the input
 * becomes a `shape` failure. Authoring owns source changes, commit and recovery.
 *
 * @param snapshot - The untrusted snapshot.
 * @param request - The untrusted search request.
 * @returns The frozen page, or a failure.
 * @throws Never; a throw while reading the input becomes a `shape` failure.
 */
export function queryLibrary(snapshot: unknown, request: unknown): Result<QueryPage> {
  return protect(() => prepareQuery(snapshot, request));
}

/** Validates the snapshot and parses the request before any search work. */
function prepareQuery(input: unknown, request: unknown): Result<QueryPage> {
  const snapshot = validateSnapshot(input);
  if (!snapshot.ok) {
    return snapshot;
  }
  const parsed = parse(querySchema, request);
  if (!parsed.ok) {
    return parsed;
  }
  return searchSnapshot(snapshot.value, normalizeRequest(parsed.value));
}

/** Normalizes the search criteria only; labels and descriptions are left as they are. */
function normalizeRequest(request: QueryRequest): QueryRequest {
  const text = request.text.trim().toLowerCase().split(/\s+/).join(' ');
  // A Set drops repeated kinds; sorting makes the order independent of the request.
  const kinds = [...new Set(request.kinds)].toSorted(compareText);
  return { ...request, text, kinds };
}

/** Checks the folder, then filters and sorts every hit and applies the cursor's offset. */
function searchSnapshot(snapshot: LibrarySnapshot, request: QueryRequest): Result<QueryPage> {
  const folder = validateFolder(snapshot, request);
  if (!folder.ok) {
    return folder;
  }
  const projected = projectHits(snapshot);
  const matching = filterHits(projected, snapshot, request);
  const ordered = sortHits(matching, snapshot, request);
  const offset = cursorOffset(snapshot, request, ordered.length);
  if (!offset.ok) {
    return offset;
  }
  return completePage(snapshot, request, ordered, offset.value);
}

/** A named folder must exist; no folder means every folder. */
function validateFolder(snapshot: LibrarySnapshot, request: QueryRequest): Result<true> {
  if (request.folder === undefined) {
    return success(true);
  }
  const exists = snapshot.catalog.folders.some((folder) => folder.id === request.folder);
  if (!exists) {
    return failure('not-found', 'query.folder', 'Search folder must exist');
  }
  return success(true);
}

/**
 * Builds the page. On the last page the `nextCursor` key is left out, not set to undefined. A
 * next cursor longer than `MAX_CURSOR_LENGTH` is a `limit` failure.
 */
function completePage(
  snapshot: LibrarySnapshot,
  request: QueryRequest,
  hits: readonly SearchHit[],
  offset: number,
): Result<QueryPage> {
  const page: QueryPage = {
    hits: hits.slice(offset, offset + request.limit),
    total: hits.length,
    versions: readVersions(snapshot),
  };
  const followingOffset = offset + page.hits.length;
  if (followingOffset >= hits.length) {
    return success(page);
  }
  const cursor = nextCursor(snapshot, request, followingOffset);
  if (!cursor.ok) {
    return cursor;
  }
  return success({ ...page, nextCursor: cursor.value });
}
