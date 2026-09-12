import { z } from 'zod';
import { version } from '../brands.js';
/** Closed source policy; all numeric defaults/bounds originate in the authored source. */
const bound = z.strictObject({
  min: z.number().finite(),
  max: z.number().finite(),
  diagramMin: z.number().finite(),
  diagramMax: z.number().finite(),
});
const density = z.strictObject({
  space: z.number().min(2).max(8),
  control: z.number().min(24).max(64),
});
export const sourcePolicy = z.strictObject({
  primary: z.array(z.string()).length(16),
  roles: z.array(z.string().regex(/^[a-z][A-Za-z0-9]*$/)).min(1),
  aliases: z.array(z.string().regex(/^[A-Za-z][A-Za-z0-9 -]*$/)).min(1),
  densities: z.strictObject({ compact: density, comfortable: density, spacious: density }),
  bounds: z.record(z.string(), bound),
  pairs: z.array(
    z.strictObject({
      id: z.string(),
      foreground: z.string(),
      background: z.string(),
      ratio: z.number().min(3).max(21),
    }),
  ),
});
export const sourceHeader = z.strictObject({
  schemaVersion: z.literal(1),
  definitionVersion: version,
  definitions: z.unknown(),
  semantics: z.unknown(),
  preferences: sourcePolicy,
  themes: z.array(z.unknown()).min(2).max(100),
});
export const themeHeader = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  version,
  baseVersion: version,
  overrides: z.record(z.string(), z.unknown()),
});
export const tokenType = z.enum(['color', 'dimension', 'duration', 'number', 'fontFamily']);
export const componentColor = z.strictObject({
  colorSpace: z.literal('srgb'),
  components: z.tuple([
    z.number().min(0).max(1),
    z.number().min(0).max(1),
    z.number().min(0).max(1),
  ]),
  alpha: z.number().min(0).max(1).default(1),
});
export const dimension = z.strictObject({ value: z.number().finite(), unit: z.literal('px') });
export const duration = z.strictObject({ value: z.number().finite(), unit: z.literal('ms') });
