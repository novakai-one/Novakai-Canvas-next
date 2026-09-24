import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import type { Digest, LeaseId } from '../../contract/brands.js';
import { leaseRecord } from '../../contract/records/lease.js';
import type { LeaseRecord } from '../../contract/records/lease.js';
import { base64 } from '../../contract/records/media.js';
import type { StoredBlob } from '../../contract/records/media.js';
import type { AssetTransaction, AssetStorage } from '../../contract/ports/storage.js';
import type { IdentityPort } from '../../contract/ports/identity.js';
import type { MediaRegistry } from '../../contract/ports/media.js';
import { parse, protectAsync, success } from '../validation/outcomes.js';
import { resolveBlob } from '../resolution/resolve.js';
import { prepareBlob, storeBlob } from '../admission/stage.js';

/**
 * Records a new lease on `digests` in the caller's transaction. A read lease (`existing`) first
 * verifies every digest's bytes; a reservation may name absent bytes. Only a verified acquire or a
 * staged restore lets Authoring commit a binding later.
 *
 * Steps, in order:
 * 1. when `existing`, verify each digest in order ({@link resolveBlob}); every digest is checked
 *    and the first failure is returned;
 * 2. build the lease from a new ID, the owner process ID and the digests, and check it with the
 *    `leaseRecord` schema (`invalid-input` at the issue's path);
 * 3. refuse an ID that is already stored (`storage-unavailable` at `lease`, "Lease identity
 *    collision"), so a faulty ID source cannot replace another caller's lease;
 * 4. write the lease.
 *
 * @param view - The transaction.
 * @param digests - The digests to protect (already deduplicated and sorted by the caller).
 * @param existing - Whether the bytes must already be stored and valid.
 * @param identity - Hasher, lease ID source and owner process ID.
 * @returns The stored lease, or the first failure.
 * @throws Whatever the storage calls, the hasher or the ID source throw.
 */
export function createLease(
  view: Pick<AssetTransaction, 'readBlob' | 'readLease' | 'writeLease'>,
  digests: readonly Digest[],
  existing: boolean,
  identity: Pick<IdentityPort, 'digest' | 'newLease' | 'ownerPid'>,
): Result<LeaseRecord> {
  const checked = existing ? verifyMembers(view, digests, identity) : success(undefined);
  if (!checked.ok) {
    return checked;
  }
  return recordLease(view, digests, identity);
}

/**
 * Checks, against the stored lease rather than a remembered copy, that lease `id` still covers
 * `digest`.
 *
 * @param view - The transaction.
 * @param id - The lease ID.
 * @param digest - The digest to check.
 * @returns Success, or `lease-expired` at `lease` when the lease is gone ("Lease has been
 * released or recovered"), `corrupt-asset` when the stored lease is malformed, or `lease-expired`
 * at `digest` when its ID differs or it does not list the digest.
 * @throws Whatever the storage read throws.
 */
export function requireMember(
  view: Pick<AssetTransaction, 'readLease'>,
  id: LeaseId,
  digest: Digest,
): Result<void> {
  const raw = view.readLease(id);
  if (raw === null) {
    return fail('lease-expired', 'lease', 'Lease has been released or recovered');
  }
  const parsed = parse(leaseRecord, raw, 'corrupt-asset');
  if (!parsed.ok) {
    return parsed;
  }
  return checkMembership(parsed.value, id, digest);
}

/**
 * Reads a leased blob: checks the lease covers the digest ({@link requireMember}), then reads and
 * verifies the bytes ({@link resolveBlob}).
 *
 * @param view - The transaction.
 * @param id - The lease ID.
 * @param digest - The digest to read.
 * @param identity - The hasher.
 * @returns The verified blob, or the first failure.
 * @throws Whatever the storage reads or the hasher throw.
 */
export function readLeased(
  view: Pick<AssetTransaction, 'readLease' | 'readBlob'>,
  id: LeaseId,
  digest: Digest,
  identity: Pick<IdentityPort, 'digest'>,
): Result<StoredBlob> {
  const member = requireMember(view, id, digest);
  if (!member.ok) {
    return member;
  }
  return resolveBlob(view, digest, identity);
}

/**
 * Checks backup bytes before any storage transaction, so a safe but different file can never
 * stand in for the pinned digest.
 *
 * Steps, in order:
 * 1. check the input with the `base64` schema (`invalid-input`);
 * 2. hash it; the hash must equal `digest` (`corrupt-asset` at `digest`, "Backup digest does not
 *    match supplied bytes");
 * 3. detect the media type from the bytes, never from the backup's claims;
 * 4. normalize the bytes as that type, with alt text "Restored media" and source
 *    `verified-backup` ({@link prepareBlob});
 * 5. the normalized digest must equal `digest` (`corrupt-asset` at `digest`, "Restored bytes are
 *    not the exact admitted normalized media").
 *
 * @param digest - The pinned digest.
 * @param input - The backup bytes, base64 encoded.
 * @param media - The media processors and detector.
 * @param identity - The hasher.
 * @returns The frozen blob to install, or the first failure (detection, processor and hasher
 * failures are returned unchanged).
 * @throws Never. Anything thrown becomes `unsafe-media` at `$`.
 */
