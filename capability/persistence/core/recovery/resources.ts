import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import type { Digest } from '../../contract/brands.js';
import type { BlobRecord } from '../../contract/records/backup.js';
import type { WorkspaceState } from '../../contract/records/storage.js';
import type { VerifyBlob } from '../../contract/ports/resources.js';
import { protectAsync, success } from '../validation/outcomes.js';
/** Pin current records and retained history alike; tombstones have no resources. */
export function reachableResources(state: WorkspaceState): readonly Digest[] {
  return [...new Set(state.slots.flatMap((slot) => slot.resources))].sort();
}
/** All provider work settles before releasing the GC lease, even after a failed result. */
export async function verifyResources(
  blobs: readonly BlobRecord[],
  verify: VerifyBlob,
): Promise<Result<void>> {
  const results = await Promise.all(
    blobs.map((blob) => protectAsync(() => verify(blob.digest, blob.base64))),
  );
  const failed = results.find((result) => !result.ok);
  return failed ?? success(undefined);
}
/** A bundle must contain exactly the unique reachable set; extra or duplicate bytes also reject. */
export function checkCoverage(state: WorkspaceState, blobs: readonly BlobRecord[]): Result<void> {
  const expected = reachableResources(state);
  const supplied = blobs.map((blob) => blob.digest).sort();
  if (JSON.stringify(expected) !== JSON.stringify(supplied))
    return fail(
      'corrupt-record',
      'blobs',
      'Backup resources do not exactly match retained references',
    );
  return success(undefined);
}
/** Lease cleanup is attempted after typed failures and provider exceptions; Assets recovers abandoned leases. */
export async function withLease<T>(
  lease: { release(): Promise<Result<void>> },
  action: () => Promise<Result<T>>,
): Promise<Result<T>> {
  const result = await protectAsync(action);
  const released = await protectAsync(() => lease.release());
  if (!released.ok) return released;
  return result;
}
