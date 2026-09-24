/*
 * The manual snapshot a bundle carries: the stored human layout decisions (placements, orders,
 * wire sides and bend points) that the DSL source does not hold. Automatic geometry is not
 * included; Layout recomputes it. The schema checks structure and size only; import checks that
 * every override points at a real section, object, group or wire.
 *
 * The private schemas below are declared before `manualSchema` because it is built from them.
 * `point` and `placement` are each one shared instance, reused where they appear. The exported
 * schema is a shared, unfrozen object; its `parse` throws a `ZodError`.
 */
import { z } from 'zod';
import { identity } from '../brands.js';
import { PROJECTION_CAPACITY } from './limits.js';

/** A position `{ x, y }` in collection coordinates. */
const point = z.strictObject({ x: z.number(), y: z.number() });

/** A stored position with optional positive `width` and `height`, and whether it is locked. */
const placement = point.extend({
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  locked: z.boolean(),
});

/** Which side of a node a wire attaches to; `auto` lets Layout choose. */
const side = z.enum(['auto', 'top', 'right', 'bottom', 'left']);

/** A stored placement for one object appearance. */
const appearance = z.strictObject({ object: identity, placement });

/** A stored placement for one group. */
const group = z.strictObject({ id: identity, placement });

/** One wire's stored attachment sides, lock and optional bend points (2–10,000). */
const wire = z.strictObject({
  relationship: identity,
  manual: z.array(point).min(2).max(10000).optional(),
  locked: z.boolean(),
  sourceSide: side,
  targetSide: side,
});

/**
 * One section's overrides: the order of its appearances, groups and sequence items, its own
 * optional placement, and the placed appearances, placed groups and wires. List sizes are
 * capped by the projection capacity (sequence order at 10,000).
 */
const section = z.strictObject({
  id: identity,
  appearanceOrder: z.array(identity).max(PROJECTION_CAPACITY.maxNodes),
  groupOrder: z.array(identity).max(PROJECTION_CAPACITY.maxNodes),
  sequenceOrder: z
    .array(z.strictObject({ id: identity, order: z.number().int().nonnegative() }))
    .max(10000),
  placement: placement.optional(),
  appearances: z.array(appearance).max(PROJECTION_CAPACITY.maxNodes),
  groups: z.array(group).max(PROJECTION_CAPACITY.maxNodes),
  wires: z.array(wire).max(PROJECTION_CAPACITY.maxWires),
});

/**
 * A whole manual snapshot: `schemaVersion` 1 and one entry per section (at most the projection's
 * section capacity). Extra fields are rejected at every level. The parsed top-level record is
 * frozen; nested records are not.
 */
export const manualSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    sections: z.array(section).max(PROJECTION_CAPACITY.maxSections),
  })
  .readonly();

/** A parsed manual snapshot. */
export type ManualSnapshot = z.infer<typeof manualSchema>;

/** One section's parsed overrides. */
export type ManualSection = ManualSnapshot['sections'][number];
