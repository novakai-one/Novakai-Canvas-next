import type { Result } from './errors.js';
import type { Snapshot, Receipt } from './records/storage.js';
import type { Preparation } from './records/proposal.js';
import type { HistoryStatus } from './records/history.js';
import type { SnapshotReader, ReceiptReader, Committer } from './ports/store.js';
import type { IntentPlanner, CandidateValidator, Feasibility } from './ports/planning.js';
import type { ResourceAdmission } from './ports/resources.js';
import type { Hasher, Clock, Cancellation, Notifications } from './ports/runtime.js';

/**
 * The Authoring facade: the only way to change a workspace.
 *
 * Every method takes untrusted input, never throws, and returns a deeply frozen `Result`.
 * Consumers that only read never receive commit authority through a storage object.
 */
export interface Authoring {
  /** Returns the workspace's undo/redo status. */
  history(workspace: unknown): Promise<Result<HistoryStatus>>;
  /** Adds history to a workspace that has none, or checks and trims existing history. */
  initializeHistory(workspace: unknown): Promise<Result<HistoryStatus>>;
  /** Reads one checked, consistent workspace snapshot. */
  read(workspace: unknown): Promise<Result<Snapshot>>;
  /** Looks up a request's checked receipt, or `null` when it has not committed. */
  receipt(workspace: unknown, request: unknown): Promise<Result<Receipt | null>>;
  /**
   * Prepares a request without committing it. Returns the original receipt instead when the
   * request already committed. `preview` asks the feasibility check for a preview.
   */
  prepare(request: unknown, preview?: boolean): Promise<Result<Preparation | Receipt>>;
  /** Commits a request of any intent kind. */
  apply(request: unknown, options?: unknown): Promise<Result<Receipt>>;
  /** Commits an undo request. */
  undo(request: unknown, options?: unknown): Promise<Result<Receipt>>;
  /** Commits a redo request. */
  redo(request: unknown, options?: unknown): Promise<Result<Receipt>>;
}

/** The collaborators needed to plan and check a candidate. */
export interface PlanningDependencies {
  readonly planners: readonly IntentPlanner[];
  readonly validation: CandidateValidator;
  readonly feasibility: Feasibility;
  readonly hash: Hasher;
  readonly cancellation: Cancellation;
}

/** The collaborators needed to admit a request: planning, plus storage reads and resource leases. */
export interface AdmissionDependencies extends PlanningDependencies {
  readonly snapshots: SnapshotReader;
  readonly receipts: ReceiptReader;
  readonly resources: ResourceAdmission;
}

/** Every collaborator Authoring needs: admission, plus committing, time and notifications. */
export interface Dependencies extends AdmissionDependencies {
  readonly commits: Committer;
  readonly clock: Clock;
  readonly notifications: Notifications;
}
