import { z } from 'zod';
import { digest, requestId, workspaceId } from '../brands.js';
import { jsonValue, readVersion, recordKey } from './storage.js';
import type { Json, RecordKey, ReadVersion } from './storage.js';
import type { Digest, WorkspaceId, RequestId } from '../brands.js';
/** Authoring computes semantic payloads/history and the submitted-envelope fingerprint. */
export const write = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('put'),
    key: recordKey,
    value: jsonValue,
    resources: z.array(digest),
  }),
  z.strictObject({ kind: z.literal('delete'), key: recordKey }),
]);
export const commitRequest = z.strictObject({
  workspace: workspaceId,
  request: requestId,
  fingerprint: digest,
  expected: z.array(readVersion),
  writes: z.array(write),
  outcome: jsonValue,
});
export type Write =
  | {
      readonly kind: 'put';
      readonly key: RecordKey;
      readonly value: Json;
      readonly resources: readonly Digest[];
    }
  | { readonly kind: 'delete'; readonly key: RecordKey };
export interface CommitRequest {
  readonly workspace: WorkspaceId;
  readonly request: RequestId;
  readonly fingerprint: Digest;
  readonly expected: readonly ReadVersion[];
  readonly writes: readonly Write[];
  readonly outcome: Json;
}
