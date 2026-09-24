import { z } from 'zod';

/**
 * The shared grammar for Library IDs: a letter, then letters, digits, `_` or `-`. There is no
 * length limit. Input that fails these schemas is a `shape` diagnostic; the caller corrects it. Declared first because the branded schemas below are built from it; each brand
 * is distinct, so one kind of ID cannot be passed where another is expected.
 */
const identifier = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]*$/);

/** Checks a catalog ID. A catalog is separate from its folders and the collections it lists. */
export const catalogId = identifier.brand<'CatalogId'>();

/**
 * Checks a folder ID, unique within one catalog. The catalog root has no ID: an entry or folder
 * at the root simply has no folder or parent.
 */
export const folderId = identifier.brand<'FolderId'>();

/** Checks a collection ID, as given by the host's authoritative collection projection. */
export const collectionId = identifier.brand<'CollectionId'>();

/** Checks an object ID, unique within its collection. */
export const objectId = identifier.brand<'ObjectId'>();

/** Checks a section ID, unique within its collection. */
export const sectionId = identifier.brand<'SectionId'>();

/** Checks display or search text: at most 10,000 characters. The text is kept exactly as given. */
export const text = z.string().max(10_000);

/** Checks a display name: {@link text} that is not empty or only whitespace ("Must be nonblank"). */
export const label = text.refine((value): boolean => value.trim().length > 0, 'Must be nonblank');

/**
 * Checks a revision or epoch: a whole number from 0 to `Number.MAX_SAFE_INTEGER`, so it survives
 * a JSON round trip exactly.
 */
export const nonnegativeInteger = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

/** Checks a sort position: any safe whole number, negative allowed. */
export const order = z.number().int().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);

/** A catalog ID that passed {@link catalogId}. */
export type CatalogId = z.infer<typeof catalogId>;

/** A folder ID that passed {@link folderId}. */
export type FolderId = z.infer<typeof folderId>;

/** A collection ID that passed {@link collectionId}. */
export type CollectionId = z.infer<typeof collectionId>;

/** An object ID that passed {@link objectId}. */
export type ObjectId = z.infer<typeof objectId>;

/** A section ID that passed {@link sectionId}. */
export type SectionId = z.infer<typeof sectionId>;
