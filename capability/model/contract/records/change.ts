import { z } from 'zod';
import { assetId, objectId, relationshipId, sectionId, sourceId } from '../brands.js';
import { collectionSchema, assetSchema, sourceSchema } from './collection.js';
import { objectSchema } from './object.js';
import { sectionSchema } from './section.js';
import { relationshipSchema } from './relationship.js';

/** Create requires an absent ID; replace requires an existing ID. */
const recordOperationSchema = z.enum(['create', 'replace']);
const objectChangeSchema = z
  .strictObject({ op: recordOperationSchema, target: z.literal('objects'), value: objectSchema })
  .readonly();
const relationshipChangeSchema = z
  .strictObject({
    op: recordOperationSchema,
    target: z.literal('relationships'),
    value: relationshipSchema,
  })
  .readonly();
const sectionChangeSchema = z
  .strictObject({ op: recordOperationSchema, target: z.literal('sections'), value: sectionSchema })
  .readonly();
const assetChangeSchema = z
  .strictObject({ op: recordOperationSchema, target: z.literal('assets'), value: assetSchema })
  .readonly();
const sourceChangeSchema = z
  .strictObject({ op: recordOperationSchema, target: z.literal('sources'), value: sourceSchema })
  .readonly();

/** Complete-record create or replace. Target selects the exact payload schema. */
export const recordChangeSchema = z.union([
  objectChangeSchema,
  relationshipChangeSchema,
  sectionChangeSchema,
  assetChangeSchema,
  sourceChangeSchema,
]);

/** Removal alone does not cascade; final-batch validation rejects unresolved references. */
const removeChangeSchema = z.union([
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

/** Whole-document replacement preserves identity, revision and omitted geometry. */
const replaceDocumentSchema = z
  .strictObject({ op: z.literal('replace-document'), value: collectionSchema })
  .readonly();

/** Cascade must be explicit when deletion requires dependency cleanup. */
const deleteObjectSchema = z
  .strictObject({
    op: z.literal('delete-object'),
    id: objectId,
    cascade: z.boolean().default(false),
  })
  .readonly();

/** Hides an ordinary appearance and its local incident wires; canonical records survive. */
const hideAppearanceSchema = z
  .strictObject({ op: z.literal('hide'), section: sectionId, object: objectId })
  .readonly();

/** Clears section, appearance and group placements plus manual wire points and locks. */
const resetLayoutSchema = z
  .strictObject({ op: z.literal('reset-layout'), section: sectionId })
  .readonly();

/** Clears one visible wire override while retaining its routing style and attachment preferences. */
const resetRouteSchema = z
  .strictObject({ op: z.literal('reset-route'), section: sectionId, relationship: relationshipId })
  .readonly();

/** Supported semantic mutations; no arbitrary JSON paths or direct persistence writes. */
export const changeSchema = z.union([
  recordChangeSchema,
  removeChangeSchema,
  replaceDocumentSchema,
  deleteObjectSchema,
  hideAppearanceSchema,
  resetLayoutSchema,
  resetRouteSchema,
]);

/** Ordered, bounded batch of at most 1,000 operations; final validity is checked after application. */
export const changesSchema = z.array(changeSchema).max(1000).readonly();

/** One checked operation. Model plans it; Authoring decides whether to commit it. */
export type Change = z.infer<typeof changeSchema>;

/** Complete-record create or replace; omitted fields receive schema defaults. */
export type RecordChange = z.infer<typeof recordChangeSchema>;
