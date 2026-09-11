import type { Result } from './errors.js';
import type { WorkspaceState, Receipt } from './records/storage.js';
import type { BackupBundle } from './records/backup.js';
import type { BackupResources, RestoreResources, ValidateDomain } from './ports/resources.js';
/** Persistence alone owns physical transactions; Authoring owns admission and retry reconciliation. */
export interface Persistence {
  readSnapshot(): Result<WorkspaceState>;
  commit(input: unknown): Result<Receipt>;
  receipt(request: unknown): Result<Receipt | null>;
  backup(resources: BackupResources): Promise<Result<BackupBundle>>;
  restore(
    input: unknown,
    resources: RestoreResources,
    validateDomain: ValidateDomain,
  ): Promise<Result<void>>;
  close(): Result<void>;
}
