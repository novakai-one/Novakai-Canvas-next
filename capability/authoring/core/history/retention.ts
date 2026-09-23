import type { RequestId } from '../../contract/brands.js';
import type { HistoryNavigation } from '../../contract/records/history.js';
import type { RecordKey, Snapshot } from '../../contract/records/storage.js';
import type { PurgeWrite } from '../../contract/ports/store.js';
import { findRecord, keyText } from '../records/keys.js';
import { navigationKey } from './navigation.js';
import { transactionKey, headKey } from './read.js';
/** Undo steps kept per workspace. Older steps leave navigation and their records are purged. */
export const HISTORY_LIMIT = 100;
/** Retained before/after images stay under this many bytes, leaving the rest of storage to content. */
export const HISTORY_BYTES = 16 * 1024 * 1024;
/** Keeps one commit's reads under the dependency limit; reopening repeats until clean. */
const PURGE_BATCH = 2000;
const sizes = new WeakMap<object, number>();
/** JSON bytes of one step's transaction record; steps not yet stored count as zero. */
function stepBytes(snapshot: Snapshot, id: RequestId): number {
  const record = findRecord(snapshot, transactionKey(id));
  if (record === null) return 0;
  const known = sizes.get(record);
  if (known !== undefined) return known;
  const size = JSON.stringify(record.value).length;
  sizes.set(record, size);
  return size;
}
/** Oldest undo steps go first, then the furthest redo steps; the newest step always stays. */
function removalOrder(length: number, cursor: number): readonly number[] {
  const undo = Array.from({ length: cursor }, (_, index) => index);
  const redo = Array.from({ length: length - cursor }, (_, index) => length - 1 - index);
  return [...undo, ...redo].slice(0, Math.max(0, length - 1));
}
/** How many steps, taken in removal order, must go before count and bytes fit. */
function removalCount(sizes: readonly number[], order: readonly number[]): number {
  const total = sizes.reduce((sum, size) => sum + size, 0);
  const left = order.reduce(
    (list, index) => [...list, (list.at(-1) as number) - (sizes[index] as number)],
    [total],
  );
  const fits = (bytes: number, removed: number) =>
    sizes.length - removed <= HISTORY_LIMIT && bytes <= HISTORY_BYTES;
  const found = left.findIndex(fits);
  return found === -1 ? order.length : found;
}
/** Bound undo steps by count and bytes; order and cursor stay aligned. */
export function boundNavigation(snapshot: Snapshot, history: HistoryNavigation): HistoryNavigation {
  const sizes = history.actions.map((id) => stepBytes(snapshot, id));
  const order = removalOrder(sizes.length, history.cursor);
  const removed = order.slice(0, removalCount(sizes, order));
  if (removed.length === 0) return history;
  const gone = new Set(removed);
  return {
    ...history,
    actions: history.actions.filter((_, index) => !gone.has(index)),
    cursor: history.cursor - removed.filter((index) => index < history.cursor).length,
  };
}
/** History records the navigation no longer reaches, except the ones this commit writes. */
export function staleHistory(
  snapshot: Snapshot,
  actions: readonly RequestId[],
  written: readonly RecordKey[],
): readonly PurgeWrite[] {
  const reached = actions.flatMap((id) => [transactionKey(id), headKey(id)]);
  const keep = new Set([navigationKey, ...written, ...reached].map(keyText));
  return snapshot.records
    .filter((record) => record.key.kind === 'history' && !keep.has(keyText(record.key)))
    .slice(0, PURGE_BATCH)
    .map((record) => ({ kind: 'purge', key: record.key }));
}
