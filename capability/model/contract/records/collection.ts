import { z } from 'zod';
import { assetId, collectionId, digest, label, sourceId } from '../brands.js';
import { objectSchema } from './object.js';
import { relationshipSchema } from './relationship.js';
import { sectionSchema } from './section.js';
import { layoutSchema } from './layout.js';
export const assetSchema = z
  .strictObject({
    id: assetId,
    digest,
    mediaType: label,
    alt: label,
    license: z.string().optional(),
    attribution: z.string().optional(),
  })
  .readonly();
export const sourceSchema = z
  .strictObject({
    id: sourceId,
    uri: label,
    revision: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['asserted', 'source-backed', 'unverified']),
  })
  .readonly();
export const themeSchema = z
  .strictObject({ id: label, version: label, digest, roles: z.array(label).min(1).readonly() })
  .readonly();
export const collectionSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    id: collectionId,
    revision: z.number().int().nonnegative(),
    title: label,
    description: z.string().optional(),
    theme: themeSchema,
    sections: z.array(sectionSchema).readonly().default([]),
    objects: z.array(objectSchema).readonly().default([]),
    relationships: z.array(relationshipSchema).readonly().default([]),
    sources: z.array(sourceSchema).readonly().default([]),
    assets: z.array(assetSchema).readonly().default([]),
    arrangement: layoutSchema,
  })
  .readonly();
export type Collection = z.infer<typeof collectionSchema>;
