import { z } from 'zod';
import { catalogId, folderId, collectionId, label, nonnegativeInteger, order } from '../brands.js';
/** One collection-independent folder; parent absence denotes catalog root. */
export const folderSchema = z
  .strictObject({
    id: folderId,
    title: label,
    parent: folderId.optional(),
    order: order.default(0),
  })
  .readonly();
/** Organization only: canonical title and content never become mutable catalog fields. */
export const entrySchema = z
  .strictObject({
    collection: collectionId,
    folder: folderId.optional(),
    order: order.default(0),
    archived: z.boolean().default(false),
  })
  .readonly();
/** Strict versioned organization; core checks identities, parent graph and inventory consistency. */
export const catalogSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    id: catalogId,
    revision: nonnegativeInteger,
    folders: z.array(folderSchema).max(10_000).readonly().default([]),
    entries: z.array(entrySchema).max(10_000).readonly().default([]),
  })
  .readonly();
/** Readonly authoritative catalog record. */
export type Catalog = z.infer<typeof catalogSchema>;
/** Catalog-local folder record. */
export type Folder = z.infer<typeof folderSchema>;
/** The unique organization entry for one live or archived collection. */
export type CatalogEntry = z.infer<typeof entrySchema>;
