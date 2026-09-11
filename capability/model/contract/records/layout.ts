import { z } from 'zod';
import { identifier } from '../brands.js';
export const pointSchema = z.strictObject({ x: z.number(), y: z.number() }).readonly();
export const placementSchema = z
  .strictObject({
    x: z.number(),
    y: z.number(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    locked: z.boolean().default(false),
  })
  .readonly();
export const layoutTargetSchema = z
  .strictObject({ kind: z.enum(['object', 'group', 'section']), id: identifier })
  .readonly();
const constraintSchema = z
  .strictObject({
    kind: z.enum(['rank', 'before', 'below', 'align']),
    targets: z.array(layoutTargetSchema).min(2).readonly(),
  })
  .readonly();
export const layoutSchema = z
  .strictObject({
    algorithm: z.enum(['flow', 'layered', 'tree', 'sequence', 'grid']),
    direction: z.enum(['right', 'down', 'left', 'up']).default('right'),
    gap: z.enum(['compact', 'normal', 'roomy']).default('normal'),
    constraints: z.array(constraintSchema).readonly().default([]),
  })
  .readonly();
export type LayoutIntent = z.infer<typeof layoutSchema>;
export type LayoutTarget = z.infer<typeof layoutTargetSchema>;
export type Placement = z.infer<typeof placementSchema>;
