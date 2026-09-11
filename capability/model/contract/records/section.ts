import { z } from 'zod';
import {
  descendantId,
  groupId,
  label,
  objectId,
  relationshipId,
  sectionId,
  size,
} from '../brands.js';
import { layoutSchema, placementSchema, pointSchema } from './layout.js';
export const appearanceSchema = z
  .strictObject({
    object: objectId,
    group: groupId.optional(),
    role: label.optional(),
    size: size.optional(),
    detail: z.enum(['full', 'summary', 'label']).default('full'),
    participation: z.enum(['tree', 'annotation']).optional(),
    placement: placementSchema.optional(),
  })
  .readonly();
export const groupSchema = z
  .strictObject({
    id: groupId,
    title: label,
    parent: groupId.optional(),
    represents: objectId.optional(),
    layout: layoutSchema,
    placement: placementSchema.optional(),
  })
  .readonly();
const side = z.enum(['auto', 'top', 'right', 'bottom', 'left']);
export const wireSchema = z
  .strictObject({
    relationship: relationshipId,
    route: z.enum(['orthogonal', 'curve']).default('orthogonal'),
    sourceSide: side.default('auto'),
    targetSide: side.default('auto'),
    manual: z.array(pointSchema).min(2).readonly().optional(),
    locked: z.boolean().default(false),
  })
  .readonly();
const sequenceBase = {
  id: descendantId,
  parent: descendantId.optional(),
  branch: descendantId.optional(),
  order: z.number().int().nonnegative(),
};
const event = z
  .strictObject({
    ...sequenceBase,
    kind: z.literal('event'),
    source: objectId,
    target: objectId,
    label,
    message: z.enum(['call', 'return', 'async']),
    activate: z.boolean().optional(),
  })
  .readonly();
const branch = z.strictObject({ id: descendantId, label }).readonly();
const fragment = z
  .strictObject({
    ...sequenceBase,
    kind: z.literal('fragment'),
    operator: z.enum(['alt', 'opt', 'loop']),
    label,
    branches: z.array(branch).readonly().default([]),
  })
  .readonly();
export const sequenceSchema = z.union([event, fragment]);
export const modeSchema = z.enum([
  'flow',
  'er',
  'modules',
  'tree',
  'sequence',
  'state',
  'story',
  'grid',
]);
export const sectionSchema = z
  .strictObject({
    id: sectionId,
    title: label,
    mode: modeSchema,
    order: z.number().int().default(0),
    layout: layoutSchema,
    appearances: z.array(appearanceSchema).readonly().default([]),
    groups: z.array(groupSchema).readonly().default([]),
    wires: z.array(wireSchema).readonly().default([]),
    root: objectId.optional(),
    sequence: z.array(sequenceSchema).readonly().default([]),
    placement: placementSchema.optional(),
  })
  .readonly();
export type Section = z.infer<typeof sectionSchema>;
export type Appearance = z.infer<typeof appearanceSchema>;
export type Group = z.infer<typeof groupSchema>;
export type WireAppearance = z.infer<typeof wireSchema>;
export type SequenceItem = z.infer<typeof sequenceSchema>;
export type Mode = z.infer<typeof modeSchema>;
