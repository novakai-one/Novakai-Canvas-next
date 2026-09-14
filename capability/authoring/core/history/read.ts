import { recordId } from '../../contract/brands.js';
import type { RequestId } from '../../contract/brands.js';
import { transactionSchema, headSchema } from '../../contract/records/history.js';
import type { Transaction, HistoryHead } from '../../contract/records/history.js';
import type { RecordKey, Snapshot, StoredRecord } from '../../contract/records/storage.js';
import { findRecord } from '../records/keys.js';
import { readShape } from '../validation/input.js';
import { storedLimits } from '../validation/plain-data.js';
import { reject } from '../validation/outcomes.js';
/** Request bounds reserve prefix space; Authoring owns collision checks at conditional commit. */
export function transactionKey(request: RequestId): RecordKey {
  return { kind: 'history', id: readShape(recordId, `tx:${request}`) };
}
/** One original transaction head tracks its current inverse/redo participant versions. */
export function headKey(request: RequestId): RecordKey {
  return { kind: 'history', id: readShape(recordId, `head:${request}`) };
}
/** Missing/deleted history never means an empty successful undo. */
function retained(snapshot: Snapshot, key: RecordKey): StoredRecord {
  const record = findRecord(snapshot, key);
  if (record === null) reject('unknown-reference', 'history', 'Retained transaction was not found');
  if (record.deleted) reject('corrupt-record', 'history', 'History cannot be tombstoned');
  return record;
}
/** Checked original transaction; inverse transactions cannot become a new redo branch. */
export function readTransaction(snapshot: Snapshot, request: RequestId): Transaction {
  const record = retained(snapshot, transactionKey(request));
  const transaction = readShape(transactionSchema, record.value, 'corrupt-record', storedLimits);
  if (transaction.id !== request)
    reject('corrupt-record', 'history', 'Transaction identity differs from its key');
  if (transaction.mode !== 'change')
    reject('invalid-input', 'history', 'Undo/redo targets an original change transaction');
  return transaction;
}
/** Validate the stored head before trusting participant versions; Authoring owns conflict recovery. */
export function readHead(snapshot: Snapshot, request: RequestId): HistoryHead {
  const head = readShape(
    headSchema,
    retained(snapshot, headKey(request)).value,
    'corrupt-record',
    storedLimits,
  );
  if (head.original !== request)
    reject('corrupt-record', 'history', 'History head identity differs from its key');
  return head;
}
