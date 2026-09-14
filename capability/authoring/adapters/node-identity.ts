import { createHash } from 'node:crypto';
import { digest, timestamp } from '../contract/brands.js';
import type { Digest, Timestamp } from '../contract/brands.js';
import type { Hasher, Clock } from '../contract/ports/runtime.js';
import type { Result } from '../contract/errors.js';
import { failure } from '../contract/errors.js';
/** Native SHA256 has no domain knowledge; Authoring owns envelope canonicalization and retry recovery. */
function nativeHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
/** Native operations are injectable for contract failures; constructing roles performs no clock/hash work. */
export function createNodeIdentity(
  hash: (text: string) => string = nativeHash,
  now: () => number = Date.now,
): { readonly hash: Hasher; readonly clock: Clock } {
  /** Invalid native hash output fails closed; Authoring retains request identity for safe retry. */
  function hashText(text: string): Result<Digest> {
    try {
      const result = digest.safeParse(hash(text));
      if (!result.success)
        return failure('storage-unavailable', 'digest', 'Hash provider returned an invalid digest');
      return { ok: true, value: result.data };
    } catch {
      return failure('storage-unavailable', 'digest', 'Hash provider failed');
    }
  }
  /** Timestamp failures occur before commit; Authoring owns retry without partially allocated history. */
  function currentTime(): Result<Timestamp> {
    try {
      const result = timestamp.safeParse(now());
      if (!result.success)
        return failure('storage-unavailable', 'timestamp', 'Clock returned an invalid timestamp');
      return { ok: true, value: result.data };
    } catch {
      return failure('storage-unavailable', 'timestamp', 'Clock provider failed');
    }
  }
  return { hash: { digest: hashText }, clock: { now: currentTime } };
}
