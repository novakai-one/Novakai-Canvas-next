/*
 * The catalog records: folders, entries and the catalog that holds them. The record types are
 * declared first; each schema is built by a function whose return type proves it produces that
 * record, and no schema object is shared between calls. A record these schemas reject is a
 * `shape` diagnostic; the caller corrects it, and Authoring owns commit and recovery.
 */
import { z } from 'zod';
import {
  catalogIdSchema,
  folderIdSchema,
  collectionIdSchema,
  labelSchema,
  nonnegativeIntegerSchema,
  orderSchema,
  recordList,
  type CatalogId,
  type CollectionId,
  type FolderId,
} from '../brands.js';

/** A folder. Without a parent it sits at the catalog root. Folders are independent of collections. */
export interface Folder {
  readonly id: FolderId;
  /** Nonblank display title. */
  readonly title: string;
  /** The parent folder; absent at the root. */
  readonly parent?: FolderId | undefined;
  /** Sort position among siblings. */
  readonly order: number;
}

/**
 * The one entry for a live or archived collection: where it sits and how it sorts. The
 * collection's title and content stay in the collection.
 */
export interface CatalogEntry {
  readonly collection: CollectionId;
  /** The containing folder; absent at the root. */
  readonly folder?: FolderId | undefined;
  /** Sort position. */
  readonly order: number;
  /** Archived collections are hidden from searches unless asked for. */
  readonly archived: boolean;
}

/** A catalog (schema version 1) with its folders and entries. */
export interface Catalog {
  readonly schemaVersion: 1;
  readonly id: CatalogId;
  /** The stored revision; Authoring assigns the next one. */
  readonly revision: number;
  readonly folders: readonly Folder[];
  readonly entries: readonly CatalogEntry[];
}

/**
 * Builds the folder schema: its ID, nonblank title, optional parent folder and sort position
 * (default 0).
 *
 * @returns A new folder schema.
 * @throws Never.
 */
export function folderSchema(): z.ZodType<Folder> {
  return z
    .strictObject({
      id: folderIdSchema(),
      title: labelSchema(),
      parent: folderIdSchema().optional(),
      order: orderSchema().default(0),
    })
    .readonly();
}

/**
 * Builds the catalog entry schema: the collection, an optional folder (none means the root), the
 * sort position (default 0) and whether it is archived (default false).
 *
 * @returns A new entry schema.
 * @throws Never.
 */
export function entrySchema(): z.ZodType<CatalogEntry> {
  return z
    .strictObject({
      collection: collectionIdSchema(),
      folder: folderIdSchema().optional(),
      order: orderSchema().default(0),
      archived: z.boolean().default(false),
    })
    .readonly();
}

/**
 * Builds the catalog schema: its ID, revision, and up to 10,000 folders and 10,000 entries (each
 * defaults to empty). Unknown keys are rejected. The rules across records (unique IDs, existing
 * parents and collections, entry folders exist, one entry per collection, no parent cycles) are
 * checked by validation, not here.
 *
 * @returns A new catalog schema.
 * @throws Never.
 */
export function catalogSchema(): z.ZodType<Catalog> {
  return z
    .strictObject({
      schemaVersion: z.literal(1),
      id: catalogIdSchema(),
      revision: nonnegativeIntegerSchema(),
      folders: recordList(folderSchema()),
      entries: recordList(entrySchema()),
    })
    .readonly();
}
