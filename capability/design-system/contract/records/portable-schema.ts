import { z } from 'zod';
import { chromeName, digest } from '../brands.js';
import { presetPin } from './theme.js';
/** Existing consumer vocabulary is decoded at this capability's own boundary. */
const portableToken = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('color'),
    value: z.string().regex(/^#[a-f0-9]{6}([a-f0-9]{2})?$/),
  }),
  z.strictObject({
    type: z.literal('dimension'),
    value: z.number().finite(),
    unit: z.enum(['px', 'world', 'ms', 'scalar']),
  }),
  z.strictObject({
    type: z.literal('font'),
    family: z.string().regex(/^[A-Za-z][A-Za-z0-9 -]{0,127}$/),
    digest,
  }),
]);
export const portableTheme = z.strictObject({
  chrome: chromeName.optional(),
  tokens: z.record(z.string(), portableToken),
  roles: z
    .array(z.string().regex(/^[a-z][A-Za-z0-9]*$/))
    .min(1)
    .max(100),
  fonts: z.array(digest).max(100),
  base: presetPin.nullable(),
});
