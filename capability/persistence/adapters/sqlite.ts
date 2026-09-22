import { fail } from '../contract/errors.js';
import type { Result } from '../contract/errors.js';
import type { WorkspaceId } from '../contract/brands.js';
import { randomUUID } from 'node:crypto';
import type { DatabasePort, PartsPort } from '../contract/ports/database.js';
import type { StorePort, Decision } from '../contract/ports/store.js';
/** Last stored text and its parsed object: unchanged text returns the same object, so callers can cache on it. */
interface Decoded {
  text: string | null;
  value: unknown;
  version: unknown;
  /** Item rows in the current head: id → parsed item and its stored text. */
  items: Map<string, Item>;
  /** Items already stored, by object identity, so a commit skips re-serializing them. */
  ids: WeakMap<object, string>;
}
interface Item {
  readonly value: unknown;
  readonly body: string;
}
/** Head key listing which top-level arrays are stored as item rows. */
const PARTS = '$parts';
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/** Only an actually absent singleton creates a pristine envelope; malformed content never resets. */
function decodeStored(
  serialized: unknown,
  workspace: WorkspaceId,
  last: Decoded,
  parts: PartsPort | undefined,
): unknown {
  if (serialized === undefined)
    return { schemaVersion: 1, workspace, sequence: 0, slots: [], receipts: [] };
  if (typeof serialized !== 'string') return serialized;
  if (serialized === last.text) return last.value;
  const parsed: unknown = JSON.parse(serialized);
  const value = isRecord(parsed) && PARTS in parsed ? assemble(parsed, last, parts) : parsed;
  Object.assign(last, { text: serialized, value });
  return value;
}
/** Rebuild the envelope from its head; unchanged ids reuse the items parsed last time. */
function assemble(
  head: Record<string, unknown>,
  last: Decoded,
  parts: PartsPort | undefined,
): unknown {
  const keys = head[PARTS];
  if (parts === undefined || !Array.isArray(keys)) throw new Error('item rows unavailable');
  const items = new Map<string, Item>();
  const out: Record<string, unknown> = { ...head };
  delete out[PARTS];
  for (const key of keys) {
    const ids = typeof key === 'string' ? head[key] : undefined;
    if (!Array.isArray(ids)) throw new Error('item ids malformed');
    out[key as string] = ids.map((id) => {
      if (typeof id !== 'string') throw new Error('item id malformed');
      const item = last.items.get(id) ?? load(parts, id);
      items.set(id, item);
      if (typeof item.value === 'object' && item.value !== null) last.ids.set(item.value, id);
      return item.value;
    });
  }
  last.items = items;
  return out;
}
function load(parts: PartsPort, id: string): Item {
  const body = parts.get(id);
  if (body === undefined) throw new Error('item row missing');
  return { value: JSON.parse(body) as unknown, body };
}
/** Head text plus the items it lists; only items not stored before are written. */
function encode(
  state: unknown,
  last: Decoded,
  parts: PartsPort | undefined,
): { text: string; items: Map<string, Item> } {
  if (parts === undefined || !isRecord(state))
    return { text: JSON.stringify(state), items: new Map() };
  const items = new Map<string, Item>();
  let byBody: Map<string, string> | null = null;
  const find = (item: object): string => {
    const known = last.ids.get(item);
    if (known !== undefined && last.items.has(known)) {
      items.set(known, last.items.get(known) as Item);
      return known;
    }
    const body = JSON.stringify(item);
    byBody ??= new Map([...last.items].map(([id, stored]) => [stored.body, id]));
    const same = byBody.get(body);
    const id = same ?? randomUUID();
    if (same === undefined) parts.put(id, body);
    items.set(id, { value: item, body });
    last.ids.set(item, id);
    return id;
  };
  const head: Record<string, unknown> = {};
  const keys: string[] = [];
  for (const [key, value] of Object.entries(state)) {
    const stored =
      Array.isArray(value) && value.every((item) => typeof item === 'object' && item !== null);
    if (stored) keys.push(key);
    head[key] = stored ? (value as object[]).map(find) : value;
  }
  head[PARTS] = keys;
  for (const id of last.items.keys()) if (!items.has(id)) parts.remove(id);
  return { text: JSON.stringify(head), items };
}
/** Decode errors retain a corrupt-record outcome; caller rolls back without replacing the row. */
function readDecision<T>(
  database: DatabasePort,
  workspace: WorkspaceId,
  last: Decoded,
  decide: (raw: unknown) => Result<Decision<T>>,
): Result<Decision<T>> {
  // No other connection has committed since our last read or write: the text we hold is current.
  const version = database.version?.();
  const current = last.text !== null && version !== undefined && version === last.version;
  const stored = current ? last.text : database.read();
  last.version = version;
  try {
    return decide(decodeStored(stored, workspace, last, database.parts));
  } catch {
    return fail('corrupt-record', '$', 'Stored envelope cannot be decoded safely');
  }
}
/** Rollback failures are uncertain storage failures; Authoring reconciles receipt after reopen. */
function rollback<T>(database: DatabasePort, result: Result<T>): Result<T> {
  try {
    database.exec('ROLLBACK');
    return result;
  } catch {
    return fail(
      'storage-unavailable',
      '$',
      'Rollback could not be confirmed; reopen and reconcile',
    );
  }
}
/** Store only complete successful decisions, including receipts, within the active SQLite transaction. */
function installDecision<T>(
  database: DatabasePort,
  last: Decoded,
  decision: Result<Decision<T>>,
): Result<T> {
  if (!decision.ok) return rollback(database, decision);
  // Reads hand back the state they read: nothing to write.
  if (decision.value.state === last.value) {
    database.exec('COMMIT');
    return { ok: true, value: decision.value.value };
  }
  const { text, items } = encode(decision.value.state, last, database.parts);
  database.write(text);
  database.exec('COMMIT');
  Object.assign(last, { text, value: decision.value.state, items });
  return { ok: true, value: decision.value.value };
}
/** BEGIN IMMEDIATE serializes receipt lookup and version checks with writes across connections. */
function transact<T>(
  database: DatabasePort,
  workspace: WorkspaceId,
  last: Decoded,
  decide: (raw: unknown) => Result<Decision<T>>,
): Result<T> {
  try {
    database.exec('BEGIN IMMEDIATE');
    return installDecision(database, last, readDecision(database, workspace, last, decide));
  } catch {
    return rollback(
      database,
      fail('storage-unavailable', '$', 'Transaction outcome requires receipt reconciliation'),
    );
  }
}
/** Closing is explicit; subsequent driver operations become typed storage-unavailable failures. */
function closeDatabase(database: DatabasePort): Result<void> {
  try {
    database.close();
    return { ok: true, value: undefined };
  } catch {
    return fail('storage-unavailable', '$', 'Database close failed; reopen before retry');
  }
}
/** Concrete SQL adapter behind the consumer-owned transaction seam; no semantic document policy. */
export function createSqliteStore(database: DatabasePort, workspace: WorkspaceId): StorePort {
  const last: Decoded = {
    text: null,
    value: undefined,
    version: undefined,
    items: new Map(),
    ids: new WeakMap(),
  };
  return {
    transact: (decide) => transact(database, workspace, last, decide),
    close: () => closeDatabase(database),
  };
}
