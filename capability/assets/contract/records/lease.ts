import { z } from 'zod';
import { digest, leaseId } from '../brands.js';
/** Conservative process ownership: no time-based expiry may delete an active lease. */
export const leaseRecord = z
  .strictObject({
    id: leaseId,
    ownerPid: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    digests: z.array(digest).readonly(),
  })
  .readonly();
export const digestList = z.array(digest).readonly();
export type LeaseRecord = z.infer<typeof leaseRecord>;
