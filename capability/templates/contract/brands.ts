import { z } from 'zod';

/**
 * Checks a preset ID (also used as an expansion namespace): 1–80 characters, a letter then
 * letters, digits, `_` or `-`. The preset's `kind` keeps recipe and theme IDs apart.
 */
export const presetId = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z][A-Za-z0-9_-]*$/)
  .brand<'PresetId'>();

/**
 * Checks a SHA-256 content digest: 64 lowercase hex characters. It identifies exact media or
 * preset content, never a file name or a URL that could change.
 */
export const digest = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .brand<'PresetDigest'>();

/**
 * Checks a release version `major.minor.patch`: at most 50 characters, numbers without leading
 * zeros, and each part a safe integer.
 */
export const version = z
  .string()
  .max(50)
  .regex(/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/)
  .refine((value) => value.split('.').every((part) => Number.isSafeInteger(Number(part))))
  .brand<'PresetVersion'>();

/** A preset ID that passed {@link presetId}. */
export type PresetId = z.infer<typeof presetId>;

/** A digest that passed {@link digest}. */
export type Digest = z.infer<typeof digest>;

/** A version that passed {@link version}. */
export type Version = z.infer<typeof version>;
