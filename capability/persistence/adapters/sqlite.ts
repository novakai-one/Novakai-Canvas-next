import { fail } from '../contract/errors.js';
import type { Result } from '../contract/errors.js';
import type { WorkspaceId } from '../contract/brands.js';
import type { DatabasePort } from '../contract/ports/database.js';
import type { StorePort, Decision } from '../contract/ports/store.js';
/** Only an actually absent singleton creates a pristine envelope; malformed content never resets. */
function decodeStored(serialized: unknown, workspace: WorkspaceId): unknown {
  if (serialized === undefined)
    return { schemaVersion: 1, workspace, sequence: 0, slots: [], receipts: [] };
  if (typeof serialized === 'string') return JSON.parse(serialized);
  return serialized;
}
/** Decode errors retain a corrupt-record outcome; caller rolls back without replacing the row. */
function readDecision<T>(
  database: DatabasePort,
  workspace: WorkspaceId,
  decide: (raw: unknown) => Result<Decision<T>>,
): Result<Decision<T>> {
  const stored = database.read();
  try {
    return decide(decodeStored(stored, workspace));
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
function installDecision<T>(database: DatabasePort, decision: Result<Decision<T>>): Result<T> {
  if (!decision.ok) return rollback(database, decision);
  database.write(JSON.stringify(decision.value.state));
  database.exec('COMMIT');
  return { ok: true, value: decision.value.value };
}
/** BEGIN IMMEDIATE serializes receipt lookup and version checks with writes across connections. */
function transact<T>(
  database: DatabasePort,
  workspace: WorkspaceId,
  decide: (raw: unknown) => Result<Decision<T>>,
): Result<T> {
  try {
    database.exec('BEGIN IMMEDIATE');
    return installDecision(database, readDecision(database, workspace, decide));
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
  return {
    transact: (decide) => transact(database, workspace, decide),
    close: () => closeDatabase(database),
  };
}
