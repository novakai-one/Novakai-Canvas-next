import { z } from 'zod';
import { identity } from '../brands.js';
export const target = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('section'), id: identity }).readonly(),
  z.strictObject({ kind: z.literal('node'), section: identity, id: identity }).readonly(),
  z.strictObject({ kind: z.literal('wire'), section: identity, id: identity }).readonly(),
  z.strictObject({ kind: z.literal('sequence'), section: identity, id: identity }).readonly(),
]);
export type Target = z.infer<typeof target>;
export type NodeTarget = Extract<Target, { kind: 'node' }>;
export type WireTarget = Extract<Target, { kind: 'wire' }>;
export const selection = z.array(target).max(3000).readonly();
