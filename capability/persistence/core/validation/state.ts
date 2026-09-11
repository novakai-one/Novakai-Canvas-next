import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import { versionHeader, workspaceState } from '../../contract/records/storage.js';
import type { WorkspaceState, Slot } from '../../contract/records/storage.js';
import { hasDuplicates, keyText } from '../transaction/keys.js';
import { boundedClone, parse, success } from './outcomes.js';
/** Tombstones cannot retain reachable bytes or semantic content. */
function invalidTombstone(slot: Slot): boolean {
  if (!slot.deleted) return false;
  return slot.value !== null || slot.resources.length !== 0;
}
/** Each rule describes one owned structural integrity predicate. */
const stateRules: readonly ((state: WorkspaceState) => boolean)[] = [
  (state) => hasDuplicates(state.slots.map((slot) => keyText(slot.key))),
  (state) => hasDuplicates(state.receipts.map((receipt) => receipt.request)),
  (state) => hasDuplicates(state.receipts.map((receipt) => String(receipt.sequence))),
  (state) => state.receipts.some((receipt) => receipt.sequence > state.sequence),
  (state) => state.receipts.length !== state.sequence,
  (state) => state.slots.some(invalidTombstone),
  (state) => state.sequence === 0 && state.slots.length !== 0,
  (state) => state.slots.some((slot) => hasDuplicates(slot.resources)),
  (state) =>
    state.receipts.some((receipt) =>
      hasDuplicates(receipt.versions.map((version) => keyText(version.key))),
    ),
];
/** Structural integrity only. Domain corruption is detected by injected restore/admission validators. */
export function validateState(input: unknown): Result<WorkspaceState> {
  const detached = boundedClone(input);
  const header = versionHeader.safeParse(detached);
  if (header.success && header.data.schemaVersion !== 1)
    return fail('unsupported-version', 'schemaVersion', 'Unsupported storage schema');
  return checkState(detached);
}
/** Validate all state invariants after shape parsing; never repair or silently reset data. */
function checkState(input: unknown): Result<WorkspaceState> {
  const parsed = parse(workspaceState, input, 'corrupt-record');
  if (!parsed.ok) return parsed;
  if (stateRules.some((violated) => violated(parsed.value)))
    return fail('corrupt-record', '$', 'Storage identity, sequence or tombstone invariant failed');
  return success(parsed.value);
}
