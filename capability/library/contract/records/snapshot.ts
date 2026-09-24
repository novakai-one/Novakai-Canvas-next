import { z } from 'zod';
import {
  collectionId,
  sectionId,
  objectId,
  label,
  text,
  nonnegativeInteger,
  MAX_RECORDS,
  recordList,
} from '../brands.js';
import { catalogSchema } from './catalog.js';

// The section, object and visit schemas are private. Each is declared before the exported schema
// built from it.

/** Checks one section: its ID and nonblank title. */
const sectionSchema = z.strictObject({ id: sectionId, title: label }).readonly();

/**
 * Checks one object: its ID, nonblank label, description (default empty) and the sections it is
 * visible in (default none; an object may be unplaced).
 */
const objectSchema = z
  .strictObject({
    id: objectId,
    label,
    description: text.default(''),
    visibleIn: recordList(sectionId),
  })
  .readonly();

/**
 * Checks one collection projection: the searchable view of one collection revision (ID, revision,
 * title, description, sections and objects). It can always be rebuilt from the collection and is
 * never stored as a document of its own.
 */
const collectionProjectionSchema = z
  .strictObject({
    id: collectionId,
    revision: nonnegativeInteger,
    title: label,
    description: text.default(''),
    sections: recordList(sectionSchema),
    objects: recordList(objectSchema),
  })
  .readonly();

/**
 * Checks the host's complete collection inventory: at most 10,000 projections. Validation checks
 * that every collection has exactly one catalog entry and every entry has a collection.
 */
export const inventorySchema = z.array(collectionProjectionSchema).max(MAX_RECORDS).readonly();

/**
 * Checks one recent visit: a collection and when it was opened (a number supplied by the host;
 * larger means more recent; Library reads no clock). Validation also requires the collection to
 * exist and allows at most one visit per collection.
 */
const recentSchema = z
  .strictObject({ collection: collectionId, openedAt: nonnegativeInteger })
  .readonly();

/**
 * Checks a Library snapshot: the catalog, the complete collection inventory and the recent visits
 * (default none), all read at one consistent point. Every Library operation runs on one snapshot.
 */
export const snapshotSchema = z
  .strictObject({
    catalog: catalogSchema,
    collections: inventorySchema,
    recent: recordList(recentSchema),
  })
  .readonly();

/** A snapshot that passed {@link snapshotSchema}, with defaults filled in. */
export type LibrarySnapshot = z.infer<typeof snapshotSchema>;

/** A collection projection with its authoritative revision. */
export type CollectionProjection = z.infer<typeof collectionProjectionSchema>;

/**
 * A recent visit (at most one per collection, and the collection must exist). Used only for
 * `recent` sorting and in the cursor's query key.
 */
export type RecentVisit = z.infer<typeof recentSchema>;
