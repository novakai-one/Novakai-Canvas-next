import { z } from 'zod';
import { digest, version } from '../brands.js';
/** UI identities belong to the shipped token release, never a Templates preset. */
export const uiThemePin = z
  .strictObject({ id: z.string().regex(/^[a-z][a-z0-9-]*$/), version, digest })
  .readonly();
export const uiPreferences = z
  .strictObject({
    schemaVersion: z.literal(1),
    theme: z.discriminatedUnion('mode', [
      z.strictObject({ mode: z.literal('system') }),
      z.strictObject({ mode: z.literal('pinned'), theme: uiThemePin }),
    ]),
    textSize: z.number().int().min(12).max(20),
    density: z.enum(['compact', 'comfortable', 'spacious']),
    motion: z.enum(['system', 'reduced', 'full']),
  })
  .readonly();
export const environment = z
  .strictObject({
    scheme: z.enum(['light', 'dark']),
    pointer: z.enum(['fine', 'coarse']),
    reducedMotion: z.boolean(),
    forcedColors: z.boolean(),
  })
  .readonly();
export type UiThemePin = z.infer<typeof uiThemePin>;
export type UiPreferences = z.infer<typeof uiPreferences>;
export type Environment = z.infer<typeof environment>;
