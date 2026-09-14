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

/** Normalize only search criteria; original display labels remain untouched. */
function normalizeRequest(request: QueryRequest): QueryRequest {
  const text = request.text.trim().toLowerCase().split(/\s+/).join(' ');
  const kinds = [...new Set(request.kinds)].toSorted(compareText);
  return { ...request, text, kinds };
}
/** A requested folder must exist; absence is a valid all-folder search. */
function validateFolder(snapshot: LibrarySnapshot, request: QueryRequest): Result<true> {
  if (request.folder === undefined) return success(true);
  const exists = snapshot.catalog.folders.some((folder) => folder.id === request.folder);
  if (!exists) return failure('not-found', 'query.folder', 'Search folder must exist');
  return success(true);
}
/** A completed page omits the cursor field rather than exposing undefined. */
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
  if (followingOffset >= hits.length) return success(page);
  const cursor = nextCursor(snapshot, request, followingOffset);
  if (!cursor.ok) return cursor;
  return success({ ...page, nextCursor: cursor.value });
}
/** Filter and sort against one source snapshot before applying a validated cursor offset. */
function searchSnapshot(snapshot: LibrarySnapshot, request: QueryRequest): Result<QueryPage> {
  const folder = validateFolder(snapshot, request);
  if (!folder.ok) return folder;
  const projected = projectHits(snapshot);
  const matching = filterHits(projected, snapshot, request);
  const ordered = sortHits(matching, snapshot, request);
  const offset = cursorOffset(snapshot, request, ordered.length);
  if (!offset.ok) return offset;
  return completePage(snapshot, request, ordered, offset.value);
}
/** Reject invalid source snapshots and malformed criteria before discovery begins. */
function prepareQuery(input: unknown, request: unknown): Result<QueryPage> {
  const snapshot = validateSnapshot(input);
  if (!snapshot.ok) return snapshot;
  const parsed = parse(querySchema, request);
  if (!parsed.ok) return parsed;
  return searchSnapshot(snapshot.value, normalizeRequest(parsed.value));
}
/**
 * Search one detached immutable snapshot with deterministic ranking and revision-bound cursors.
 * Returns typed failures, never a partial page. No clock, locale, storage or index writes;
 * protect catches unsupported input reads. Authoring owns source changes and commit/recovery.
 */
export function queryLibrary(snapshot: unknown, request: unknown): Result<QueryPage> {
  return protect(() => prepareQuery(snapshot, request));
}
