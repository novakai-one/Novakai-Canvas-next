import type { Digest, LeaseId } from '../brands.js';
import type { Result } from '../errors.js';
/** Native crypto/process concerns are injected; uncertain liveness must conservatively return true. */
export interface IdentityPort {
  digest(base64: string): Result<Digest>;
  newLease(): LeaseId;
  readonly ownerPid: number;
  ownerAlive(pid: number): boolean;
}
