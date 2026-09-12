import { z } from 'zod';
import { identity } from '../brands.js';
/** Transfer-only overrides are structurally bounded; Model owns final placement validity. */
const point = z.strictObject({ x: z.number(), y: z.number() });
const placement = point.extend({
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  locked: z.boolean(),
});
const side = z.enum(['auto', 'top', 'right', 'bottom', 'left']);
const appearance = z.strictObject({ object: identity, placement });
const group = z.strictObject({ id: identity, placement });
const wire = z.strictObject({
  relationship: identity,
  manual: z.array(point).min(2).max(10000).optional(),
  locked: z.boolean(),
  sourceSide: side,
  targetSide: side,
});
const section = z.strictObject({
  id: identity,
  appearanceOrder: z.array(identity).max(1000),
  groupOrder: z.array(identity).max(1000),
  sequenceOrder: z
    .array(z.strictObject({ id: identity, order: z.number().int().nonnegative() }))
    .max(10000),
  placement: placement.optional(),
  appearances: z.array(appearance).max(1000),
  groups: z.array(group).max(1000),
  wires: z.array(wire).max(1500),
});
export const manualSchema = z
  .strictObject({ schemaVersion: z.literal(1), sections: z.array(section).max(10) })
  .readonly();
export type ManualSnapshot = z.infer<typeof manualSchema>;
export type ManualSection = ManualSnapshot['sections'][number];