export function prepareRestored(
  digest: Digest,
  input: unknown,
  media: MediaRegistry,
  identity: Pick<IdentityPort, 'digest'>,
): Promise<Result<StoredBlob>> {
  return protectAsync(async () => {
    const encoded = parse(base64, input);
    if (!encoded.ok) {
      return encoded;
    }
    return checkRestoredHash(digest, encoded.value, media, identity);
  }, 'unsafe-media');
}

/**
 * Installs backup bytes under a reservation. The bytes are checked first ({@link prepareRestored},
 * asynchronous, outside storage). Then one transaction re-checks the lease ({@link requireMember})
 * and stores the bytes ({@link storeBlob}), so bytes are never installed after the lease is
 * released. The stored bytes stay protected until Authoring commits the binding.
 *
 * @param storage - The storage to install into.
 * @param id - The reservation's lease ID.
 * @param digest - The pinned digest.
 * @param input - The backup bytes, base64 encoded.
 * @param media - The media processors and detector.
 * @param identity - The hasher.
 * @returns Success once stored, or the first failure.
 * @throws Whatever the storage throws (the real storage adapter returns failures instead).
 */
export async function stageReserved(
  storage: Pick<AssetStorage, 'transact'>,
  id: LeaseId,
  digest: Digest,
  input: unknown,
  media: MediaRegistry,
  identity: Pick<IdentityPort, 'digest'>,
): Promise<Result<void>> {
  const blob = await prepareRestored(digest, input, media, identity);
  if (!blob.ok) {
    return blob;
  }
  return storage.transact((view) => installReserved(view, id, blob.value, identity));
}

/** Verifies every digest's bytes and returns the first failure. Every digest is checked first. */
function verifyMembers(
  view: Pick<AssetTransaction, 'readBlob'>,
  digests: readonly Digest[],
  identity: Pick<IdentityPort, 'digest'>,
): Result<void> {
  const failure = digests
    .map((digest) => resolveBlob(view, digest, identity))
    .find((result) => !result.ok);
  if (failure && !failure.ok) {
    return failure;
  }
  return success(undefined);
}

/** Builds, checks and writes the lease, refusing an ID that is already stored. */
function recordLease(
  view: Pick<AssetTransaction, 'readLease' | 'writeLease'>,
  digests: readonly Digest[],
  identity: Pick<IdentityPort, 'newLease' | 'ownerPid'>,
): Result<LeaseRecord> {
  const parsed = parse(leaseRecord, {
    id: identity.newLease(),
    ownerPid: identity.ownerPid,
    digests,
  });
  if (!parsed.ok) {
    return parsed;
  }
  if (view.readLease(parsed.value.id) !== null) {
    return fail('storage-unavailable', 'lease', 'Lease identity collision');
  }
  view.writeLease(parsed.value);
  return success(parsed.value);
}

/** Requires the stored lease to have the expected ID and to list the digest. */
function checkMembership(lease: LeaseRecord, id: LeaseId, digest: Digest): Result<void> {
  if (lease.id !== id || !lease.digests.includes(digest)) {
    return fail('lease-expired', 'digest', 'Digest is not protected by this lease');
  }
  return success(undefined);
}

/** Hashes the backup bytes and requires the hash to equal the pinned digest before normalizing. */
async function checkRestoredHash(
  digest: Digest,
  encoded: string,
  media: MediaRegistry,
  identity: Pick<IdentityPort, 'digest'>,
): Promise<Result<StoredBlob>> {
  const hashed = identity.digest(encoded);
  if (!hashed.ok) {
    return hashed;
  }
  if (hashed.value !== digest) {
    return fail('corrupt-asset', 'digest', 'Backup digest does not match supplied bytes');
  }
  return normalizeRestored(digest, encoded, media, identity);
}

/** Detects the media type from the bytes, normalizes them, and compares the result with the digest. */
async function normalizeRestored(
  digest: Digest,
  encoded: string,
  media: MediaRegistry,
  identity: Pick<IdentityPort, 'digest'>,
): Promise<Result<StoredBlob>> {
  const detected = media.detect(encoded);
  if (!detected.ok) {
    return detected;
  }
  const blob = await prepareBlob(
    {
      base64: encoded,
      mediaType: detected.value,
      alt: 'Restored media',
      provenance: { source: 'verified-backup' },
    },
    media,
    identity,
  );
  if (!blob.ok) {
    return blob;
  }
  return compareRestored(blob.value, digest);
}

/** Requires the normalized bytes to be exactly the pinned ones. */
function compareRestored(blob: StoredBlob, expected: Digest): Result<StoredBlob> {
  if (blob.descriptor.digest !== expected) {
    return fail(
      'corrupt-asset',
      'digest',
      'Restored bytes are not the exact admitted normalized media',
    );
  }
  return success(blob);
}

/** Re-checks the lease and stores the bytes in the same transaction. */
function installReserved(
  view: Pick<AssetTransaction, 'readLease' | 'readBlob' | 'writeBlob'>,
  id: LeaseId,
  blob: StoredBlob,
  identity: Pick<IdentityPort, 'digest'>,
): Result<void> {
  const member = requireMember(view, id, blob.descriptor.digest);
  if (!member.ok) {
    return member;
  }
  return storeBlob(view, blob, identity);
}
