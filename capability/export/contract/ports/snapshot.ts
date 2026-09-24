import type { Result } from '../errors.js';
import type { Snapshot } from '../records/artifact.js';
import type { ExportRequest } from '../records/input.js';

/**
 * One retained revision: the snapshot stays consistent, and its blobs stay available, until
 * `release` is called. Export calls `release` exactly once for every lease it acquires, including
 * when the export fails (mismatch, scope, limits, cancellation or encoding). The host reclaims a
 * lease that is never released, for example after a crash.
 */
export interface SnapshotLease {
  /** The retained revision's identity, collection, scene, resources and paint. */
  readonly snapshot: Snapshot;

  /**
   * Ends the retention.
   *
   * @returns Success, or a failure. A returned failure is passed through unchanged: it replaces
   * a successful artifact, or is attached as `cleanup` to the export's own failure. Only a throw
   * becomes `cleanup-failed` (handled the same way).
   */
  release(): Promise<Result<void>>;
}

/** Binds a requested revision to a consistent snapshot; supplied by the host. */
export interface SnapshotReader {
  /**
   * Acquires a lease on the requested revision. Export then checks that the snapshot's
   * `identity`, `collection` and `scene` all carry the requested collection ID and revision, and
   * that `scene.inputKey` equals `identity.inputKey` (`snapshot-mismatch` otherwise).
   *
   * @param identity - The requested collection ID and revision.
   * @returns The lease, or a failure (passed through unchanged). A throw becomes
   * `encoding-failed`.
   */
  acquire(identity: ExportRequest['identity']): Promise<Result<SnapshotLease>>;
}
