import { z } from 'zod';
import { label, objectId, size, sourceId } from '../brands.js';
import { contentSchema, portSchema } from './content.js';
import { frameSchema, compositionSchema } from './composition.js';

/** Supported semantic node kinds, independent of the section displaying the node. */
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

/** Canonical node content and semantic appearance preferences. Section-specific geometry lives elsewhere. */
export const objectSchema = z
  .strictObject({
    id: objectId,
    kind: objectKind,
    label,
    role: label.default('neutral'),
    size: size.default('medium'),
    frame: frameSchema.default('auto'),
    composition: compositionSchema.default('stack'),
    step: z.number().int().positive().optional(),
    content: z.array(contentSchema).readonly().default([]),
    ports: z.array(portSchema).readonly().default([]),
    sources: z.array(sourceId).readonly().default([]),
  })
  .readonly();

/** One reusable semantic object; several sections may show it without copying its content. */
export type DiagramObject = z.infer<typeof objectSchema>;

/** Closed set of semantic node kinds accepted by the object schema. */
export type ObjectKind = z.infer<typeof objectKind>;
