import type { Result } from '../../contract/errors.js';
import type { BackupResources, ResourceLease, VerifyBlob } from '../../contract/ports/resources.js';
import { backupBundle, blob } from '../../contract/records/backup.js';
import type { BackupBundle, BlobRecord } from '../../contract/records/backup.js';
import type { WorkspaceState } from '../../contract/records/storage.js';
import type { Digest } from '../../contract/brands.js';
import { boundedClone, parse, protect, protectAsync, success } from '../validation/outcomes.js';
import { reachableResources, verifyResources, withLease } from './resources.js';
/** Parse bounded encoded bytes before hashing; lease read failures retain their typed recovery. */
async function readBlob(lease: ResourceLease, digest: Digest): Promise<Result<BlobRecord>> {
  const bytes = await lease.read(digest);
  if (!bytes.ok) return bytes;
  return parse(blob, { digest, base64: bytes.value }, 'corrupt-record');
}
/** Collect every requested read result without abandoning other in-flight reads on first error. */
async function collectBlobs(
  lease: ResourceLease,
  digests: readonly Digest[],
): Promise<Result<readonly BlobRecord[]>> {
  const results = await Promise.all(
    digests.map((digest) => protectAsync(() => readBlob(lease, digest))),
  );
  const failed = results.find((result) => !result.ok);
  if (failed && !failed.ok) return failed;
  return success(results.flatMap((result) => (result.ok ? [result.value] : [])));
}
/** Complete bundle validation applies the larger backup limit, never a truncation. */
function packBackup(state: WorkspaceState, blobs: readonly BlobRecord[]): Result<BackupBundle> {
  return protect(
    () =>
      parse(
        backupBundle,
        boundedClone({ schemaVersion: 1, state, blobs }, 256 * 1024 * 1024),
        'corrupt-record',
      ),
    'corrupt-record',
  );
}
/** Verify all bytes before returning a success; caller releases the lease afterwards. */
async function verifyAndPack(
  state: WorkspaceState,
  blobs: readonly BlobRecord[],
  verify: VerifyBlob,
): Promise<Result<BackupBundle>> {
  const checked = await verifyResources(blobs, verify);
  if (!checked.ok) return checked;
  return packBackup(state, blobs);
}
/** Read immutable bytes for the earlier consistent document snapshot while GC is excluded. */
async function copyUnderLease(
  state: WorkspaceState,
  lease: ResourceLease,
  verify: VerifyBlob,
): Promise<Result<BackupBundle>> {
  const collected = await collectBlobs(lease, reachableResources(state));
  if (!collected.ok) return collected;
  return verifyAndPack(state, collected.value, verify);
}
/** A GC race before acquire returns a retryable failure, never an incomplete successful backup. */
export async function createBackup(
  state: WorkspaceState,
  resources: BackupResources,
): Promise<Result<BackupBundle>> {
  const acquired = await resources.acquire(reachableResources(state));
  if (!acquired.ok) return acquired;
  return withLease(acquired.value, () => copyUnderLease(state, acquired.value, resources.verify));
}
