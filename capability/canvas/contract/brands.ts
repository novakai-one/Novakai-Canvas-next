import { z } from 'zod';
/** Session identifiers are checked strings; semantic identity remains with Model. */
export const identity = z.string().min(1).max(500);
export const coordinate = z.number().finite().min(-1000000).max(1000000);
export const dimension = z.number().finite().positive().max(1000000);
export const generation = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
