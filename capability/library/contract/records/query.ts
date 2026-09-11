import { z } from 'zod';
import { folderId, text, nonnegativeInteger } from '../brands.js';
import type { CollectionId, SectionId, ObjectId } from '../brands.js';
import type { ReadVersions } from '../types.js';
/** Largest accepted/emitted opaque cursor; oversize output is a typed limit failure. */
export const MAX_CURSOR_LENGTH = 1_000_000;
const hitKind = z.enum(['collection', 'section', 'object']);
/** Search criteria. Omitted folder searches all folders and the implicit root. */
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
/** Internal opaque pagination envelope; keys bind exact query/preferences/source versions. */
export const cursorSchema = z
  .strictObject({ offset: nonnegativeInteger, queryKey: z.string(), versionKey: z.string() })
  .readonly();
/** Normalized/defaulted search request. */
export type QueryRequest = z.infer<typeof querySchema>;
/** Common display/navigation metadata without copying authoritative content into the catalog. */
interface HitContent {
  readonly collection: CollectionId;
  readonly label: string;
  readonly description: string;
  readonly visibleIn: readonly SectionId[];
}
/** Hit kind preserves its ID namespace for navigation. */
export type SearchHit = HitContent &
  (
    | { readonly kind: 'collection'; readonly id: CollectionId }
    | { readonly kind: 'section'; readonly id: SectionId }
    | { readonly kind: 'object'; readonly id: ObjectId }
  );
/** Immutable page with exact source provenance; no nextCursor means traversal is complete. */
export interface QueryPage {
  readonly hits: readonly SearchHit[];
  readonly total: number;
  readonly versions: ReadVersions;
  readonly nextCursor?: string;
}

/** Decoded private cursor data used by discovery; consumers treat cursor strings as opaque. */
export type CursorEnvelope = z.infer<typeof cursorSchema>;
