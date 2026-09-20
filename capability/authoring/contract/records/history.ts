import { z } from 'zod';
import { requestId, actorId, timestamp, workspaceId } from '../brands.js';
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
  label: z.string().optional(),
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

/** Durable navigation is independent of immutable transaction evidence. */
export const navigationSchema = z.strictObject({
  schemaVersion: z.literal(1),
  baselineSequence: z.number().int().nonnegative(),
  actions: z.array(requestId),
  cursor: z.number().int().nonnegative(),
  frontier: z.array(versionSchema),
});
export const historyActionSchema = z.strictObject({
  transaction: requestId,
  label: z.string(),
  actor: transactionSchema.shape.actor,
  collections: z.array(z.string()),
  scope: z.array(keySchema),
  expected: z.array(versionSchema),
});
export const historyStatusSchema = z.strictObject({
  workspace: workspaceId,
  navigationVersion: versionSchema,
  undo: historyActionSchema.nullable(),
  redo: historyActionSchema.nullable(),
});
export type HistoryNavigation = z.infer<typeof navigationSchema>;
export type HistoryAction = z.infer<typeof historyActionSchema>;
export type HistoryStatus = z.infer<typeof historyStatusSchema>;
