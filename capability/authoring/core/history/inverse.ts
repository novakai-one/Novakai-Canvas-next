import type { Request } from '../../contract/records/request.js';
import type { Proposal } from '../../contract/records/proposal.js';
import type { Snapshot, Write, StoredRecord, RecordKey } from '../../contract/records/storage.js';
import type { HistoryHead, Transaction } from '../../contract/records/history.js';
import { readTransaction, readHead, transactionKey, headKey } from './read.js';
import { compareVersions, uniqueKeys } from '../records/versions.js';
import { keyText, versionOf } from '../records/keys.js';
import { readNavigation, nextAction, navigationKey } from './navigation.js';
import { findRecord } from '../records/keys.js';
import { reject } from '../validation/outcomes.js';
/** Null/tombstoned original state becomes a deletion; live state restores exact prior content/resources. */
function restoreRecord(
  transition: Transaction['transitions'][number],
  record: StoredRecord | null,
): Write {
  if (record === null) return { kind: 'delete', key: transition.key };
  if (record.deleted) return { kind: 'delete', key: transition.key };
  return { kind: 'put', key: transition.key, value: record.value, resources: record.resources };
}
/** Every recorded participant must be present exactly once; a forged partial head cannot authorize history. */
function checkParticipants(transaction: Transaction, head: HistoryHead): void {
  uniqueKeys(
    transaction.transitions.map((item) => item.key),
    'history.transitions',
  );
  uniqueKeys(
    head.participants.map((item) => item.key),
    'history.participants',
  );
  const expected = transaction.transitions.map((item) => keyText(item.key)).toSorted();
  const actual = head.participants.map((item) => keyText(item.key)).toSorted();
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    reject('corrupt-record', 'history', 'History participant coverage differs');
}
/** Branch state and versions both matter; equal content after a divergent edit is still a conflict. */
function checkHead(snapshot: Snapshot, request: Request, head: HistoryHead): void {
  const required = requiredState(request);
  if (head.state !== required)
    reject('revision-conflict', 'history', 'Transaction is not in the required undo/redo state');
  const stored = findRecord(snapshot, navigationKey);
  if (stored === null) return compareVersions(snapshot, head.participants);
  checkNavigation(snapshot, request);
}
function requiredState(request: Request): HistoryHead['state'] {
  return request.intent.kind === 'undo' ? 'active' : 'undone';
}
function checkNavigation(snapshot: Snapshot, request: Request): void {
  if (request.intent.kind === 'change') return;
  const history = readNavigation(snapshot);
  if (nextAction(history, request.intent.kind) !== request.intent.transaction)
    reject(
      'revision-conflict',
      'history',
      'Only the next chronological action can be undone or redone',
    );
  checkNavigationToken(snapshot, request);
}
function checkNavigationToken(snapshot: Snapshot, request: Request): void {
  const token = request.expected.find((item) => keyText(item.key) === keyText(navigationKey));
  if (token === undefined)
    reject('invalid-input', 'expected', 'An inverse requires the observed navigation version');
  compareVersions(snapshot, [token]);
}
/** Internal history planner returns ordinary data for the same candidate/resource/feasibility guards. */
export function planInverse(request: Request, snapshot: Snapshot): Proposal {
  if (request.intent.kind === 'change')
    return reject('invalid-input', 'intent', 'An inverse intent is required');
  const original = request.intent.transaction;
  const transaction = readTransaction(snapshot, original);
  const head = readHead(snapshot, original);
  transaction.transitions.forEach(checkTransitionIdentity);
  checkParticipants(transaction, head);
  checkHead(snapshot, request, head);
  const direction = request.intent.kind;
  return {
    writes: transaction.transitions.map((item) =>
      restoreRecord(item, direction === 'undo' ? item.before : item.after),
    ),
    reads: [
      ...head.participants.map((item) => versionOf(snapshot, item.key)),
      versionOf(snapshot, transactionKey(original)),
      versionOf(snapshot, headKey(original)),
    ],
    diff: {
      kind: direction,
      transaction: original,
      participants: head.participants.map((item) => keyText(item.key)),
    },
    warnings: [],
  };
}

/** Retained images identify the same participant before their values can become inverse writes. */
function checkTransitionIdentity(transition: Transaction['transitions'][number]): void {
  checkImageIdentity(transition.after, transition.key);
  if (transition.before === null) return;
  checkImageIdentity(transition.before, transition.key);
}
/** Authoring rejects corrupt owned history rather than discarding a conflicting image key while restoring data. */
function checkImageIdentity(image: StoredRecord, expected: RecordKey): void {
  if (keyText(image.key) !== keyText(expected))
    reject('corrupt-record', 'history', 'Historical image belongs to another participant');
}
