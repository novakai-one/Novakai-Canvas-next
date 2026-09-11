import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { onTestFinished } from 'vitest';
import { openSqlite, createPersistence } from '../contract/index.js';
import type { Result, Persistence, DatabasePort } from '../contract/index.js';
import { createSqliteStore } from '../adapters/sqlite.js';
import { workspace, pristine, value } from './fixtures.js';

interface FileEnvironment {
  createDirectory(): string;
  removeDirectory(directory: string): void;
}
interface TestDatabase {
  exec(sql: string): void;
  prepare(sql: string): {
    get(): Readonly<Record<string, unknown>> | undefined;
    run(value: string): unknown;
  };
  close(): void;
}
type Fault = 'read' | 'write' | 'commit' | 'after-commit' | 'none';
const files: FileEnvironment = {
  createDirectory: () => mkdtempSync(join(tmpdir(), 'canvas-persistence-')),
  removeDirectory: (directory) => rmSync(directory, { recursive: true, force: true }),
};
/** Isolated storage lifetime. File/service factories are injectable; Vitest owns setup/assertion failures and final cleanup. */
export function harness(
  mode: 'memory' | 'file',
  environment: FileEnvironment = files,
  open: typeof openSqlite = openSqlite,
): { persistence: Persistence; location: string; remove(): void } {
  const directory = environment.createDirectory();
  onTestFinished(() => environment.removeDirectory(directory));
  const location = mode === 'memory' ? ':memory:' : join(directory, 'workspace.sqlite');
  const persistence = value(open(location, workspace));
  onTestFinished(() => {
    persistence.close();
  });
  return { persistence, location, remove: () => environment.removeDirectory(directory) };
}
/** Real SQL fixture with injected creation and fault policy; adapter consumes deliberate driver throws. Vitest owns setup and cleanup. */
export function faultStore(
  fault: Fault,
  raw: unknown = pristine(),
  open: () => TestDatabase = () => new DatabaseSync(':memory:'),
): { persistence: Persistence; inspect(): unknown; close(): void } {
  const database = open();
  onTestFinished(() => {
    closeFixture(database);
  });
  const driver = initializeDriver(database, raw);
  const faulted: DatabasePort = {
    exec: (sql) => executeFault(driver, fault, sql),
    read: () => failAt(fault, 'read', driver.read),
    write: (serialized) => {
      failAt(fault, 'write', () => driver.write(serialized));
    },
    close: driver.close,
  };
  return {
    persistence: createPersistence(createSqliteStore(faulted, workspace), workspace),
    inspect: () => JSON.parse(String(driver.read())),
    close: driver.close,
  };
}
/** Prepared statements are named direct collaborators, avoiding chained statement navigation. Vitest handles setup errors. */
function initializeDriver(database: TestDatabase, raw: unknown): DatabasePort {
  database.exec('CREATE TABLE data(payload TEXT)');
  const initialize = database.prepare('INSERT INTO data VALUES(?)');
  initialize.run(JSON.stringify(raw));
  const read = database.prepare('SELECT payload FROM data');
  const write = database.prepare('UPDATE data SET payload=?');
  return {
    exec: (sql) => database.exec(sql),
    read: () => read.get()?.payload,
    write: (serialized) => {
      write.run(serialized);
    },
    close: () => database.close(),
  };
}
/** Close may already have been exercised by a test; cleanup still runs after failed assertions. */
function closeFixture(database: TestDatabase): Result<void> {
  try {
    database.close();
    return { ok: true, value: undefined };
  } catch {
    return {
      ok: false,
      error: {
        code: 'storage-unavailable',
        path: 'fixture',
        message: 'Already closed or cleanup failed',
        recovery: 'Vitest releases the isolated temporary location',
      },
    };
  }
}
/** Fault policy preserves the actual driver effect ordering, including acknowledgement loss after COMMIT. */
function executeFault(driver: DatabasePort, fault: Fault, sql: string): void {
  if (sql !== 'COMMIT') {
    driver.exec(sql);
    return;
  }
  failAt(fault, 'commit', () => driver.exec(sql));
  failAt(fault, 'after-commit', () => undefined);
}
/** The SQLite adapter owns deliberate native-driver exception recovery; no application callback receives this throw. */
function failAt<T>(actual: Fault, target: Fault, action: () => T): T {
  if (actual === target) throw new Error('Injected driver failure');
  return action();
}
