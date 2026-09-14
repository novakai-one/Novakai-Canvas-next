import { z } from 'zod';
/** Host selection envelope maps a preset base to authoritative payload; Design System still owns token/delta validation. */
const pin = z.strictObject({
  kind: z.literal('theme'),
  id: z.string(),
  version: z.string(),
  digest: z.string(),
});
export const themeInput = z.strictObject({
  chrome: z.string().min(1).max(120).optional(),
  base: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('ui'), pin: z.unknown() }),
    z.strictObject({ kind: z.literal('preset'), pin, payload: z.unknown().optional() }),
  ]),
  fonts: z.unknown(),
  overrides: z.unknown(),
});
export type ThemeInput = z.infer<typeof themeInput>;
