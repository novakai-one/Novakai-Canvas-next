import { z } from 'zod';
/** Exact normalized content identity; metadata labels never act as a byte locator. */
export const digest = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .brand<'Digest'>();
export const leaseId = z.uuid().brand<'LeaseId'>();
export type Digest = z.infer<typeof digest>;
export type LeaseId = z.infer<typeof leaseId>;
