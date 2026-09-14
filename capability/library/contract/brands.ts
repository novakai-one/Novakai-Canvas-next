import { z } from 'zod';

/** Shared identifier grammar; each record namespace mints an incompatible checked brand. */
const identifier = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]*$/);
/** Catalog identity; distinct from its folders and referenced collections. */
export const catalogId = identifier.brand<'CatalogId'>();
/** Folder identity within one catalog; root is represented by absence, never a sentinel ID. */
export const folderId = identifier.brand<'FolderId'>();
/** Canonical collection reference supplied by the host's authoritative projection. */
export const collectionId = identifier.brand<'CollectionId'>();
/** Object identity scoped to its containing collection. */
export const objectId = identifier.brand<'ObjectId'>();
/** Section identity scoped to its containing collection. */
export const sectionId = identifier.brand<'SectionId'>();
/** Bounded display/search text; original content is not normalized by the schema. */
export const text = z.string().max(10_000);
/** Display names cannot be whitespace-only. */
export const label = text.refine((value): boolean => value.trim().length > 0, 'Must be nonblank');
/** Revision and epoch values must survive lossless JSON round-tripping. */
export const nonnegativeInteger = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
/** Ordering allows negative values but requires lossless integer representation. */
export const order = z.number().int().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);
/** Checked catalog ID. */
export type CatalogId = z.infer<typeof catalogId>;
/** Checked folder ID. */
export type FolderId = z.infer<typeof folderId>;
/** Checked collection reference. */
export type CollectionId = z.infer<typeof collectionId>;
/** Checked object reference. */
export type ObjectId = z.infer<typeof objectId>;
/** Checked section reference. */
export type SectionId = z.infer<typeof sectionId>;
