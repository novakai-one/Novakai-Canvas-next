import { z } from 'zod';
import { coordinate, dimension } from '../brands.js';
/** Display-only copies of engine-owned geometry; never accepted as routing instructions. */
const bounds = z
  .strictObject({ x: coordinate, y: coordinate, width: dimension, height: dimension })
  .readonly();
const road = z
  .strictObject({
    id: z.string(),
    kind: z.enum(['street', 'driveway']),
    axis: z.enum(['horizontal', 'vertical']),
    bounds,
    accessRole: z.enum(['entry', 'exit']).nullable(),
  })
  .readonly();
const lane = z
  .strictObject({
    id: z.string(),
    roadId: z.string(),
    bounds,
    direction: z.enum(['left', 'right', 'up', 'down']),
  })
  .readonly();
export const routingOverlay = z
  .strictObject({
    roads: z.array(road).readonly(),
    lanes: z.array(lane).readonly(),
  })
  .readonly();
export type RoutingOverlay = z.infer<typeof routingOverlay>;
