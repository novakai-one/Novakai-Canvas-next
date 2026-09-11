import type { Digest, LeaseId } from '../brands.js';
import type { Result } from '../errors.js';
import type { StoredBlob } from '../records/media.js';
import type { LeaseRecord } from '../records/lease.js';
/** Raw IO inside a synchronous maintenance transaction; adapter owns exception-to-Result recovery. */
export interface AssetTransaction {
  readBlob(digest: Digest): unknown | null;
  writeBlob(blob: StoredBlob): void;
  listBlobs(): readonly Digest[];
  deleteBlob(digest: Digest): void;
  readLease(id: LeaseId): unknown | null;
  writeLease(lease: LeaseRecord): void;
  listLeases(): readonly unknown[];
  deleteLease(id: LeaseId): void;
}
/** Metadata/lease changes commit only on successful callback; files remain immutable across rollback. */
export interface AssetStorage {
  transact<T>(action: (transaction: AssetTransaction) => Result<T>): Result<T>;
  close(): Result<void>;
}
