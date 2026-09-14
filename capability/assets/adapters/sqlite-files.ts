import { digest } from '../contract/brands.js';
import type { Digest } from '../contract/brands.js';
import { fail, StorageFault } from '../contract/errors.js';
import type { Result } from '../contract/errors.js';
import type { AssetStorage, AssetTransaction } from '../contract/ports/storage.js';
import type { AssetDatabase, BlobFiles, AssetStatement } from '../contract/ports/native.js';
import type { StoredBlob } from '../contract/records/media.js';
interface Statements {
  readonly read: Pick<AssetStatement, 'get'>;
  readonly write: Pick<AssetStatement, 'run'>;
  readonly remove: Pick<AssetStatement, 'run'>;
  readonly list: Pick<AssetStatement, 'all'>;
}
/** Prepared singleton metadata access; unsafe/native rows are never asserted into domain types. */
function statements(database: AssetDatabase): Statements {
  return {
    read: database.prepare('SELECT value FROM asset_metadata WHERE key=?'),
    write: database.prepare(
      'INSERT INTO asset_metadata(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
    ),
    remove: database.prepare('DELETE FROM asset_metadata WHERE key=?'),
    list: database.prepare('SELECT key,value FROM asset_metadata WHERE key LIKE ? ORDER BY key'),
  };
}
/** Strict typed metadata decoder; missing keys and malformed JSON are different outcomes. */
function readMetadata(key: string, read: Pick<AssetStatement, 'get'>): unknown | null {
  const row = read.get(key);
  if (!row) return null;
  return decodeValue(row.value);
}
/** Metadata corruption never causes an automatic reset or a plausible empty value. */
function decodeValue(value: unknown): unknown {
  if (typeof value !== 'string')
    throw new StorageFault('corrupt-asset', 'metadata', 'Expected encoded metadata');
  try {
    return JSON.parse(value);
  } catch {
    throw new StorageFault('corrupt-asset', 'metadata', 'Malformed stored JSON');
  }
}
/** Absent physical bytes are reported as missing even if their descriptor survived a crash. */
function readBlob(
  id: Digest,
  read: Pick<AssetStatement, 'get'>,
  files: Pick<BlobFiles, 'read'>,
): unknown | null {
  const descriptor = readMetadata(`blob:${id}`, read);
  if (descriptor === null) return null;
  const base64 = files.read(id);
  if (base64 === null) return null;
  return { descriptor, base64 };
}
/** Immutable files become durable first; a failed metadata commit may leave only safe orphan bytes. */
function writeBlob(
  blob: StoredBlob,
  write: Pick<AssetStatement, 'run'>,
  files: Pick<BlobFiles, 'write'>,
): void {
  files.write(blob.descriptor.digest, blob.base64);
  write.run(`blob:${blob.descriptor.digest}`, JSON.stringify(blob.descriptor));
}
/** Metadata rows and orphan files both participate in explicit collection recovery. */
function blobIds(
  list: Pick<AssetStatement, 'all'>,
  files: Pick<BlobFiles, 'list'>,
): readonly Digest[] {
  const rows = list.all('blob:%');
  const recorded = rows.map((row) => readDigestKey(row.key));
  return [...new Set([...recorded, ...files.list()])].sort();
}
/** Never permit arbitrary metadata keys to become filesystem path segments. */
function readDigestKey(key: unknown): Digest {
  if (typeof key !== 'string')
    throw new StorageFault('corrupt-asset', 'key', 'Invalid blob metadata identity');
  return digest.parse(key.slice(5));
}
/** View methods exist only inside the store's synchronous maintenance transaction. */
function createView(prepared: Statements, files: BlobFiles): AssetTransaction {
  return {
    readBlob: (id) => readBlob(id, prepared.read, files),
    writeBlob: (blob) => writeBlob(blob, prepared.write, files),
    listBlobs: () => blobIds(prepared.list, files),
    deleteBlob: (id) => {
      files.remove(id);
      prepared.remove.run(`blob:${id}`);
    },
    readLease: (id) => readMetadata(`lease:${id}`, prepared.read),
    writeLease: (lease) => {
      prepared.write.run(`lease:${lease.id}`, JSON.stringify(lease));
    },
    listLeases: () => prepared.list.all('lease:%').map((row) => decodeValue(row.value)),
    deleteLease: (id) => {
      prepared.remove.run(`lease:${id}`);
    },
  };
}
/** Storage vocabulary preserves known corruption; unexpected native failure requires re-read before retry. */
function failed<T>(error: unknown): Result<T> {
  if (error instanceof StorageFault) return fail(error.code, error.path, error.message);
  return fail('storage-unavailable', '$', 'Asset storage operation could not be confirmed');
}
/** Rollback cannot resurrect deleted unreferenced files; report uncertainty rather than partial success. */
function rollback<T>(database: AssetDatabase, outcome: Result<T>): Result<T> {
  try {
    database.exec('ROLLBACK');
    return outcome;
  } catch {
    return fail(
      'storage-unavailable',
      '$',
      'Metadata rollback unconfirmed; re-read files and leases',
    );
  }
}
/** Successful metadata changes commit together; unsuccessful callback rolls metadata back. */
function settle<T>(database: AssetDatabase, result: Result<T>): Result<T> {
  if (!result.ok) return rollback(database, result);
  database.exec('COMMIT');
  return result;
}
/** BEGIN IMMEDIATE serializes acquisition, final reserved stage and collection across local connections. */
function transact<T>(
  database: AssetDatabase,
  view: AssetTransaction,
  action: (view: AssetTransaction) => Result<T>,
): Result<T> {
  try {
    database.exec('BEGIN IMMEDIATE');
    return settle(database, action(view));
  } catch (error) {
    return rollback(database, failed(error));
  }
}
/** Explicit close boundary; subsequent operations fail through the declared storage result. */
function close(database: AssetDatabase): Result<void> {
  try {
    database.close();
    return { ok: true, value: undefined };
  } catch (error) {
    return failed(error);
  }
}
/** Create a header only with a genuinely new metadata table; existing damaged stores are never repaired silently. */
function createSchema(database: AssetDatabase): void {
  const lookup = database.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='asset_metadata'",
  );
  if (lookup.get()) return;
  database.exec('CREATE TABLE asset_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  const insert = database.prepare('INSERT INTO asset_metadata(key,value) VALUES(?,?)');
  insert.run('schema', '1');
}
/** Serialize first-open creation and require the existing exact version before accepting this database. */
function initialize(database: AssetDatabase): Statements {
  database.exec(
    'PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000; BEGIN IMMEDIATE',
  );
  createSchema(database);
  const prepared = statements(database);
  if (readMetadata('schema', prepared.read) !== 1)
    throw new StorageFault('corrupt-asset', 'schema', 'Unsupported asset metadata schema');
  database.exec('COMMIT');
  return prepared;
}
/** Concrete durable store behind Assets' owned port; no Model/Persistence imports or canonical bindings. */
export function createSqliteFiles(database: AssetDatabase, files: BlobFiles): Result<AssetStorage> {
  try {
    const prepared = initialize(database);
    const view = createView(prepared, files);
    return {
      ok: true,
      value: {
        transact: (action) => transact(database, view, action),
        close: () => close(database),
      },
    };
  } catch (error) {
    close(database);
    return failed(error);
  }
}
