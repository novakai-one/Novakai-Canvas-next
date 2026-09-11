import type { Result } from '../../contract/errors.js';
import type { Digest } from '../../contract/brands.js';
import { leaseRecord, digestList } from '../../contract/records/lease.js';
import type { LeaseRecord } from '../../contract/records/lease.js';
import type { AssetTransaction } from '../../contract/ports/storage.js';
import type { IdentityPort } from '../../contract/ports/identity.js';
import type { ReachabilityReader } from '../../contract/ports/reachability.js';
import type { CollectionReport } from '../../contract/types.js';
import { parse, success } from '../validation/outcomes.js';
/** Every lease is validated before any metadata/file deletion; malformed protection is never ignored. */
function readLeases(view: Pick<AssetTransaction, 'listLeases'>): Result<readonly LeaseRecord[]> {
  const checked = view.listLeases().map((raw) => parse(leaseRecord, raw, 'corrupt-asset'));
  const failed = checked.find((result) => !result.ok);
  if (failed && !failed.ok) return failed;
  return success(checked.flatMap((result) => (result.ok ? [result.value] : [])));
}
/** Only provably dead process owners release protection; PID reuse or permission errors retain it. */
function recoverOwners(
  view: Pick<AssetTransaction, 'deleteLease'>,
  leases: readonly LeaseRecord[],
  identity: Pick<IdentityPort, 'ownerAlive'>,
): readonly Digest[] {
  const active = leases.filter((lease) => identity.ownerAlive(lease.ownerPid));
  const activeIds = new Set(active.map((lease) => lease.id));
  leases.filter((lease) => !activeIds.has(lease.id)).forEach((lease) => view.deleteLease(lease.id));
  return active.flatMap((lease) => lease.digests);
}
/** File removals are limited to checked owned digest paths; a driver failure aborts the success report. */
function removeUnreferenced(
  view: Pick<AssetTransaction, 'listBlobs' | 'deleteBlob'>,
  protectedDigests: readonly Digest[],
): Result<CollectionReport> {
  const keep = new Set(protectedDigests);
  const present = view.listBlobs();
  const removed = present.filter((digest) => !keep.has(digest));
  const retained = present.filter((digest) => keep.has(digest));
  removed.forEach((digest) => view.deleteBlob(digest));
  return success({ removed, retained });
}
/** Authoritative reader runs under the same maintenance transaction as lease acquisition and deletion. */
function collectChecked(
  view: Pick<AssetTransaction, 'deleteLease' | 'listBlobs' | 'deleteBlob'>,
  leases: readonly LeaseRecord[],
  identity: Pick<IdentityPort, 'ownerAlive'>,
  readReachability: ReachabilityReader,
): Result<CollectionReport> {
  const references = readReachability();
  if (!references.ok) return references;
  const checked = parse(digestList, references.value, 'corrupt-asset');
  if (!checked.ok) return checked;
  const pins = recoverOwners(view, leases, identity);
  return removeUnreferenced(view, [...checked.value, ...pins]);
}
/** Collection is explicit maintenance. Authoring acquires existing bytes or stages under reservation before committing. */
export function collectBlobs(
  view: Pick<AssetTransaction, 'listLeases' | 'deleteLease' | 'listBlobs' | 'deleteBlob'>,
  identity: Pick<IdentityPort, 'ownerAlive'>,
  readReachability: ReachabilityReader,
): Result<CollectionReport> {
  const leases = readLeases(view);
  if (!leases.ok) return leases;
  return collectChecked(view, leases.value, identity, readReachability);
}
