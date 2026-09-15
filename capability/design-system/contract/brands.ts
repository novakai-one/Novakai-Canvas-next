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

/** Registry key resolved by Presentation; unknown names fall back to card, and new chromes need no enum edit. */
export const chromeName = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z][a-z0-9-]*$/)
  .brand<'ChromeName'>();
/** Canonical lowercase sRGB hex with optional alpha byte; used by resolved style transport. */
export const hexColor = z
  .string()
  .regex(/^#[0-9a-f]{6}([0-9a-f]{2})?$/)
  .brand<'HexColor'>();
/** Checked open chrome registry key; never a display label. */
export type ChromeName = z.infer<typeof chromeName>;
/** Checked canonical six- or eight-digit hexadecimal color. */
export type HexColor = z.infer<typeof hexColor>;

/** Theme-extensible semantic role vocabulary; new roles require no enum edit. */
export const roleName = z
  .string()
  .regex(/^[a-z][A-Za-z0-9]*$/)
  .brand<'RoleName'>();
/** Checked semantic role key shared by role paints and header tints. */
export type RoleName = z.infer<typeof roleName>;
