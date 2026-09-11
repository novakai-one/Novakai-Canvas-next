import { z } from 'zod';
/** Preset and instance aliases remain readable and bounded; kind supplies the record namespace. */
export const presetId = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z][A-Za-z0-9_-]*$/)
  .brand<'PresetId'>();
/** Exact media/preset content identity, never a filename or mutable URL. */
export const digest = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .brand<'PresetDigest'>();
/** Numeric release tuples exclude ambiguous leading zeros and unsafe integer components. */
export const version = z
  .string()
  .max(50)
  .regex(/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/)
  .refine((value) => value.split('.').every((part) => Number.isSafeInteger(Number(part))))
  .brand<'PresetVersion'>();
export type PresetId = z.infer<typeof presetId>;
export type Digest = z.infer<typeof digest>;
export type Version = z.infer<typeof version>;
