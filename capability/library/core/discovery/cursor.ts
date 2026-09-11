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

interface CursorIdentity {
  readonly queryKey: string;
  readonly versionKey: string;
}
/** Canonical keys include page size, filters, source revisions and all recent preferences. */
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
/** Malformed JSON remains a cursor error rather than a generic input-read exception. */
function decodeCursor(cursor: string): Result<CursorEnvelope> {
  try {
    const parsed = cursorSchema.safeParse(JSON.parse(cursor));
    if (!parsed.success) return failure('stale-cursor', 'query.cursor', 'Cursor is malformed');
    return success(parsed.data);
  } catch {
    return failure('stale-cursor', 'query.cursor', 'Cursor is malformed');
  }
}
/** The same cursor may be replayed, but never against another query or source revision set. */
export function cursorOffset(
  snapshot: LibrarySnapshot,
  request: QueryRequest,
  total: number,
): Result<number> {
  if (request.cursor === undefined) return success(0);
  const decoded = decodeCursor(request.cursor);
  if (!decoded.ok) return decoded;
  return validateCursor(decoded.value, cursorIdentity(snapshot, request), total);
}
/** Reject out-of-bounds offsets as well as changed input identities. */
function validateCursor(
  cursor: CursorEnvelope,
  identity: CursorIdentity,
  total: number,
): Result<number> {
  const changed =
    cursor.queryKey !== identity.queryKey || cursor.versionKey !== identity.versionKey;
  if (changed)
    return failure(
      'stale-cursor',
      'query.cursor',
      'Query or source snapshot changed; start a new search',
    );
  if (cursor.offset > total)
    return failure('stale-cursor', 'query.cursor', 'Cursor offset exceeds the result set');
  return success(cursor.offset);
}
/** Never emit a cursor the next request would reject for exceeding the documented bound. */
export function nextCursor(
  snapshot: LibrarySnapshot,
  request: QueryRequest,
  offset: number,
): Result<string> {
  const cursor = JSON.stringify({ offset, ...cursorIdentity(snapshot, request) });
  if (cursor.length > MAX_CURSOR_LENGTH)
    return failure(
      'limit',
      'query.cursor',
      'Snapshot identity exceeds the cursor budget; narrow the supplied inventory',
    );
  return success(cursor);
}
