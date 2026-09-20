import type { Result } from './errors.js';
import type { Snapshot, Receipt } from './records/storage.js';
import type { Preparation } from './records/proposal.js';
import type { SnapshotReader, ReceiptReader, Committer } from './ports/store.js';
import type { IntentPlanner, CandidateValidator, Feasibility } from './ports/planning.js';
import type { ResourceAdmission } from './ports/resources.js';
import type { Hasher, Clock, Cancellation, Notifications } from './ports/runtime.js';
/** Read-only interface consumers never receive commit authority through a storage object. */
export interface Authoring {
  history(workspace: unknown): Promise<Result<import('./records/history.js').HistoryStatus>>;
  initializeHistory(
    workspace: unknown,
  ): Promise<Result<import('./records/history.js').HistoryStatus>>;
  read(workspace: unknown): Promise<Result<Snapshot>>;
  receipt(workspace: unknown, request: unknown): Promise<Result<Receipt | null>>;
  prepare(request: unknown, preview?: boolean): Promise<Result<Preparation | Receipt>>;
  apply(request: unknown, options?: unknown): Promise<Result<Receipt>>;
  undo(request: unknown, options?: unknown): Promise<Result<Receipt>>;
  redo(request: unknown, options?: unknown): Promise<Result<Receipt>>;
}
export interface PlanningDependencies {
  readonly planners: readonly IntentPlanner[];
  readonly validation: CandidateValidator;
  readonly feasibility: Feasibility;
  readonly hash: Hasher;
  readonly cancellation: Cancellation;
}
export interface AdmissionDependencies extends PlanningDependencies {
  readonly snapshots: SnapshotReader;
  readonly receipts: ReceiptReader;
  readonly resources: ResourceAdmission;
}
export interface Dependencies extends AdmissionDependencies {
  readonly commits: Committer;
  readonly clock: Clock;
  readonly notifications: Notifications;
}
