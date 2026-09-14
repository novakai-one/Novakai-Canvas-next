import { z } from 'zod';
/** Transfer identifiers preserve collection-local scope; they never allocate domain identities. */
export const identity = z.string().min(1).max(120);
export const digest = z.string().regex(/^[a-f0-9]{64}$/);
