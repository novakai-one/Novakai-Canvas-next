import { z } from 'zod';
import { digest, recordId, requestId, workspaceId } from '../brands.js';
import type { Digest, RecordId, RequestId, WorkspaceId } from '../brands.js';
/** Structural storage schemas only; Model/Library validation belongs to Authoring admission. */
export const jsonValue = z.json();
export type Json =
  null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };
export const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const recordKey = z.strictObject({
  kind: z.enum(['catalog', 'collection', 'asset-admission', 'preset', 'history', 'workspace']),
  id: recordId,
});
export const readVersion = z.strictObject({
  key: recordKey,
  version: z.union([z.literal('absent'), revision]),
});
export const slot = z.strictObject({
  key: recordKey,
  version: revision,
  value: jsonValue,
  deleted: z.boolean(),
  resources: z.array(digest),
});
export const receipt = z.strictObject({
  request: requestId,
  fingerprint: digest,
  sequence: revision.min(1),
  versions: z.array(readVersion),
  outcome: jsonValue,
});
export const workspaceState = z.strictObject({
  schemaVersion: z.literal(1),
  workspace: workspaceId,
  sequence: revision,
  slots: z.array(slot),
  receipts: z.array(receipt),
});
export const versionHeader = z.object({ schemaVersion: z.number() });
/** Internal structural schema: payloads must be exact values from this read's detached JSON admission. */
export function admittedWorkspaceState(payloads: readonly Json[]) {
  const admitted = new Set<unknown>(payloads);
  const payload = z.custom<Json>((value) => admitted.has(value));
  return workspaceState.extend({
    slots: z.array(slot.extend({ value: payload })),
    receipts: z.array(receipt.extend({ outcome: payload })),
  });
}

/** Composite storage identity, independent of any diagram-specific record type. */
export interface RecordKey {
  readonly kind: z.infer<typeof recordKey>['kind'];
  readonly id: RecordId;
}
export interface ReadVersion {
  readonly key: RecordKey;
  readonly version: number | 'absent';
}
export interface Slot {
  readonly key: RecordKey;
  readonly version: number;
  readonly value: Json;
  readonly deleted: boolean;
  readonly resources: readonly Digest[];
}
export interface Receipt {
  readonly request: RequestId;
  readonly fingerprint: Digest;
  readonly sequence: number;
  readonly versions: readonly ReadVersion[];
  readonly outcome: Json;
}
export interface WorkspaceState {
  readonly schemaVersion: 1;
  readonly workspace: WorkspaceId;
  readonly sequence: number;
  readonly slots: readonly Slot[];
  readonly receipts: readonly Receipt[];
}
