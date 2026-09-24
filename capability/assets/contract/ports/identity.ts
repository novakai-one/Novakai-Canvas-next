import type { Digest, LeaseId } from '../brands.js';
import type { Result } from '../errors.js';

/**
 * Hashing, lease IDs and process ownership, injected so Assets never touches crypto or processes
 * directly. The built-in adapter is adapters/identity.ts.
 */
export interface IdentityPort {
  /**
   * Hashes base64-encoded bytes.
   *
   * @param base64 - The bytes, base64 encoded.
   * @returns The SHA-256 digest of the decoded bytes, or a failure (the built-in adapter returns
   * `invalid-input` for base64 that is invalid or not in canonical form).
   */
  digest(base64: string): Result<Digest>;
  /**
   * Creates a new lease ID. It may throw; the calling facade method reports that as
   * `storage-unavailable`.
   */
  newLease(): LeaseId;
  /** The process ID recorded as the owner of new leases. */
  readonly ownerPid: number;
  /**
   * Tells whether a lease owner's process may still be running. When unsure (for example on a
   * permission error), it must return `true` so the lease is kept.
   *
   * @param pid - The owner's process ID.
   * @returns `false` only when the process is known to be gone.
   */
  ownerAlive(pid: number): boolean;
}
