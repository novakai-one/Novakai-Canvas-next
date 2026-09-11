import { z } from 'zod';
import { label, objectId, size, sourceId } from '../brands.js';
import { contentSchema, portSchema } from './content.js';
export const objectKind = z.enum([
  'step',
  'start',
  'end',
  'decision',
  'fork',
  'join',
  'entity',
  'module',
  'interface',
  'function',
  'state',
  'participant',
  'concept',
  'system',
  'note',
]);
export const objectSchema = z
  .strictObject({
    id: objectId,
    kind: objectKind,
    label,
    role: label.default('neutral'),
    size: size.default('medium'),
    step: z.number().int().positive().optional(),
    content: z.array(contentSchema).readonly().default([]),
    ports: z.array(portSchema).readonly().default([]),
    sources: z.array(sourceId).readonly().default([]),
  })
  .readonly();
export type DiagramObject = z.infer<typeof objectSchema>;
export type ObjectKind = z.infer<typeof objectKind>;
