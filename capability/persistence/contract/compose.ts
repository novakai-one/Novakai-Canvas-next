import { DatabaseSync } from 'node:sqlite';
import { createSqliteStore } from '../adapters/sqlite.js';
import { createPersistence } from './api.js';
import { workspaceId } from './brands.js';
import { fail } from './errors.js';
import type { Result } from './errors.js';
import type { DatabasePort } from './ports/database.js';
import type { Persistence } from './types.js';
/** Minimal native-driver seam permits composition failure tests without ambient filesystem access. */
interface NativeDatabase {
  exec(sql: string): void;
  prepare(sql: string): {
    get(...values: string[]): Readonly<Record<string, unknown>> | undefined;
    run(...values: string[]): unknown;
  };
  close(): void;
}
/** Prepare bound statements once; SQLite owns WAL/FULL recovery, never handwritten filesystem journaling. */
function createDriver(database: NativeDatabase): DatabasePort {
  database.exec(
    'PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS canvas_state (singleton INTEGER PRIMARY KEY CHECK(singleton=1), payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS canvas_part (id TEXT PRIMARY KEY, body TEXT NOT NULL)',
  );
  const read = database.prepare('SELECT payload FROM canvas_state WHERE singleton=1');
  const write = database.prepare(
    'INSERT INTO canvas_state(singleton,payload) VALUES(1,?) ON CONFLICT(singleton) DO UPDATE SET payload=excluded.payload',
  );
  const dataVersion = database.prepare('PRAGMA data_version');
  const getPart = database.prepare('SELECT body FROM canvas_part WHERE id=?');
  const putPart = database.prepare('INSERT OR REPLACE INTO canvas_part(id,body) VALUES(?,?)');
  const removePart = database.prepare('DELETE FROM canvas_part WHERE id=?');
  return {
    exec: (sql) => database.exec(sql),
    read: () => read.get()?.payload,
    version: () => dataVersion.get()?.data_version,
    write: (serialized) => {
      write.run(serialized);
    },
    parts: {
      get: (id) => {
        const body = getPart.get(id)?.body;
        return typeof body === 'string' ? body : undefined;
      },
      put: (id, body) => {
        putPart.run(id, body);
      },
      remove: (id) => {
        removePart.run(id);
      },
    },
    close: () => database.close(),
  };
}
/** Close a partially opened database on setup failure; a cleanup failure is still a typed open failure. */
function initialize(database: NativeDatabase, workspace: unknown): Result<Persistence> {
  try {
    return initializeChecked(database, workspace);
  } catch {
    return closeFailedOpen(database);
  }
}
/** Failed initialization leaves ownership with the opener, never an unreachable live connection. */
function closeFailedOpen(database: NativeDatabase): Result<Persistence> {
  try {
    database.close();
  } catch {
    return fail('storage-unavailable', '$', 'Database initialization and cleanup failed');
  }
  return fail('storage-unavailable', '$', 'Database initialization failed');
}
/** Verify workspace identity and stored integrity before exposing the service. */
function initializeChecked(database: NativeDatabase, workspace: unknown): Result<Persistence> {
  const identity = workspaceId.safeParse(workspace);
  if (!identity.success) {
    database.close();
    return fail('invalid-input', 'workspace', 'Invalid workspace identity');
  }
  const persistence = createPersistence(
    createSqliteStore(createDriver(database), identity.data),
    identity.data,
  );
  const checked = persistence.readSnapshot();
  if (!checked.ok) {
    persistence.close();
    return checked;
  }
  return { ok: true, value: persistence };
}
/** Node24.13+ composition. Host supplies location; ':memory:' explicitly selects ephemeral storage. */
export function openSqlite(
  location: string,
  workspace: unknown,
  openDatabase: (location: string) => NativeDatabase = (location) => new DatabaseSync(location),
): Result<Persistence> {
  try {
    return initialize(openDatabase(location), workspace);
  } catch {
    return fail(
      'storage-unavailable',
      '$',
      'Database could not be opened; retain original location',
    );
  }
}
