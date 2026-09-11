import { z } from 'zod';
import { label, relationshipId, sourceId } from '../brands.js';
import { endpointSchema } from './content.js';
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
const cardinality = z.enum(['0..1', '1', '0..many', '1..many']);
export const relationshipSchema = z
  .strictObject({
    id: relationshipId,
    kind: relationshipKind,
    label,
    source: endpointSchema,
    target: endpointSchema,
    from: cardinality.optional(),
    to: cardinality.optional(),
    guard: z.string().optional(),
    effect: z.string().optional(),
    style: z.enum(['solid', 'dashed']).default('solid'),
    sources: z.array(sourceId).readonly().default([]),
  })
  .readonly();
export type Relationship = z.infer<typeof relationshipSchema>;
