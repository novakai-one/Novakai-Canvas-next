import { z } from 'zod';
import { identity } from '../brands.js';
import { box, point } from './geometry.js';
/** Preferences carry geometry only; measured content and recursively nested scene keys cannot enter a derivation. */
const previousSection = z.strictObject({
  id: identity,
  origin: point,
  box,
  nodes: z.array(z.strictObject({ id: identity, box })).readonly(),
  wires: z.array(z.strictObject({ id: identity, points: z.array(point).readonly() })).readonly(),
});
/** Foreign measurements are compared with the already admitted owner inputs before the key gains meaning. */
export const derivation = z.strictObject({
  projection: z.unknown(),
  measurements: z.unknown(),
  options: z.unknown(),
  engines: z.array(z.string()).readonly(),
  previous: z.array(previousSection).nullable(),
});
