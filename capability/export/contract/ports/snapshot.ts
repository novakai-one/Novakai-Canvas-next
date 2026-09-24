import type { Result } from '../errors.js';
import type { Snapshot } from '../records/artifact.js';
import type { ExportRequest } from '../records/input.js';

/**
 * One retained revision: the snapshot stays consistent, and its blobs stay available, until
 * `release` is called. Export calls `release` exactly once for every lease it acquires, including
 * when encoding fails.
 */
export interface SnapshotLease {
  /** The retained revision's collection, scene, resources and paint. */
  readonly snapshot: Snapshot;

  /**
   * Ends the retention.
   *
   * @returns Success, or a failure that Export reports as `cleanup-failed` (attached to the
   * primary failure as `cleanup` when encoding also failed). A throw also becomes
   * `cleanup-failed`.
   */
  release(): Promise<Result<void>>;
}

/** Binds a requested revision to a consistent snapshot; supplied by the host. */
export interface SnapshotReader {
  /**
   * Acquires a lease on the requested revision. Export then checks that the snapshot matches the
   * request (`snapshot-mismatch` otherwise).
   *
   * @param identity - The requested collection ID and revision.
   * @returns The lease, or a failure (passed through unchanged). A throw becomes
   * `encoding-failed`.
   */
  acquire(identity: ExportRequest['identity']): Promise<Result<SnapshotLease>>;
}
