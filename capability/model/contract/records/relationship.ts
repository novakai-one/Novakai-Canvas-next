import { z } from 'zod';
import { label, relationshipId, sourceId } from '../brands.js';
import { endpointSchema } from './content.js';

/** Supported semantic connections; core checks endpoints according to the chosen kind. */
export const relationshipKind = z.enum([
  'flow',
  'association',
  'imports',
  'calls',
  'implements',
  'contains',
  'parent',
  'reference',
  'transition',
]);

/** Endpoint multiplicities rendered by ER notation; the two sides are independently specified. */
const cardinalitySchema = z.enum(['0..1', '1', '0..many', '1..many']);

/** Labelled canonical relationship. Cardinalities belong only to ER associations. */
export const relationshipSchema = z
  .strictObject({
    id: relationshipId,
    kind: relationshipKind,
    label,
    source: endpointSchema,
    target: endpointSchema,
    from: cardinalitySchema.optional(),
    to: cardinalitySchema.optional(),
    guard: z.string().optional(),
    effect: z.string().optional(),
    style: z.enum(['solid', 'dashed']).default('solid'),
    sources: z.array(sourceId).readonly().default([]),
  })
  .readonly();

/** Connection shared across views; route geometry belongs to each wire appearance. */
export type Relationship = z.infer<typeof relationshipSchema>;

/** Closed set of canonical relationship kinds used by endpoint and view policies. */
export type RelationshipKind = z.infer<typeof relationshipKind>;
