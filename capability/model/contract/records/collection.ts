import { z } from 'zod';
import { assetId, collectionId, digest, label, sourceId } from '../brands.js';
import { definitionSchema } from './definition.js';
import { objectSchema } from './object.js';
import { relationshipSchema } from './relationship.js';
import { sectionSchema } from './section.js';
import { layoutSchema } from './layout.js';
import { changeBlockSchema } from './change-block.js';

/** Asset metadata and content identity. Byte storage and license interpretation are outside Model. */
export const assetSchema = z
  .strictObject({
    id: assetId,
    digest,
    mediaType: label,
    alt: label,
    kind: z.enum(['image', 'icon', 'font']).optional(),
    license: z.string().optional(),
    attribution: z.string().optional(),
  })
  .readonly();

/** Provenance claim attached to objects or relationships; Model does not verify the URI. */
export const sourceSchema = z
  .strictObject({
    id: sourceId,
    uri: label,
    revision: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['asserted', 'source-backed', 'unverified']).default('unverified'),
  })
  .readonly();

/** Pinned theme identity and available role names; referenced roles must resolve here. */
export const themeSchema = z
  .strictObject({ id: label, version: label, digest, roles: z.array(label).min(1).readonly() })
  .readonly();

/** Strict collection shape with explicit defaults. Cross-record validity is checked by Model core. */
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
    /** Shared definitions were added after schema version 1; old records default to empty. */
    definitions: z.array(definitionSchema).readonly().default([]),
    assets: z.array(assetSchema).readonly().default([]),
    /** Declared change blocks; nodes never carry change status themselves. */
    changes: z.array(changeBlockSchema).readonly().default([]),
    arrangement: layoutSchema,
  })
  .readonly();

/** Readonly canonical diagram data shared by all views in this collection. */
export type Collection = z.infer<typeof collectionSchema>;
