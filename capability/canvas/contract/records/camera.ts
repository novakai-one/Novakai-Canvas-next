import { z } from 'zod';
import { coordinate, dimension } from '../brands.js';
export const point = z.strictObject({ x: coordinate, y: coordinate }).readonly();
export const box = point.unwrap().extend({ width: dimension, height: dimension }).readonly();
export const viewport = z.strictObject({ width: dimension, height: dimension }).readonly();
export const camera = point
  .unwrap()
  .extend({ zoom: z.number().finite().min(0.1).max(4), viewport })
  .readonly();
export type Point = z.infer<typeof point>;
export type Box = z.infer<typeof box>;
export type Viewport = z.infer<typeof viewport>;
export type Camera = z.infer<typeof camera>;
