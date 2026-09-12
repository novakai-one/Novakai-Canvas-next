import type { Result } from '../errors.js';
import type { Snapshot } from '../records/artifact.js';
import type { ExportRequest } from '../records/input.js';
/** Hosts bind a consistent revision and blob retention. Export releases once, including failure. */
export interface SnapshotLease {
  readonly snapshot: Snapshot;
  release(): Promise<Result<void>>;
}
export interface SnapshotReader {
  acquire(identity: ExportRequest['identity']): Promise<Result<SnapshotLease>>;
}
