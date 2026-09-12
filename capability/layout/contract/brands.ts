import { z } from 'zod';
/** Local scene identities are distinct from canonical semantic IDs; checked before engine translation. */
export const identity = z.string().min(1).max(500);
export const coordinate = z.number().finite().min(-1000000).max(1000000);
export const dimension = z.number().finite().positive().max(1000000);
/** Accepted derivation keys are complete strings, never assumed secure hashes or mutation authority. */
export const inputKey = z
  .string()
  .min(1)
  .max(16 * 1024 * 1024)
  .brand<'LayoutInputKey'>();

/** Checked derivation identity; arbitrary strings cannot be used as admitted job or scene keys. */
export type LayoutInputKey = z.infer<typeof inputKey>;
