/** Sole authoritative mutation facade; data contracts and role seams do not expose private policy helpers. */
export { createAuthoring } from './api.js';
export { composeAuthoring } from './compose.js';
export {
  workspaceId,
  recordId,
  requestId,
  actorId,
  plannerId,
  digest,
  timestamp,
} from './brands.js';
export type {
  WorkspaceId,
  RecordId,
  RequestId,
  ActorId,
  PlannerId,
  Digest,
  Timestamp,
} from './brands.js';
export { failure } from './errors.js';
export type { Diagnostic, ErrorCode, Result } from './errors.js';
export type { Authoring, Dependencies } from './types.js';
export type {
  Json,
  RecordKey,
  ReadVersion,
  StoredRecord,
  Snapshot,
  Write,
  Receipt,
  CommitOutcome,
} from './records/storage.js';
export type { Request, Intent, ApplyOptions } from './records/request.js';
export type { Preparation, Proposal, FeasibilityReport } from './records/proposal.js';
export type {
  Transaction,
  HistoryHead,
  HistoryStatus,
  HistoryAction,
  HistoryNavigation,
} from './records/history.js';
export { historyStatusSchema } from './records/history.js';
export type { SnapshotReader, ReceiptReader, Committer, CommitRequest } from './ports/store.js';
export type { IntentPlanner, CandidateValidator, Feasibility } from './ports/planning.js';
export type { ResourceAdmission, ResourceLease } from './ports/resources.js';
export type { Hasher, Clock, Cancellation, Notifications } from './ports/runtime.js';

/** Checked interchange schemas for host bridges; admission still revalidates every provider result. */
export { snapshotSchema, receiptSchema } from './records/storage.js';
export { requestSchema } from './records/request.js';
export { proposalSchema } from './records/proposal.js';
