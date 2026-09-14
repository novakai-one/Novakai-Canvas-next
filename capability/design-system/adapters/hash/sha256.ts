import { sha256 } from '@noble/hashes/sha2.js';
import { digest } from '../../contract/brands.js';
import type { Identity } from '../../contract/ports/identity.js';
import type { Result } from '../../contract/errors.js';
import type { Digest } from '../../contract/brands.js';
/** Actual portable SHA256, identical in browser/Node; caller owns retry after typed failure. */
export function createSha256(): Identity {
  return { hash };
}
/** Hash UTF8 bytes without global state; no filesystem, clock or platform crypto provider. */
function hash(canonical: string): Result<Digest> {
  try {
    const bytes = sha256(new TextEncoder().encode(canonical));
    const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const checked = digest.safeParse(value);
    if (!checked.success) return hashFailure();
    return { ok: true, value: checked.data };
  } catch {
    return hashFailure();
  }
}
/** Keep native diagnostics private; host retains the previous valid scope and retries explicitly. */
function hashFailure(): Result<never> {
  return {
    ok: false,
    error: {
      code: 'provider-failure',
      path: 'identity',
      targets: [],
      expected: 'SHA256 digest',
      message: 'Could not hash token data',
      recovery: 'Host retains prior scope; repair hash provider and retry.',
    },
  };
}
