import {
  cursorSchema,
  MAX_CURSOR_LENGTH,
  type QueryRequest,
  type CursorEnvelope,
} from '../../contract/records/query.js';
import type { LibrarySnapshot } from '../../contract/records/snapshot.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../validation/outcomes.js';
import { compareText, readVersions } from './project.js';

/**
 * The offset a request starts at: 0 without a cursor, otherwise the cursor's offset.
 *
 * A cursor may be replayed, but only with the same query and the same snapshot. It is
 * `stale-cursor` (path `query.cursor`) when it is not valid cursor JSON ("Cursor is malformed"),
 * when the query, the recent visits or any source revision changed, or when its offset is past
 * the end of the results.
 *
 * @param snapshot - The validated snapshot.
 * @param request - The normalized request.
 * @param total - The number of matching hits.
 * @returns The offset, or a `stale-cursor` failure.
 */
export function cursorOffset(
  snapshot: LibrarySnapshot,
  request: QueryRequest,
  total: number,
): Result<number> {
  if (request.cursor === undefined) {
    return success(0);
  }
  const decoded = decodeCursor(request.cursor);
  if (!decoded.ok) {
    return decoded;
  }
  return validateCursor(decoded.value, cursorIdentity(snapshot, request), total);
}

/**
 * Builds the cursor for the next page: JSON of the offset and the query and version keys. A
 * cursor longer than `MAX_CURSOR_LENGTH` would be rejected by the next request, so it is a
 * `limit` failure instead.
 *
 * @param snapshot - The validated snapshot.
 * @param request - The normalized request.
 * @param offset - The offset of the next page's first hit.
 * @returns The cursor, or a `limit` failure.
 */
export function nextCursor(
  snapshot: LibrarySnapshot,
  request: QueryRequest,
  offset: number,
): Result<string> {
  const cursor = JSON.stringify({ offset, ...cursorIdentity(snapshot, request) });
  if (cursor.length > MAX_CURSOR_LENGTH) {
    return failure(
      'limit',
      'query.cursor',
      'Snapshot identity exceeds the cursor budget; narrow the supplied inventory',
    );
  }
  return success(cursor);
}

/** The keys a cursor is bound to. */
interface CursorIdentity {
  /** JSON of the request without its cursor (page size and filters included) and the recent visits. */
  readonly queryKey: string;
  /** JSON of the snapshot's source revisions. */
  readonly versionKey: string;
}

/** Builds the keys; recent visits are sorted by collection ID so their input order does not matter. */
function cursorIdentity(snapshot: LibrarySnapshot, request: QueryRequest): CursorIdentity {
  const { cursor: previousCursor, ...criteria } = request;
  void previousCursor;
  const recent = snapshot.recent.toSorted((left, right) =>
    compareText(left.collection, right.collection),
  );
  return {
    queryKey: JSON.stringify({ criteria, recent }),
    versionKey: JSON.stringify(readVersions(snapshot)),
  };
}

/** Parses the cursor. Text that is not JSON is `stale-cursor` too, not a generic read failure. */
function decodeCursor(cursor: string): Result<CursorEnvelope> {
  try {
    const parsed = cursorSchema.safeParse(JSON.parse(cursor));
    if (!parsed.success) {
      return failure('stale-cursor', 'query.cursor', 'Cursor is malformed');
    }
    return success(parsed.data);
  } catch {
    return failure('stale-cursor', 'query.cursor', 'Cursor is malformed');
  }
}

/** Rejects a cursor from another query or snapshot, or whose offset is past the results. */
function validateCursor(
  cursor: CursorEnvelope,
  identity: CursorIdentity,
  total: number,
): Result<number> {
  const changed =
    cursor.queryKey !== identity.queryKey || cursor.versionKey !== identity.versionKey;
  if (changed) {
    return failure(
      'stale-cursor',
      'query.cursor',
      'Query or source snapshot changed; start a new search',
    );
  }
  if (cursor.offset > total) {
    return failure('stale-cursor', 'query.cursor', 'Cursor offset exceeds the result set');
  }
  return success(cursor.offset);
}
