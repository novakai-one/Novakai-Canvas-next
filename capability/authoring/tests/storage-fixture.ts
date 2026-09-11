import { assert } from 'vitest';
import {
  openSqlite,
  type Persistence,
  type Result as StorageResult,
} from '@novakai/canvas-persistence';
import {
  snapshotSchema,
  receiptSchema,
  failure,
  type SnapshotReader,
  type ReceiptReader,
  type Committer,
  type Result,
  type ErrorCode,
} from '../contract/index.js';
/** Real in-memory SQLite is ephemeral per case; Vitest owns setup assertion failures. */
export function openStore(): Persistence {
  const result = openSqlite(':memory:', 'workspace');
  assert(result.ok, JSON.stringify(result));
  return result.value;
}
/** Foreign storage codes map explicitly at the host-style bridge, never by parsing error messages. */
function storageCode(code: string): ErrorCode {
  const map: Readonly<Record<string, ErrorCode>> = {
    'invalid-input': 'invalid-input',
    'unsupported-version': 'unsupported-version',
    'revision-conflict': 'revision-conflict',
    'request-reused': 'request-reused',
    'storage-unavailable': 'storage-unavailable',
    'corrupt-record': 'corrupt-record',
    'missing-resource': 'missing-asset',
    'destination-not-empty': 'invalid-input',
  };
  return map[code] ?? 'storage-unavailable';
}
/** A checked foreign failure remains a failure; test bridge never supplies success on read/commit errors. */
function convert<T, U>(result: StorageResult<T>, decode: (input: T) => U): Result<U> {
  if (!result.ok)
    return failure(storageCode(result.error.code), result.error.path, result.error.message);
  return { ok: true, value: decode(result.value) };
}
/** Checked public DTO schemas adapt nominal brands without unchecked casts or private imports. */
export function storageRoles(store: Pick<Persistence, 'readSnapshot' | 'receipt' | 'commit'>): {
  readonly snapshots: SnapshotReader;
  readonly receipts: ReceiptReader;
  readonly commits: Committer;
} {
  return {
    snapshots: {
      read: async () =>
        convert(store.readSnapshot(), (state) =>
          snapshotSchema.parse({
            workspace: state.workspace,
            sequence: state.sequence,
            records: state.slots,
          }),
        ),
    },
    receipts: {
      find: async (_workspace, request) =>
        convert(store.receipt(request), (receipt) =>
          receipt === null ? null : receiptSchema.parse(receipt),
        ),
    },
    commits: {
      commit: async (request) =>
        convert(store.commit(request), (receipt) => receiptSchema.parse(receipt)),
    },
  };
}
