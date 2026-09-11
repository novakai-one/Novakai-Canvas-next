import { z } from 'zod';
import { collectionId, sectionId, objectId, label, text, nonnegativeInteger } from '../brands.js';
import { catalogSchema } from './catalog.js';
const sectionSchema = z.strictObject({ id: sectionId, title: label }).readonly();
const objectSchema = z
  .strictObject({
    id: objectId,
    label,
    description: text.default(''),
    visibleIn: z.array(sectionId).max(10_000).readonly().default([]),
  })
  .readonly();
/** Rebuildable projection from one committed/proposed collection revision; not a competing document. */
export const collectionProjectionSchema = z
  .strictObject({
    id: collectionId,
    revision: nonnegativeInteger,
    title: label,
    description: text.default(''),
    sections: z.array(sectionSchema).max(10_000).readonly().default([]),
    objects: z.array(objectSchema).max(10_000).readonly().default([]),
  })
  .readonly();
/** Complete authoritative inventory supplied by the host; core checks membership bijection. */
export const inventorySchema = z.array(collectionProjectionSchema).max(10_000).readonly();
/** Local visit preference, supplied by the host without reading a clock inside Library. */
const recentSchema = z
  .strictObject({ collection: collectionId, openedAt: nonnegativeInteger })
  .readonly();
/** Consistent catalog/content projection and current visit preferences for one pure operation. */
export const snapshotSchema = z
  .strictObject({
    catalog: catalogSchema,
    collections: inventorySchema,
    recent: z.array(recentSchema).max(10_000).readonly().default([]),
  })
  .readonly();
/** Validated discovery snapshot. */
export type LibrarySnapshot = z.infer<typeof snapshotSchema>;
/** Collection title/content read projection with its authoritative revision. */
export type CollectionProjection = z.infer<typeof collectionProjectionSchema>;
/** Visit preference used only for ranking and cursor identity. */
export type RecentVisit = z.infer<typeof recentSchema>;
