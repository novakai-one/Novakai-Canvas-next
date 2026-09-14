import { createHash, randomUUID } from 'node:crypto';
import { digest, leaseId } from '../contract/brands.js';
import type { Digest, LeaseId } from '../contract/brands.js';
import { fail } from '../contract/errors.js';
import type { Result } from '../contract/errors.js';
import type { IdentityPort } from '../contract/ports/identity.js';
import { base64 as base64Schema } from '../contract/records/media.js';
/** Native computation slots allow exact hash/UUID/liveness failure tests without global mocking. */
interface NativeIdentity {
  hash(bytes: Uint8Array): string;
  uuid(): string;
  pid: number;
  signal(pid: number): void;
}
const native: NativeIdentity = {
  hash: (bytes) => {
    const hash = createHash('sha256');
    hash.update(bytes);
    return hash.digest('hex');
  },
  uuid: randomUUID,
  pid: process.pid,
  signal: (pid) => process.kill(pid, 0),
};
/** Canonical base64 prevents multiple spellings and silently ignored junk from changing request identity. */
function hashBytes(encoded: string, identity: Pick<NativeIdentity, 'hash'>): Result<Digest> {
  try {
    return hashChecked(encoded, identity);
  } catch {
    return fail('invalid-input', 'base64', 'Canonical asset bytes could not be hashed');
  }
}
/** Validate encoded alphabet, decoded round-trip and resulting checked SHA256 brand. */
function hashChecked(encoded: string, identity: Pick<NativeIdentity, 'hash'>): Result<Digest> {
  const parsed = base64Schema.safeParse(encoded);
  if (!parsed.success) return fail('invalid-input', 'base64', 'Invalid base64 encoding');
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.toString('base64') !== encoded)
    return fail('invalid-input', 'base64', 'Noncanonical base64 encoding');
  return { ok: true, value: digest.parse(identity.hash(bytes)) };
}
/** Only ESRCH proves a process is dead; permission errors and unknown failures retain protection. */
function ownerAlive(pid: number, identity: Pick<NativeIdentity, 'signal'>): boolean {
  try {
    identity.signal(pid);
    return true;
  } catch (error) {
    return !isMissingProcess(error);
  }
}
/** Native error codes are structured evidence, never parsed from localized messages. */
function isMissingProcess(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return 'code' in error && error.code === 'ESRCH';
}
/** Identity-source schema failures are consumed by Assets' protected lease-creation boundary. */
function newLease(identity: Pick<NativeIdentity, 'uuid'>): LeaseId {
  return leaseId.parse(identity.uuid());
}
/** Crypto/process detail adapter; Assets owns conservative lease recovery, Authoring owns request retries. */
export function createIdentity(identity: NativeIdentity = native): IdentityPort {
  return {
    digest: (encoded) => hashBytes(encoded, identity),
    newLease: () => newLease(identity),
    ownerPid: identity.pid,
    ownerAlive: (pid) => ownerAlive(pid, identity),
  };
}
