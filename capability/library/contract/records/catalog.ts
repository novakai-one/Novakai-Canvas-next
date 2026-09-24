import { z } from 'zod';
import { catalogId, folderId, collectionId, label, nonnegativeInteger, order } from '../brands.js';

/**
 * Checks one folder: its ID, nonblank title, optional parent folder and sort position (default 0).
 * A folder without a parent sits at the catalog root. Folders are independent of collections.
 */
export const folderSchema = z
  .strictObject({
    id: folderId,
    title: label,
    parent: folderId.optional(),
    order: order.default(0),
  })
  .readonly();

/**
 * Checks one catalog entry: where a collection sits (optional folder; none means the root), its
 * sort position (default 0) and whether it is archived (default false). An entry holds
 * organization only; the collection's title and content stay in the collection.
 */
export const entrySchema = z
  .strictObject({
    collection: collectionId,
    folder: folderId.optional(),
    order: order.default(0),
    archived: z.boolean().default(false),
  })
  .readonly();

/**
 * Checks the shape of a catalog (schema version 1): its ID, revision, and up to 10,000 folders
 * and 10,000 entries (each defaults to empty). Unknown keys are rejected. The rules across records
 * (unique IDs, existing parents and collections, no parent cycles) are checked by validation.
 */
export const catalogSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    id: catalogId,
    revision: nonnegativeInteger,
    folders: z.array(folderSchema).max(10_000).readonly().default([]),
    entries: z.array(entrySchema).max(10_000).readonly().default([]),
  })
  .readonly();

/** A catalog that passed {@link catalogSchema}, with defaults filled in. */
export type Catalog = z.infer<typeof catalogSchema>;

/** A folder that passed {@link folderSchema}. */
export type Folder = z.infer<typeof folderSchema>;

/** The one entry for a live or archived collection, as checked by {@link entrySchema}. */
export type CatalogEntry = z.infer<typeof entrySchema>;
