import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import type { ReadVersion, Slot, WorkspaceState } from '../../contract/records/storage.js';
import type { Write } from '../../contract/records/transaction.js';
import { findSlot, keyText } from './keys.js';
import { success } from '../validation/outcomes.js';
/** Never-seen and tombstoned identities have different tokens, preventing stale recreation. */
export function currentVersion(
  state: WorkspaceState,
  key: ReadVersion['key'],
): ReadVersion['version'] {
  const previous = findSlot(state, key);
  if (!previous) return 'absent';
  return previous.version;
}
/** Compare read-only dependencies as well as mutation targets. */
export function compareVersions(
  state: WorkspaceState,
  expected: readonly ReadVersion[],
): Result<void> {
  const mismatch = expected.find((read) => currentVersion(state, read.key) !== read.version);
  if (mismatch) return fail('revision-conflict', keyText(mismatch.key), 'Observed version changed');
  return success(undefined);
}
/** Deletes must target live data; tombstone tokens still participate in recreation checks. */
function invalidDelete(state: WorkspaceState, write: Write): boolean {
  if (write.kind !== 'delete') return false;
  const previous = findSlot(state, write.key);
  return previous?.deleted !== false;
}
/** Detect illegal deletion and exhausted versions before creating any candidate slots. */
export function checkWrites(state: WorkspaceState, writes: readonly Write[]): Result<void> {
  if (writes.some((write) => invalidDelete(state, write)))
    return fail('invalid-input', 'writes', 'Delete requires a live record');
  if (writes.some((write) => currentVersion(state, write.key) === Number.MAX_SAFE_INTEGER))
    return fail('invalid-input', 'writes', 'Record version exhausted');
  return success(undefined);
}
/** A put or tombstone is a new immutable version; payload revision is Authoring's responsibility. */
export function writeSlot(state: WorkspaceState, write: Write): Slot {
  const previousVersion = currentVersion(state, write.key);
  const version = previousVersion === 'absent' ? 0 : previousVersion + 1;
  if (write.kind === 'delete')
    return { key: write.key, version, value: null, deleted: true, resources: [] };
  return {
    key: write.key,
    version,
    value: write.value,
    deleted: false,
    resources: write.resources,
  };
}
