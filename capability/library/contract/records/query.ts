import { z } from 'zod';
import { folderId, text, nonnegativeInteger } from '../brands.js';
import type { CollectionId, SectionId, ObjectId } from '../brands.js';
import type { ReadVersions } from '../types.js';

/**
 * The longest cursor accepted or produced (1,000,000 characters). A next cursor longer than this
 * is a `limit` failure instead.
 */
export const MAX_CURSOR_LENGTH = 1_000_000;

/** The kinds of search hit. Declared before {@link querySchema}, which is built from it. */
const hitKind = z.enum(['collection', 'section', 'object']);

/**
 * Checks search criteria and fills in defaults:
 * - `text` (default empty): every word must appear in the hit's label or description, ignoring
 *   case.
 * - `folder` (optional): only entries in this folder. Omitted searches every folder and the root.
 * - `descendants` (default false): also include the folder's subfolders.
 * - `archived` (default `exclude`): `exclude`, `include` or `only` archived collections.
 * - `sort` (default `order`): `order`, `title` or `recent`.
 * - `kinds` (default all three): which hit kinds to return.
 * - `limit` (default 50): page size, 1 to 200.
 * - `cursor` (optional): the `nextCursor` of the previous page.
 */
export const querySchema = z
  .strictObject({
    text: text.default(''),
    folder: folderId.optional(),
    descendants: z.boolean().default(false),
    archived: z.enum(['exclude', 'include', 'only']).default('exclude'),
    sort: z.enum(['order', 'title', 'recent']).default('order'),
    kinds: z.array(hitKind).max(3).readonly().default(['collection', 'section', 'object']),
    limit: z.number().int().min(1).max(200).default(50),
    cursor: z.string().max(MAX_CURSOR_LENGTH).optional(),
  })
  .readonly();

/**
 * Checks a decoded cursor: the offset of the next hit, and keys identifying the exact query (with
 * recent visits) and source revisions it belongs to. Private to discovery; consumers treat the
 * cursor string as opaque.
 */
export const cursorSchema = z
  .strictObject({ offset: nonnegativeInteger, queryKey: z.string(), versionKey: z.string() })
  .readonly();

/** Search criteria that passed {@link querySchema}, with defaults filled in. */
export type QueryRequest = z.infer<typeof querySchema>;

/**
 * One search hit: a collection, one of its sections, or one of its objects. `id` is in the ID
 * namespace of its `kind`, so the host can navigate to it.
 */
export type SearchHit = HitContent &
  (
    | { readonly kind: 'collection'; readonly id: CollectionId }
    | { readonly kind: 'section'; readonly id: SectionId }
    | { readonly kind: 'object'; readonly id: ObjectId }
  );

/**
 * One page of search results. `versions` are the source revisions searched. When `nextCursor` is
 * absent, this is the last page.
 */
export interface QueryPage {
  readonly hits: readonly SearchHit[];
  /** The number of matching hits across all pages. */
  readonly total: number;
  readonly versions: ReadVersions;
  readonly nextCursor?: string;
}

/** A cursor that passed {@link cursorSchema}. */
export type CursorEnvelope = z.infer<typeof cursorSchema>;

/**
 * What every hit shows and navigates by, copied from the collection projection (never stored in
 * the catalog).
 */
interface HitContent {
  /** The collection the hit belongs to. */
  readonly collection: CollectionId;
  readonly label: string;
  readonly description: string;
  /**
   * The sections the hit appears in: none for a collection, itself for a section, and the object's
   * `visibleIn` for an object.
   */
  readonly visibleIn: readonly SectionId[];
}
