import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import { versionHeader, admittedWorkspaceState } from '../../contract/records/storage.js';
import type { WorkspaceState, Slot, Receipt, Json } from '../../contract/records/storage.js';
import { hasDuplicates, keyText } from '../transaction/keys.js';
import { RECEIPT_LIMIT } from '../transaction/limits.js';
import { JSON_LIMIT, boundedClone, parse, success } from './outcomes.js';

/**
 * Checks the structure of a workspace state, from storage or from a planned commit.
 *
 * Only storage structure is checked here. Domain corruption (Model, Library, asset references) is
 * found by the validators injected into restore and by Authoring's admission. Data is never
 * repaired or reset.
 *
 * Steps, in order:
 * 1. Slots and receipts this module already admitted (and that are frozen) are set aside, so only
 *    new parts are copied and parsed.
 * 2. The rest is copied as bounded JSON ({@link boundedClone}).
 * 3. A `schemaVersion` other than 1 fails with `unsupported-version`, path `schemaVersion`.
 * 4. The copy is parsed against the workspace state schema: `corrupt-record` at the first issue's
 *    path.
 * 5. The parts set aside are put back in their places.
 * 6. The state rules run: a broken rule fails with `corrupt-record`, path `$`.
 * 7. The total JSON size of slots and receipts is checked against {@link JSON_LIMIT}.
 * 8. The state is remembered as admitted (see {@link isAdmitted}).
 *
 * @param input - The raw state.
 * @returns The checked state.
 * @throws TypeError or RangeError from {@link boundedClone} for non-JSON or oversized input, and
 * RangeError (`JSON limit`) when the whole state is over the limit. Callers run this inside
 * `protect`, which turns the throw into a typed failure.
 */
export function validateState(input: unknown): Result<WorkspaceState> {
  const reused = reuseParts(input);
  const detached = boundedClone(reused.probe);
  if (hasUnsupportedVersion(detached)) {
    return fail('unsupported-version', 'schemaVersion', 'Unsupported storage schema');
  }
  const checked = checkState(detached);
  if (!checked.ok) {
    return checked;
  }
  return admitState(reused.restore(checked.value));
}

/**
 * Reports whether a value is a state that {@link validateState} admitted and that is frozen.
 * Such a state needs no second check.
 *
 * @param value - Any value.
 * @returns `true` for an admitted, frozen workspace state.
 */
export function isAdmitted(value: unknown): value is WorkspaceState {
  return (
    typeof value === 'object' && value !== null && Object.isFrozen(value) && admitted.has(value)
  );
}

/** States this module admitted. */
const admitted = new WeakSet<object>();

/** Slots and receipts this module admitted, with their JSON size in bytes. */
const admittedParts = new WeakMap<object, number>();

const encoder = new TextEncoder();

/**
 * Structural rules a parsed state must not break; each returns `true` when broken. Checked in
 * order, and checking stops at the first broken rule.
 */
const stateRules: readonly ((state: WorkspaceState) => boolean)[] = [
  // Two slots for the same record.
  (state) => hasDuplicates(state.slots.map((slot) => keyText(slot.key))),
  // Two receipts for the same request.
  (state) => hasDuplicates(state.receipts.map((receipt) => receipt.request)),
  // Two receipts with the same sequence number.
  (state) => hasDuplicates(state.receipts.map((receipt) => String(receipt.sequence))),
  // A receipt from after the workspace's current sequence.
  (state) => state.receipts.some((receipt) => receipt.sequence > state.sequence),
  // More receipts than commits.
  (state) => state.receipts.length > state.sequence,
  // Fewer receipts than kept commits: every commit keeps a receipt, up to RECEIPT_LIMIT.
  (state) => state.receipts.length < Math.min(state.sequence, RECEIPT_LIMIT),
  // A tombstone with content.
  (state) => state.slots.some(invalidTombstone),
  // Slots before the first commit.
  (state) => state.sequence === 0 && state.slots.length !== 0,
  // A slot that lists the same asset twice.
  (state) => state.slots.some((slot) => hasDuplicates(slot.resources)),
  // A receipt that lists the same record twice.
  (state) =>
    state.receipts.some((receipt) =>
      hasDuplicates(receipt.versions.map((version) => keyText(version.key))),
    ),
];

