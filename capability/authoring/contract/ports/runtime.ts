import type { Digest, Timestamp, RequestId, WorkspaceId } from '../brands.js';
import type { Result } from '../errors.js';
import type { Receipt } from '../records/storage.js';
/** Deterministic hash and timestamp roles are separately selectable by each consumer. */
export interface Hasher {
  digest(canonical: string): Result<Digest>;
}
export interface Clock {
  now(): Result<Timestamp>;
}
/** Before commit only; a stored receipt takes precedence over cancellation. */
export interface Cancellation {
  cancelled(request: RequestId): boolean;
}
/** Delivery is a postcommit hint; Authoring returns the successful receipt even if delivery fails. */
export interface Notifications {
  publish(workspace: WorkspaceId, receipt: Receipt): Promise<Result<void>>;
}
