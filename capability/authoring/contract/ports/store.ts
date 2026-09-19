import type { WorkspaceId, RequestId, Digest } from '../brands.js';
import type { Result } from '../errors.js';
import type { Receipt, Write, ReadVersion, CommitOutcome } from '../records/storage.js';
/** One consistent raw snapshot; Authoring alone admits its shape, identities and invariants. */
export interface SnapshotReader {
  read(workspace: WorkspaceId): Promise<Result<unknown>>;
}
/** Successful receipts survive source-file deletion and alias changes. */
export interface ReceiptReader {
  find(workspace: WorkspaceId, request: RequestId): Promise<Result<Receipt | null>>;
}
export interface CommitRequest {
  readonly workspace: WorkspaceId;
  readonly request: RequestId;
  readonly fingerprint: Digest;
  readonly expected: readonly ReadVersion[];
  readonly writes: readonly Write[];
  readonly outcome: CommitOutcome;
}
/**
 * Conditional compare/write/receipt is one transaction. Promise settlement or throw means physical
 * transaction is terminal; never detach a remote write after timeout. Local service bridges synchronous
 * Persistence. Authoring reconciles uncertain acknowledgement while resource leases remain held.
 */
export interface Committer {
  commit(request: CommitRequest): Promise<Result<Receipt>>;
}
