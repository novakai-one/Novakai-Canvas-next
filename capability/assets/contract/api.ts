import { digest } from './brands.js';
import type { LeaseId } from './brands.js';
import type { Result } from './errors.js';
import { digestList } from './records/lease.js';
import type { ReadLease, WriteLease, Assets, AssetDependencies } from './types.js';
import type { StoredBlob } from './records/media.js';
import { parse, protect, protectAsync, success } from '../core/validation/outcomes.js';
import { stageMedia } from '../core/admission/stage.js';
import { resolveBlob } from '../core/resolution/resolve.js';
import {
  createLease,
  readLeased,
  prepareRestored,
  stageReserved,
} from '../core/reachability/leases.js';
import { collectBlobs } from '../core/reachability/collect.js';
/** Parse digest at every external lease/resolution call, including direct JavaScript callers. */
function resolveInput(input: unknown, deps: AssetDependencies): Result<StoredBlob> {
  const parsed = parse(digest, input);
  if (!parsed.ok) return parsed;
  return deps.storage.transact((view) => resolveBlob(view, parsed.value, deps.identity));
}
/** An acquired read verifies both active lease membership and physical content on each call. */
function readLeaseInput(id: LeaseId, input: unknown, deps: AssetDependencies): Result<StoredBlob> {
  const parsed = parse(digest, input);
  if (!parsed.ok) return parsed;
  return deps.storage.transact((view) => readLeased(view, id, parsed.value, deps.identity));
}
/** Duplicate lease members normalize once; all requested existing bytes verify before lease creation. */
function openLease(input: unknown, existing: boolean, deps: AssetDependencies): Result<LeaseId> {
  const parsed = parse(digestList, input);
  if (!parsed.ok) return parsed;
  const digests = [...new Set(parsed.value)].sort();
  const created = deps.storage.transact((view) =>
    createLease(view, digests, existing, deps.identity),
  );
  if (!created.ok) return created;
  return success(created.value.id);
}
/** Release is idempotent; a closed storage service still returns its typed infrastructure failure. */
function releaseLease(id: LeaseId, deps: AssetDependencies): Result<void> {
  return protect(() =>
    deps.storage.transact((view) => {
      view.deleteLease(id);
      return success(undefined);
    }),
  );
}
/** Lease closure exposes protected read/release only, with active membership rechecked on every read. */
function acquire(input: unknown, deps: AssetDependencies): Result<ReadLease> {
  const opened = openLease(input, true, deps);
  if (!opened.ok) return opened;
  const id = opened.value;
  return success({
    id,
    read: (input) => protect(() => readLeaseInput(id, input, deps)),
    release: () => releaseLease(id, deps),
  });
}
/** Restoring is async; validated bytes cannot be installed after this lease has been released. */
function reserve(input: unknown, deps: AssetDependencies): Result<WriteLease> {
  const opened = openLease(input, false, deps);
  if (!opened.ok) return opened;
  const id = opened.value;
  return success({
    id,
    stage: (input, base64) =>
      protectAsync(async () => {
        const parsed = parse(digest, input);
        if (!parsed.ok) return parsed;
        return stageReserved(deps.storage, id, parsed.value, base64, deps.media, deps.identity);
      }),
    release: () => releaseLease(id, deps),
  });
}
/** Verify both pinned bytes and safe normalized media; no storage mutation or lease is required. */
async function verify(
  input: unknown,
  base64: unknown,
  deps: AssetDependencies,
): Promise<Result<void>> {
  const parsed = parse(digest, input);
  if (!parsed.ok) return parsed;
  const checked = await prepareRestored(parsed.value, base64, deps.media, deps.identity);
  if (!checked.ok) return checked;
  return success(undefined);
}
/** Bind trusted storage and codecs once. Authoring owns bindings; Assets owns media/lease recovery. */
export function createAssets(deps: AssetDependencies): Assets {
  return Object.freeze({
    stage: (input) => stageMedia(input, deps),
    resolve: (input) => protect(() => resolveInput(input, deps)),
    acquire: (input) => protect(() => acquire(input, deps)),
    reserve: (input) => protect(() => reserve(input, deps)),
    verify: (input, base64) => protectAsync(() => verify(input, base64, deps)),
    collectUnreferenced: (reader) =>
      protect(() => deps.storage.transact((view) => collectBlobs(view, deps.identity, reader))),
    close: () => protect(() => deps.storage.close()),
  } satisfies Assets);
}
