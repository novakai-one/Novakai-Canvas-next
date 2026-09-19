import { snapshotSchema, receiptSchema, failure } from '@novakai/canvas-authoring';
import type {
  Result,
  Snapshot,
  Receipt,
  WorkspaceId,
  RequestId,
  CommitRequest,
  ErrorCode,
} from '@novakai/canvas-authoring';
import type { Result as StorageResult, StorageError } from '@novakai/canvas-persistence';
import type { AuthoringStore, ConditionalStorage } from '../contract/ports/store.js';
const storageCodes: Readonly<Record<StorageError['code'], ErrorCode>> = {
  'invalid-input': 'invalid-input',
  'unsupported-version': 'unsupported-version',
  'revision-conflict': 'revision-conflict',
  'request-reused': 'request-reused',
  'storage-unavailable': 'storage-unavailable',
  'corrupt-record': 'corrupt-record',
  'missing-resource': 'missing-asset',
  'destination-not-empty': 'revision-conflict',
};
/** Preserve distinguishable physical failures so Authoring chooses receipt reconciliation, never blind retry. */
function translate<T>(result: StorageResult<T>): Result<T> {
  if (result.ok) return result;
  const mapped = failure<never>(
    storageCodes[result.error.code],
    result.error.path,
    result.error.message,
    [],
    result.error,
  );
  return mapped;
}
/** Map physical storage without interpreting Authoring's shape; the consumer admits this raw snapshot. */
function rawSnapshot(storage: ConditionalStorage, workspace: WorkspaceId): Result<unknown> {
  const current = translate(storage.readSnapshot());
  if (!current.ok) return current;
  if (String(current.value.workspace) !== workspace)
    return failure(
      'permission-denied',
      'workspace',
      'Workspace does not belong to this service session',
    );
  return {
    ok: true,
    value: {
      workspace: current.value.workspace,
      sequence: current.value.sequence,
      records: current.value.slots,
    },
  };
}
/** Receipt and commit bridges retain their existing checked Authoring identities before physical operations. */
function snapshot(storage: ConditionalStorage, workspace: WorkspaceId): Result<Snapshot> {
  const current = rawSnapshot(storage, workspace);
  if (!current.ok) return current;
  return checkedSnapshot(current.value, workspace);
}
/** Expected workspace identity is checked separately from schema validity to prevent accidental cross-workspace bridges. */
function checkedSnapshot(input: unknown, workspace: WorkspaceId): Result<Snapshot> {
  const parsed = snapshotSchema.safeParse(input);
  if (!parsed.success)
    return failure('corrupt-record', 'snapshot', 'Stored workspace cannot be decoded');
  if (parsed.data.workspace !== workspace)
    return failure(
      'permission-denied',
      'workspace',
      'Workspace does not belong to this service session',
    );
  return { ok: true, value: parsed.data };
}
/** Successful physical receipts must also satisfy the Authoring outcome contract before reaching clients. */
function checkedReceipt(input: unknown): Result<Receipt> {
  const parsed = receiptSchema.safeParse(input);
  if (!parsed.success)
    return failure('corrupt-record', 'receipt', 'Stored receipt cannot be decoded');
  return { ok: true, value: parsed.data };
}
/** Null means no committed receipt; failures remain distinguishable from absence. */
function receipt(
  storage: ConditionalStorage,
  workspace: WorkspaceId,
  request: RequestId,
): Result<Receipt | null> {
  const current = snapshot(storage, workspace);
  if (!current.ok) return current;
  return foundReceipt(translate(storage.receipt(request)));
}
/** Receipt lookup retains the exact persisted transaction identity after a lost acknowledgement. */
function foundReceipt(result: Result<unknown>): Result<Receipt | null> {
  if (!result.ok) return result;
  if (result.value === null) return { ok: true, value: null };
  return checkedReceipt(result.value);
}
/** Conditional expected versions and receipt fingerprint cross unchanged into one physical transaction. */
function commit(storage: ConditionalStorage, request: CommitRequest): Result<Receipt> {
  const current = snapshot(storage, request.workspace);
  if (!current.ok) return current;
  const written = translate(storage.commit(request));
  if (!written.ok) return written;
  return checkedReceipt(written.value);
}
/** Trusted service composition alone binds this bridge; Authoring owns admission and uncertain-commit recovery. */
export function createAuthoringStore(storage: ConditionalStorage): AuthoringStore {
  return {
    snapshots: { read: async (workspace) => rawSnapshot(storage, workspace) },
    receipts: { find: async (workspace, request) => receipt(storage, workspace, request) },
    commits: { commit: async (request) => commit(storage, request) },
  };
}
