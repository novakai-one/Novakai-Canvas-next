import { z } from 'zod';
/** Checked token paths map to collision-free CSS names; source correction belongs to Design System. */
export const tokenId = z
  .string()
  .regex(/^[a-z][A-Za-z0-9]*(\.[a-z0-9][A-Za-z0-9]*)*$/)
  .max(120)
  .brand<'TokenId'>();
/** Content identities are bare SHA256 bytes; Templates owns its distinct preset identity. */
export const digest = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .brand<'StyleDigest'>();
/** Explicit releases keep old pins independently reproducible. */
export const version = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/)
  .brand<'TokenVersion'>();
export type TokenId = z.infer<typeof tokenId>;
export type Digest = z.infer<typeof digest>;
export type Version = z.infer<typeof version>;
