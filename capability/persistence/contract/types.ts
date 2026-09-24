import type { Result } from './errors.js';
import type { WorkspaceState, Receipt } from './records/storage.js';
import type { BackupBundle } from './records/backup.js';
import type { BackupResources, RestoreResources, ValidateDomain } from './ports/resources.js';

/**
 * The Persistence service for one workspace, created by `openSqlite` or `createPersistence`.
 *
 * Persistence alone runs physical transactions. Authoring owns admission (what a change may
 * contain) and receipt reconciliation after an uncertain commit. Every method returns a typed
 * result and never throws; returned data is detached and frozen.
 */
export interface Persistence {
  /** Reads one consistent, validated workspace state. */
  readSnapshot(): Result<WorkspaceState>;
  /**
   * Checks and commits one request atomically. A retry of a committed request (same ID and
   * fingerprint) returns the original receipt; the same ID with a different fingerprint is
   * `request-reused`.
   */
  commit(input: unknown): Result<Receipt>;
  /** Looks up the kept receipt for a request ID; `null` when there is none. */
  receipt(request: unknown): Result<Receipt | null>;
  /** Copies one consistent state and the asset bytes it references into a verified bundle. */
  backup(resources: BackupResources): Promise<Result<BackupBundle>>;
  /**
   * Checks a bundle, validates its documents with `validateDomain`, stages its assets and
   * installs it into this location, which must never have been committed to. The host decides
   * when to switch to the restored location.
   */
  restore(
    input: unknown,
    resources: RestoreResources,
    validateDomain: ValidateDomain,
  ): Promise<Result<void>>;
  /** Closes the database; later calls fail with `storage-unavailable`. */
  close(): Result<void>;
}
