import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import { versionHeader, admittedWorkspaceState } from '../../contract/records/storage.js';
import type { WorkspaceState, Slot, Receipt, Json } from '../../contract/records/storage.js';
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
  const reused = reuseParts(input);
  const detached = boundedClone(reused.probe);
  const header = versionHeader.safeParse(detached);
  if (header.success && header.data.schemaVersion !== 1)
    return fail('unsupported-version', 'schemaVersion', 'Unsupported storage schema');
  const checked = checkState(detached);
  if (!checked.ok) return checked;
  const state = reused.restore(checked.value);
  if (stateRules.some((violated) => violated(state)))
    return fail('corrupt-record', '$', 'Storage identity, sequence or tombstone invariant failed');
  if (bytes(state) > STATE_LIMIT) throw new RangeError('JSON limit');
  admitted.add(state);
  return success(state);
}
/** States this module produced; frozen ones need no second check. */
const admitted = new WeakSet<object>();
/** Slots and receipts this module admitted, with their JSON byte size. Frozen ones are reused as is. */
const admittedParts = new WeakMap<object, number>();
const STATE_LIMIT = 64 * 1024 * 1024;
const encoder = new TextEncoder();
function partBytes(part: object): number {
  const known = admittedParts.get(part);
  if (known !== undefined) return known;
  const size = encoder.encode(JSON.stringify(part)).length;
  admittedParts.set(part, size);
  return size;
}
function bytes(state: WorkspaceState): number {
  return [...state.slots, ...state.receipts].reduce((sum, part) => sum + partBytes(part), 0);
}
function isAdmittedPart(part: unknown): boolean {
  return (
    typeof part === 'object' && part !== null && Object.isFrozen(part) && admittedParts.has(part)
  );
}
/** Swap already admitted parts for placeholders so only new parts are cloned and parsed. */
function reuseParts(input: unknown): {
  probe: unknown;
  restore: (state: WorkspaceState) => WorkspaceState;
} {
  const plain = { probe: input, restore: (state: WorkspaceState) => state };
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return plain;
  const fields = { ...(input as Record<string, unknown>) };
  const { slots, receipts } = fields;
  if (!Array.isArray(slots) || !Array.isArray(receipts)) return plain;
  const keptSlots = slots.map((part) => (isAdmittedPart(part) ? (part as Slot) : null));
  const keptReceipts = receipts.map((part) => (isAdmittedPart(part) ? (part as Receipt) : null));
  const probe = {
    ...fields,
    slots: slots.filter((_, index) => keptSlots[index] === null),
    receipts: receipts.filter((_, index) => keptReceipts[index] === null),
  };
  return {
    probe,
    restore: (state) => ({
      ...state,
      slots: merge(keptSlots, state.slots),
      receipts: merge(keptReceipts, state.receipts),
    }),
  };
}
/** Put reused parts back in their slots; fresh parts fill the gaps in order. */
function merge<T>(kept: readonly (T | null)[], fresh: readonly T[]): T[] {
  let next = 0;
  return kept.map((part) => part ?? (fresh[next++] as T));
}
export function isAdmitted(value: unknown): value is WorkspaceState {
  return (
    typeof value === 'object' && value !== null && Object.isFrozen(value) && admitted.has(value)
  );
}
/** Only detached JSON objects can provide payload fields; arrays and primitives never do. */
function jsonRecord(value: Json | undefined): value is { readonly [key: string]: Json } {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
/** Missing required payloads never enter the admitted set, including undefined. */
function presentPayload(record: { readonly [key: string]: Json }, key: string): readonly Json[] {
  if (!Object.hasOwn(record, key)) return [];
  const value = record[key];
  return value === undefined ? [] : [value];
}
/** Collect only leaves already validated and detached by boundedClone in this invocation. */
function payloads(input: Json, records: string, key: string): readonly Json[] {
  if (!jsonRecord(input)) return [];
  const entries = input[records];
  if (!Array.isArray(entries)) return [];
  return entries.filter(jsonRecord).flatMap((entry) => presentPayload(entry, key));
}
/** Validate all state invariants after shape parsing; never repair or silently reset data. */
function checkState(input: Json): Result<WorkspaceState> {
  const schema = admittedWorkspaceState([
    ...payloads(input, 'slots', 'value'),
    ...payloads(input, 'receipts', 'outcome'),
  ]);
  const parsed = parse(schema, input, 'corrupt-record');
  return parsed;
}
