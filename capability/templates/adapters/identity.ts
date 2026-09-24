import { createHash } from 'node:crypto';
import { digest } from '../contract/brands.js';
import type { Digest } from '../contract/brands.js';
import { fail } from '../contract/errors.js';
import type { Result } from '../contract/errors.js';
import type { IdentityPort } from '../contract/ports/identity.js';

/**
 * Creates the hashing provider. Pure computation: no storage, network or lifecycle.
 *
 * @param compute - Turns UTF-8 text into a hex digest; defaults to Node's SHA-256. Injectable for
 * tests.
 * @returns An {@link IdentityPort} whose `hash` checks the computed value is a lowercase 64-char
 * hex digest and returns `provider-failed` (path `digest`) when it is not or when `compute` throws.
 * @throws Never.
 */
export function createIdentity(compute: (value: string) => string = nativeHash): IdentityPort {
  return { hash: (value) => hash(value, compute) };
}

/** SHA-256 of the UTF-8 text as lowercase hex. No salt and no I/O. */
function nativeHash(value: string): string {
  const hash = createHash('sha256');
  hash.update(value, 'utf8');
  return hash.digest('hex');
}

/** Computes and checks one digest; any throw or bad output becomes `provider-failed`. */
function hash(value: string, compute: (value: string) => string): Result<Digest> {
  try {
    return { ok: true, value: digest.parse(compute(value)) };
  } catch {
    return fail('provider-failed', 'digest', 'Hash provider did not return a valid SHA256');
  }
}
