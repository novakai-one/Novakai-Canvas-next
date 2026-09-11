import type { RecordKey, Slot, WorkspaceState } from '../../contract/records/storage.js';
/** Unambiguous composite identity: ID grammar excludes slash. */
export function keyText(key: RecordKey): string {
  return `${key.kind}/${key.id}`;
}
/** Find one slot, including tombstones; absence never means merely deleted. */
export function findSlot(state: WorkspaceState, key: RecordKey): Slot | undefined {
  return state.slots.find((slot) => keyText(slot.key) === keyText(key));
}
/** Duplicate check shared by envelope and request rules; no persisted mutable index. */
export function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}
