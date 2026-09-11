import { createHash } from 'node:crypto';
import { digest } from '../contract/brands.js';
import type { Digest } from '../contract/brands.js';
import { fail } from '../contract/errors.js';
import type { Result } from '../contract/errors.js';
import type { IdentityPort } from '../contract/ports/identity.js';
/** Native hash has no environment salt or IO; deterministic UTF8 input is the complete identity source. */
function nativeHash(value: string): string {
  const hash = createHash('sha256');
  hash.update(value, 'utf8');
  return hash.digest('hex');
}
/** Validate even injected native output; caller can retry after repairing the provider. */
function hash(value: string, compute: (value: string) => string): Result<Digest> {
  try {
    return { ok: true, value: digest.parse(compute(value)) };
  } catch {
    return fail('provider-failed', 'digest', 'Hash provider did not return a valid SHA256');
  }
}
/** Injectable pure computation adapter; no storage/network lifecycle. */
export function createIdentity(compute: (value: string) => string = nativeHash): IdentityPort {
  return { hash: (value) => hash(value, compute) };
}
