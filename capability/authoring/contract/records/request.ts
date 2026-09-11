import { z } from 'zod';
import { workspaceId, requestId, actorId, plannerId, digest } from '../brands.js';
import type { WorkspaceId, RequestId, ActorId, PlannerId, Digest } from '../brands.js';
import type { Json, ReadVersion, RecordKey } from './storage.js';
import { keySchema, versionSchema, jsonSchema } from './storage.js';
/** Language and human adapters submit the same versioned, immutable semantic envelope. */
export const intentSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('change'), planner: plannerId, payload: jsonSchema }),
  z.strictObject({ kind: z.literal('undo'), transaction: requestId }),
  z.strictObject({ kind: z.literal('redo'), transaction: requestId }),
]);
export const requestSchema = z.strictObject({
  workspace: workspaceId,
  request: requestId,
  actor: z.strictObject({ id: actorId, kind: z.enum(['human', 'agent']) }),
  version: z.literal(1),
  expected: z.array(versionSchema).max(10000),
  scope: z.array(keySchema).max(1000),
  assets: z.array(z.strictObject({ alias: z.string().min(1).max(128), digest })).max(10000),
  intent: intentSchema,
});
export const applyOptionsSchema = z.strictObject({ candidateHash: digest.optional() });
/** Readonly submitted intent remains comprehensible without depending on schema-inferred return shapes. */
export type Intent =
  | { readonly kind: 'change'; readonly planner: PlannerId; readonly payload: Json }
  | { readonly kind: 'undo' | 'redo'; readonly transaction: RequestId };
export type Request = {
  readonly workspace: WorkspaceId;
  readonly request: RequestId;
  readonly actor: { readonly id: ActorId; readonly kind: 'human' | 'agent' };
  readonly version: 1;
  readonly expected: readonly ReadVersion[];
  readonly scope: readonly RecordKey[];
  readonly assets: readonly { readonly alias: string; readonly digest: Digest }[];
  readonly intent: Intent;
};
export type ApplyOptions = { readonly candidateHash?: Digest };
