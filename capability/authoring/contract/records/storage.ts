import { z } from 'zod';
import { workspaceId, recordId, requestId, digest } from '../brands.js';
import { diagnosticSchema } from '../errors.js';
import type { Digest, WorkspaceId, RequestId } from '../brands.js';
import type { Diagnostic } from '../errors.js';
/** JSON data only; boundary inspection rejects accessors, cycles, prototypes and nonfinite values. */
export type Json =
  null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };
export const jsonSchema = z.json();
export const revisionSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const keySchema = z.strictObject({
  kind: z.enum(['collection', 'catalog', 'asset-admission', 'preset', 'workspace', 'history']),
  id: recordId,
});
export const versionSchema = z.strictObject({
  key: keySchema,
  version: z.union([z.literal('absent'), revisionSchema]),
});
export const storedSchema = z.strictObject({
  key: keySchema,
  version: revisionSchema,
  value: jsonSchema,
  deleted: z.boolean(),
  resources: z.array(digest),
});
export const snapshotSchema = z.strictObject({
  workspace: workspaceId,
  sequence: revisionSchema,
  records: z.array(storedSchema),
});
export const writeSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('put'),
    key: keySchema,
    value: jsonSchema,
    resources: z.array(digest),
  }),
  z.strictObject({ kind: z.literal('delete'), key: keySchema }),
]);
export const outcomeSchema = z.strictObject({
  status: z.enum(['committed', 'no-op']),
  transaction: requestId.nullable(),
  pins: jsonSchema,
  diff: jsonSchema,
  warnings: z.array(diagnosticSchema),
});
export const receiptSchema = z.strictObject({
  request: requestId,
  fingerprint: digest,
  sequence: revisionSchema.min(1),
  versions: z.array(versionSchema),
  outcome: outcomeSchema,
});
export type RecordKey = {
  readonly kind: z.infer<typeof keySchema>['kind'];
  readonly id: z.infer<typeof keySchema>['id'];
};
export type ReadVersion = { readonly key: RecordKey; readonly version: number | 'absent' };
export interface StoredRecord {
  readonly key: RecordKey;
  readonly version: number;
  readonly value: Json;
  readonly deleted: boolean;
  readonly resources: readonly Digest[];
}
export interface Snapshot {
  readonly workspace: WorkspaceId;
  readonly sequence: number;
  readonly records: readonly StoredRecord[];
}
export type Write =
  | {
      readonly kind: 'put';
      readonly key: RecordKey;
      readonly value: Json;
      readonly resources: readonly Digest[];
    }
  | { readonly kind: 'delete'; readonly key: RecordKey };
export interface CommitOutcome {
  readonly status: 'committed' | 'no-op';
  readonly transaction: RequestId | null;
  readonly pins: Json;
  readonly diff: Json;
  readonly warnings: readonly Diagnostic[];
}
export interface Receipt {
  readonly request: RequestId;
  readonly fingerprint: Digest;
  readonly sequence: number;
  readonly versions: readonly ReadVersion[];
  readonly outcome: CommitOutcome;
}
