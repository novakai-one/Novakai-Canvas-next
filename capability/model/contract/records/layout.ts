/** Layout records are immutable checked data. Model validate returns diagnostics; Authoring owns correction, commit and recovery. */
import { z } from 'zod';
import { objectId, groupId, sectionId } from '../brands.js';

/** App-resolved route point. This is stored geometry, not an agent DSL coordinate requirement. */
export const pointSchema = z.strictObject({ x: z.number(), y: z.number() }).readonly();

/** Explicit position and optional dimensions; locked preserves a human layout decision. */
export const placementSchema = z
  .strictObject({
    x: z.number(),
    y: z.number(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    locked: z.boolean().default(false),
  })
  .readonly();

/** Layout address with a namespace-specific checked identity. Core resolves its local scope. */
export const layoutTargetSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('object'), id: objectId }).readonly(),
  z.strictObject({ kind: z.literal('group'), id: groupId }).readonly(),
  z.strictObject({ kind: z.literal('section'), id: sectionId }).readonly(),
]);
const constraintSchema = z
  .strictObject({
    kind: z.enum(['rank', 'before', 'below', 'align']),
    targets: z.array(layoutTargetSchema).min(2).readonly(),
  })
  .readonly();

/** Semantic layout request and ordering constraints. Model validates intent; it does not place nodes. */
export const layoutSchema = z
  .strictObject({
    algorithm: z.enum(['flow', 'layered', 'tree', 'sequence', 'grid']),
    direction: z.enum(['right', 'down', 'left', 'up']).default('right'),
    gap: z.enum(['compact', 'normal', 'roomy']).default('normal'),
    columns: z.number().int().min(1).max(12).optional(),
    constraints: z.array(constraintSchema).readonly().default([]),
  })
  .readonly();

/** Algorithm, direction, spacing and relative constraints for one layout scope. */
export type LayoutIntent = z.infer<typeof layoutSchema>;

/** Discriminated object, group or section address; IDs retain their namespace. */
export type LayoutTarget = z.infer<typeof layoutTargetSchema>;

/** Stored geometric override; absence requests automatic placement. */
export type Placement = z.infer<typeof placementSchema>;

/** One relative ordering or alignment rule; target scope is validated in core. */
export type LayoutConstraint = z.infer<typeof constraintSchema>;
