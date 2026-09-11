import { z } from 'zod';
import { assetId, objectId, relationshipId, sectionId, sourceId } from '../brands.js';
import { collectionSchema, assetSchema, sourceSchema } from './collection.js';
import { objectSchema } from './object.js';
import { sectionSchema } from './section.js';
import { relationshipSchema } from './relationship.js';
const mode = z.enum(['create', 'replace']);
const objects = z
  .strictObject({ op: mode, target: z.literal('objects'), value: objectSchema })
  .readonly();
const relationships = z
  .strictObject({ op: mode, target: z.literal('relationships'), value: relationshipSchema })
  .readonly();
const sections = z
  .strictObject({ op: mode, target: z.literal('sections'), value: sectionSchema })
  .readonly();
const assets = z
  .strictObject({ op: mode, target: z.literal('assets'), value: assetSchema })
  .readonly();
const sources = z
  .strictObject({ op: mode, target: z.literal('sources'), value: sourceSchema })
  .readonly();
export const recordChangeSchema = z.union([objects, relationships, sections, assets, sources]);
const remove = z.union([
  z
    .strictObject({ op: z.literal('remove'), target: z.literal('objects'), id: objectId })
    .readonly(),
  z
    .strictObject({
      op: z.literal('remove'),
      target: z.literal('relationships'),
      id: relationshipId,
    })
    .readonly(),
  z
    .strictObject({ op: z.literal('remove'), target: z.literal('sections'), id: sectionId })
    .readonly(),
  z.strictObject({ op: z.literal('remove'), target: z.literal('assets'), id: assetId }).readonly(),
  z
    .strictObject({ op: z.literal('remove'), target: z.literal('sources'), id: sourceId })
    .readonly(),
]);
const replaceDocument = z
  .strictObject({ op: z.literal('replace-document'), value: collectionSchema })
  .readonly();
const deleteObject = z
  .strictObject({
    op: z.literal('delete-object'),
    id: objectId,
    cascade: z.boolean().default(false),
  })
  .readonly();
const hide = z
  .strictObject({ op: z.literal('hide'), section: sectionId, object: objectId })
  .readonly();
const resetLayout = z
  .strictObject({ op: z.literal('reset-layout'), section: sectionId })
  .readonly();
const resetRoute = z
  .strictObject({ op: z.literal('reset-route'), section: sectionId, relationship: relationshipId })
  .readonly();
export const changeSchema = z.union([
  recordChangeSchema,
  remove,
  replaceDocument,
  deleteObject,
  hide,
  resetLayout,
  resetRoute,
]);
export const changesSchema = z.array(changeSchema).max(1000).readonly();
export type Change = z.infer<typeof changeSchema>;
export type RecordChange = z.infer<typeof recordChangeSchema>;
