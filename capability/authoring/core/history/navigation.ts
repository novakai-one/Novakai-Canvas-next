import { recordId } from '../../contract/brands.js';
import type { RequestId } from '../../contract/brands.js';
import { navigationSchema, historyStatusSchema } from '../../contract/records/history.js';
import type {
  HistoryNavigation,
  HistoryStatus,
  HistoryAction,
} from '../../contract/records/history.js';
import type { Snapshot, RecordKey, ReadVersion } from '../../contract/records/storage.js';
import type { Request } from '../../contract/records/request.js';
import { readTransaction, readHead } from './read.js';
import { findRecord, versionOf, keyText } from '../records/keys.js';
import { uniqueKeys, compareVersions } from '../records/versions.js';
import { readShape } from '../validation/input.js';
import { storedLimits } from '../validation/plain-data.js';
import { reject } from '../validation/outcomes.js';
export const navigationKey: RecordKey = { kind: 'history', id: recordId.parse('navigation') };
/** Migration alone may create a baseline; ordinary reads never invent one. */
const navigations = new WeakMap<Snapshot, HistoryNavigation>();
export function readNavigation(snapshot: Snapshot): HistoryNavigation {
  const known = Object.isFrozen(snapshot) ? navigations.get(snapshot) : undefined;
  if (known !== undefined) return known;
  const navigation = checkedNavigation(snapshot);
  if (Object.isFrozen(snapshot)) navigations.set(snapshot, navigation);
  return navigation;
}
function checkedNavigation(snapshot: Snapshot): HistoryNavigation {
  const record = findRecord(snapshot, navigationKey);
  if (!record || record.deleted)
    reject('corrupt-record', 'history', 'History navigation is missing');
  const navigation = readShape(navigationSchema, record.value, 'corrupt-record', storedLimits);
  validateNavigation(navigation, snapshot);
  return navigation;
}
/** Cursor bounds and complete frontier coverage are storage invariants, not caller choices. */
function validateNavigation(navigation: HistoryNavigation, snapshot: Snapshot): void {
  if (navigation.cursor > navigation.actions.length)
    reject('corrupt-record', 'history', 'History cursor is out of bounds');
  if (new Set(navigation.actions).size !== navigation.actions.length)
    reject('corrupt-record', 'history', 'History repeats an action');
  validateFrontier(navigation, snapshot);
  navigation.actions.forEach((id, index) =>
    validateAction(snapshot, id, index < navigation.cursor),
  );
}
function validateAction(snapshot: Snapshot, id: RequestId, active: boolean): void {
  const transaction = readTransaction(snapshot, id);
  const head = readHead(snapshot, id);
  if (head.state !== expectedState(active))
    reject('corrupt-record', 'history', 'History state disagrees with its cursor');
  uniqueKeys(
    transaction.transitions.map((item) => item.key),
    'history.transitions',
  );
  uniqueKeys(
    head.participants.map((item) => item.key),
    'history.participants',
  );
  const expected = transaction.transitions.map((item) => keyText(item.key)).sort();
  const actual = head.participants.map((item) => keyText(item.key)).sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual))
    reject('corrupt-record', 'history', 'History participant coverage differs');
  transaction.transitions.forEach((item) => validateImages(item.key, [item.before, item.after]));
}
function expectedState(active: boolean): 'active' | 'undone' {
  return active ? 'active' : 'undone';
}
function validateFrontier(navigation: HistoryNavigation, snapshot: Snapshot): void {
  uniqueKeys(
    navigation.frontier.map((item) => item.key),
    'history.frontier',
  );
  const current = snapshot.records
    .filter((item) => item.key.kind !== 'history')
    .map((item) => keyText(item.key))
    .sort();
  const frontier = navigation.frontier.map((item) => keyText(item.key)).sort();
  if (JSON.stringify(current) !== JSON.stringify(frontier))
    reject('corrupt-record', 'history', 'History frontier coverage is incomplete');
  compareVersions(snapshot, navigation.frontier);
}
/** Selection is pure; inverse admission checks current record versions. */
export function nextAction(
  history: HistoryNavigation,
  direction: 'undo' | 'redo',
): RequestId | null {
  const index = direction === 'undo' ? history.cursor - 1 : history.cursor;
  return history.actions[index] ?? null;
}
/** Fresh edits truncate the redo branch; retention purges its records in the same commit. */
export function advance(
  history: HistoryNavigation,
  request: Request,
  versions: readonly ReadVersion[],
): HistoryNavigation {
  const frontier = new Map(history.frontier.map((item) => [keyText(item.key), item]));
  versions.forEach((item) => frontier.set(keyText(item.key), item));
  const actions =
    request.intent.kind === 'change'
      ? [...history.actions.slice(0, history.cursor), request.request]
      : history.actions;
  const cursor = request.intent.kind === 'undo' ? history.cursor - 1 : history.cursor + 1;
  return { ...history, actions, cursor, frontier: [...frontier.values()] };
}
function action(
  snapshot: Snapshot,
  history: HistoryNavigation,
  direction: 'undo' | 'redo',
): HistoryAction | null {
  const id = nextAction(history, direction);
  if (id === null) return null;
  const transaction = readTransaction(snapshot, id);
  const scope = transaction.transitions.map((item) => item.key);
  const collections = scope.filter((key) => key.kind === 'collection').map((key) => key.id);
  return {
    transaction: id,
    label: transaction.label ?? 'Edit workspace',
    actor: transaction.actor,
    collections,
    scope,
    expected: [...scope.map((key) => versionOf(snapshot, key)), versionOf(snapshot, navigationKey)],
  };
}
/** Both targets and their preconditions come from the same checked snapshot. */
export function historyStatus(snapshot: Snapshot): HistoryStatus {
  const history = readNavigation(snapshot);
  return readShape(
    historyStatusSchema,
    {
      workspace: snapshot.workspace,
      navigationVersion: versionOf(snapshot, navigationKey),
      undo: action(snapshot, history, 'undo'),
      redo: action(snapshot, history, 'redo'),
    },
    'corrupt-record',
    storedLimits,
  );
}

/** Retained images must identify their declared participant before history is exposed. */
function validateImages(
  key: RecordKey,
  images: readonly (import('../../contract/records/storage.js').StoredRecord | null)[],
): void {
  const wrong = images.some((image) => image !== null && keyText(image.key) !== keyText(key));
  if (wrong) reject('corrupt-record', 'history', 'Retained image belongs to another participant');
}
/** Prepared hashes include navigation so intervening edits cannot silently change branching decisions. */
export function navigationDependencies(snapshot: Snapshot): readonly ReadVersion[] {
  return [versionOf(snapshot, navigationKey)];
}
