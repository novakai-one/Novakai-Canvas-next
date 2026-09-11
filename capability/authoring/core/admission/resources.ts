import type { ResourceLease } from '../../contract/ports/resources.js';
import type { Snapshot, Write } from '../../contract/records/storage.js';
import type { Digest } from '../../contract/brands.js';
import { findRecord } from '../records/keys.js';
import { reject } from '../validation/outcomes.js';
/** History records retain original resources; deletion does not release bytes needed by undo. */
function transitionResources(snapshot: Snapshot, write: Write): readonly Digest[] {
  const previous = findRecord(snapshot, write.key);
  const retained = previous === null ? [] : previous.resources;
  if (write.kind === 'delete') return retained;
  return [...retained, ...write.resources];
}
/** Every byte named by changed content/history must remain protected until physical transaction settlement. */
export function checkCoverage(
  snapshot: Snapshot,
  writes: readonly Write[],
  covered: readonly Digest[],
): void {
  const missing = writes
    .flatMap((write) => transitionResources(snapshot, write))
    .find((digest) => !covered.includes(digest));
  if (missing)
    reject('missing-asset', missing, 'A candidate/history resource is outside the held lease');
}
/** Release is best-effort: a retained lease is recoverable by Assets maintenance; committed receipt remains authoritative. */
export async function releaseProtection(lease: ResourceLease): Promise<void> {
  try {
    await lease.release();
  } catch {
    return;
  }
}
