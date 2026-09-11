import { z } from 'zod';
import { requestId, actorId, timestamp } from '../brands.js';
import { keySchema, storedSchema, versionSchema } from './storage.js';
/** Before/after snapshots retain resources even when current content is deleted. */
export const transitionSchema = z.strictObject({
  key: keySchema,
  before: storedSchema.nullable(),
  after: storedSchema,
});
export const transactionSchema = z.strictObject({
  kind: z.literal('transaction'),
  id: requestId,
  actor: z.strictObject({ id: actorId, kind: z.enum(['human', 'agent']) }),
  timestamp,
  mode: z.enum(['change', 'undo', 'redo']),
  target: requestId.nullable(),
  transitions: z.array(transitionSchema).min(1),
});
export const headSchema = z.strictObject({
  kind: z.literal('head'),
  original: requestId,
  state: z.enum(['active', 'undone']),
  participants: z.array(versionSchema).min(1),
  last: requestId,
});
export type Transaction = z.infer<typeof transactionSchema>;
export type HistoryHead = z.infer<typeof headSchema>;