/** True when the copy declares a `schemaVersion` other than 1. */
function hasUnsupportedVersion(detached: Json): boolean {
  const header = versionHeader.safeParse(detached);
  return header.success && header.data.schemaVersion !== 1;
}

/**
 * Parses the copy against the workspace state schema. Only payload values (slot `value`,
 * receipt `outcome`) found in this copy are accepted.
 */
function checkState(input: Json): Result<WorkspaceState> {
  const schema = admittedWorkspaceState([
    ...payloads(input, 'slots', 'value'),
    ...payloads(input, 'receipts', 'outcome'),
  ]);
  return parse(schema, input, 'corrupt-record');
}

/**
 * Runs the state rules and the size limit, then records the state as admitted.
 *
 * @throws RangeError (`JSON limit`) when slots and receipts together are over {@link JSON_LIMIT}.
 */
function admitState(state: WorkspaceState): Result<WorkspaceState> {
  if (stateRules.some((violated) => violated(state))) {
    return fail('corrupt-record', '$', 'Storage identity, sequence or tombstone invariant failed');
  }
  if (bytes(state) > JSON_LIMIT) {
    throw new RangeError('JSON limit');
  }
  admitted.add(state);
  return success(state);
}

/** A tombstone must have no value and no assets. */
function invalidTombstone(slot: Slot): boolean {
  if (!slot.deleted) {
    return false;
  }
  return slot.value !== null || slot.resources.length !== 0;
}

/** Total JSON size in bytes of all slots and receipts. */
function bytes(state: WorkspaceState): number {
  return [...state.slots, ...state.receipts].reduce((sum, part) => sum + partBytes(part), 0);
}

/** JSON size in bytes of one slot or receipt. The size is remembered, which marks the part as admitted. */
function partBytes(part: object): number {
  const known = admittedParts.get(part);
  if (known !== undefined) {
    return known;
  }
  const size = encoder.encode(JSON.stringify(part)).length;
  admittedParts.set(part, size);
  return size;
}

/** True for a frozen slot or receipt this module already admitted. */
function isAdmittedPart(part: unknown): boolean {
  return (
    typeof part === 'object' && part !== null && Object.isFrozen(part) && admittedParts.has(part)
  );
}

/**
 * Sets aside already admitted slots and receipts, so only new parts are copied and parsed.
 *
 * @returns `probe`, the input without the parts set aside; and `restore`, which puts them back
 * into a parsed state in their original places. Input that is not an object with `slots` and
 * `receipts` arrays is passed through unchanged.
 */
function reuseParts(input: unknown): {
  probe: unknown;
  restore: (state: WorkspaceState) => WorkspaceState;
} {
  const plain = { probe: input, restore: (state: WorkspaceState) => state };
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return plain;
  }
  const fields = { ...(input as Record<string, unknown>) };
  const { slots, receipts } = fields;
  if (!Array.isArray(slots) || !Array.isArray(receipts)) {
    return plain;
  }
  // `admittedParts` only holds slots and receipts from states this module admitted, so a part
  // found there is a checked Slot or Receipt.
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

/**
 * Puts the parts set aside back in their places; the freshly parsed parts fill the gaps in order.
 */
function merge<T>(kept: readonly (T | null)[], fresh: readonly T[]): T[] {
  let next = 0;
  // `fresh` has one parsed part for each gap, so the index never runs past its end.
  return kept.map((part) => part ?? (fresh[next++] as T));
}

/** True for a JSON object; arrays and primitives are not. Only objects hold payload fields. */
function jsonRecord(value: Json | undefined): value is { readonly [key: string]: Json } {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** The payload under `key` when the record has it and it is not `undefined`; otherwise none. */
function presentPayload(record: { readonly [key: string]: Json }, key: string): readonly Json[] {
  if (!Object.hasOwn(record, key)) {
    return [];
  }
  const value = record[key];
  return value === undefined ? [] : [value];
}

/** The payloads under `key` of every object in the `records` array of the copy. */
function payloads(input: Json, records: string, key: string): readonly Json[] {
  if (!jsonRecord(input)) {
    return [];
  }
  const entries = input[records];
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries.filter(jsonRecord).flatMap((entry) => presentPayload(entry, key));
}
