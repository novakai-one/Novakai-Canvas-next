import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import { versionHeader, admittedWorkspaceState } from '../../contract/records/storage.js';
import type { WorkspaceState, Slot, Json } from '../../contract/records/storage.js';
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
  if (!parsed.ok) return parsed;
  if (stateRules.some((violated) => violated(parsed.value)))
    return fail('corrupt-record', '$', 'Storage identity, sequence or tombstone invariant failed');
  return success(parsed.value);
}
