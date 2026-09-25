/*
 * Library's checked identities and shared value rules. Every schema is built by a function, so
 * each caller gets its own schema object and no schema is shared between calls or consumers.
 * Input these schemas reject is a `shape` diagnostic; the caller corrects the input and Authoring
 * owns commit and recovery.
 */
import { z } from 'zod';

/** The most items any one record list (folders, entries, collections, sections, objects, visits) may hold. */
export const MAX_RECORDS = 10_000;

/** The longest display or search text, in characters. */
export const MAX_TEXT_LENGTH = 10_000;

/**
 * Builds the catalog ID schema. A catalog is separate from its folders and the collections it
 * lists.
 *
 * @returns A new schema that brands a checked ID as `CatalogId`.
 * @throws Never.
 */
export function catalogIdSchema(): z.core.$ZodBranded<z.ZodString, 'CatalogId'> {
  return identifierSchema().brand<'CatalogId'>();
}

/**
 * Builds the folder ID schema. A folder ID is unique within one catalog. The catalog root has no
 * ID: an entry or folder at the root simply has no folder or parent.
 *
 * @returns A new schema that brands a checked ID as `FolderId`.
 * @throws Never.
 */
export function folderIdSchema(): z.core.$ZodBranded<z.ZodString, 'FolderId'> {
  return identifierSchema().brand<'FolderId'>();
}

/**
 * Builds the collection ID schema, for IDs given by the host's authoritative collection
 * projection.
 *
 * @returns A new schema that brands a checked ID as `CollectionId`.
 * @throws Never.
 */
export function collectionIdSchema(): z.core.$ZodBranded<z.ZodString, 'CollectionId'> {
  return identifierSchema().brand<'CollectionId'>();
}

/**
 * Builds the object ID schema. An object ID is unique within its collection.
 *
 * @returns A new schema that brands a checked ID as `ObjectId`.
 * @throws Never.
 */
export function objectIdSchema(): z.core.$ZodBranded<z.ZodString, 'ObjectId'> {
  return identifierSchema().brand<'ObjectId'>();
}

/**
 * Builds the section ID schema. A section ID is unique within its collection.
 *
 * @returns A new schema that brands a checked ID as `SectionId`.
 * @throws Never.
 */
export function sectionIdSchema(): z.core.$ZodBranded<z.ZodString, 'SectionId'> {
  return identifierSchema().brand<'SectionId'>();
}

/**
 * Builds the schema for display or search text: at most {@link MAX_TEXT_LENGTH} characters, kept
 * exactly as given.
 *
 * @returns A new text schema.
 * @throws Never.
 */
export function textSchema(): z.ZodString {
  return z.string().max(MAX_TEXT_LENGTH);
}

/**
 * Builds the schema for a display name: text (see {@link textSchema}) that is not empty or only
 * whitespace. The rejection message is "Must be nonblank".
 *
 * @returns A new label schema.
 * @throws Never.
 */
export function labelSchema(): z.ZodType<string, string> {
  return textSchema().refine(isNonblank, 'Must be nonblank');
}

/**
 * Builds the schema for a revision or epoch: a whole number from 0 to `Number.MAX_SAFE_INTEGER`,
 * so it survives a JSON round trip exactly.
 *
 * @returns A new schema.
 * @throws Never.
 */
export function nonnegativeIntegerSchema(): z.ZodNumber {
  return z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
}

/**
 * Builds the schema for a sort position: any safe whole number, negative allowed.
 *
 * @returns A new schema.
 * @throws Never.
 */
export function orderSchema(): z.ZodNumber {
  return z.number().int().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);
}

/**
 * Builds the schema of a record list: a readonly array of at most {@link MAX_RECORDS} items,
 * empty when omitted.
 *
 * @param item - The schema of one item.
 * @returns A new list schema.
 * @throws Never.
 */
export function recordList<T extends z.ZodType>(
  item: T,
): z.ZodDefault<z.ZodReadonly<z.ZodArray<T>>> {
  return z.array(item).max(MAX_RECORDS).readonly().default([]);
}

/** A catalog ID that passed {@link catalogIdSchema}. */
export type CatalogId = string & z.core.$brand<'CatalogId'>;

/** A folder ID that passed {@link folderIdSchema}. */
export type FolderId = string & z.core.$brand<'FolderId'>;

/** A collection ID that passed {@link collectionIdSchema}. */
export type CollectionId = string & z.core.$brand<'CollectionId'>;

/** An object ID that passed {@link objectIdSchema}. */
export type ObjectId = string & z.core.$brand<'ObjectId'>;

/** A section ID that passed {@link sectionIdSchema}. */
export type SectionId = string & z.core.$brand<'SectionId'>;

/**
 * The shared ID grammar: a letter, then letters, digits, `_` or `-`. There is no length limit.
 * Each brand above is distinct, so one kind of ID cannot be passed where another is expected.
 */
function identifierSchema(): z.ZodString {
  return z.string().regex(/^[A-Za-z][A-Za-z0-9_-]*$/);
}

/** Whether text has at least one character that is not whitespace. */
function isNonblank(value: string): boolean {
  return value.trim().length > 0;
}
