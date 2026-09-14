import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import type { Digest } from '../../contract/brands.js';
import { storedBlob } from '../../contract/records/media.js';
import type { StoredBlob } from '../../contract/records/media.js';
import type { AssetTransaction } from '../../contract/ports/storage.js';
import type { IdentityPort } from '../../contract/ports/identity.js';
import { parse, success } from '../validation/outcomes.js';
import { byteLength } from '../admission/validate.js';
/** Resolution verifies physical bytes; stale metadata never becomes a placeholder success. */
export function resolveBlob(
  storage: Pick<AssetTransaction, 'readBlob'>,
  digest: Digest,
  identity: Pick<IdentityPort, 'digest'>,
): Result<StoredBlob> {
  const raw = storage.readBlob(digest);
  if (raw === null)
    return fail('missing-asset', digest, 'Exact asset bytes are unavailable offline');
  const parsed = parse(storedBlob, raw, 'corrupt-asset');
  if (!parsed.ok) return parsed;
  return verifyStored(parsed.value, digest, identity);
}
/** Compare both descriptor identity and recomputed hash before returning detached data. */
function verifyStored(
  blob: StoredBlob,
  expected: Digest,
  identity: Pick<IdentityPort, 'digest'>,
): Result<StoredBlob> {
  const hashed = identity.digest(blob.base64);
  if (!hashed.ok) return hashed;
  if (hashed.value !== expected || blob.descriptor.digest !== expected)
    return fail('corrupt-asset', expected, 'Asset content identity mismatch');
  return verifyLength(blob);
}
/** Descriptor length is mechanically verified rather than trusting stored metadata. */
function verifyLength(blob: StoredBlob): Result<StoredBlob> {
  const actual = byteLength(blob.base64);
  if (actual !== blob.descriptor.byteLength)
    return fail('corrupt-asset', 'byteLength', 'Stored length differs from decoded bytes');
  return success(blob);
}
