import type { Digest } from '../brands.js';
import type { Result } from '../errors.js';
import type { Request } from '../records/request.js';
import type { Snapshot, Json, ReadVersion } from '../records/storage.js';
/** Protected exact bytes/pins; failed release leaves recoverable protection, never missing committed bytes. */
export interface ResourceLease {
  readonly pins: Json;
  readonly reads: readonly ReadVersion[];
  readonly covered: readonly Digest[];
  release(): Promise<Result<void>>;
}
/** Acquire current/history, submitted and resolved-preset resources before planning; no raw binding writes. */
export interface ResourceAdmission {
  acquire(request: Request, snapshot: Snapshot): Promise<Result<ResourceLease>>;
}
