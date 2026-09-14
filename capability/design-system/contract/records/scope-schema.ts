import { z } from 'zod';
import { digest, version, tokenId } from '../brands.js';
import { fontPin, presetPin } from './theme.js';
import { uiThemePin } from './preferences.js';
const numeric = z.number().finite();
const tokenValue = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('color'),
    value: z.string().regex(/^#[a-f0-9]{6}([a-f0-9]{2})?$/),
  }),
  z.strictObject({ type: z.literal('dimension'), value: numeric, unit: z.literal('px') }),
  z.strictObject({ type: z.literal('duration'), value: numeric, unit: z.literal('ms') }),
  z.strictObject({ type: z.literal('number'), value: numeric }),
  z.strictObject({
    type: z.literal('fontFamily'),
    value: z.array(z.string().regex(/^[A-Za-z][A-Za-z0-9 -]{0,127}$/)).min(1),
  }),
]);
/** Resolved output crosses the DOM boundary only as a complete safe vocabulary and CSS-equivalent snapshot. */
export const resolvedScope = z.strictObject({
  chrome: z.string().min(1).max(120).optional(),
  definitionVersion: version,
  inputDigest: digest,
  digest,
  scope: z.enum(['ui', 'diagram', 'export']),
  values: z.record(tokenId, tokenValue),
  css: z.record(z.string().regex(/^--nv-[a-z0-9-]+$/), z.string()),
  dependencies: z.record(tokenId, z.array(tokenId)),
  primary: z.array(tokenId).length(16),
  contrast: z.array(
    z.strictObject({
      id: z.string(),
      foreground: z.string(),
      background: z.string(),
      ratio: numeric,
      required: numeric,
    }),
  ),
  fonts: z.array(fontPin),
  roles: z.array(z.string()),
  provenance: z.strictObject({ ui: uiThemePin.nullable(), diagram: presetPin.nullable() }),
  forcedColors: z.boolean(),
});
