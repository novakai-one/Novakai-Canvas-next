import {
  readFileSync,
  openSync,
  writeFileSync,
  fsyncSync,
  closeSync,
  linkSync,
  unlinkSync,
  readdirSync,
  mkdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { digest } from '../contract/brands.js';
import type { Digest } from '../contract/brands.js';
import { StorageFault } from '../contract/errors.js';
import type { BlobFiles } from '../contract/ports/native.js';
interface FileSystem {
  read(path: string): string;
  open(path: string): number;
  write(handle: number, encoded: string): void;
  flush(handle: number): void;
  close(handle: number): void;
  publish(source: string, target: string): void;
  remove(path: string): void;
  list(path: string): readonly string[];
  directory(path: string): void;
  flushDirectory(path: string): void;
}
const native: FileSystem = {
  read: (path) => readFileSync(path).toString('base64'),
  open: (path) => openSync(path, 'wx', 0o600),
  write: (handle, encoded) => writeFileSync(handle, Buffer.from(encoded, 'base64')),
  flush: fsyncSync,
  close: closeSync,
  publish: linkSync,
  remove: unlinkSync,
  list: (path) => readdirSync(path),
  directory: (path) => {
    mkdirSync(path, { recursive: true });
  },
  flushDirectory: (path) => {
    const handle = openSync(path, 'r');
    try {
      fsyncSync(handle);
    } finally {
      closeSync(handle);
    }
  },
};
/** Missing files are explicit null; permission/disk failures remain native errors for the store boundary. */
function readFile(path: string, io: Pick<FileSystem, 'read'>): string | null {
  try {
    return io.read(path);
  } catch (error) {
    return missingOrThrow(error);
  }
}
/** Structured native codes distinguish expected absence/collision without parsing messages. */
function hasCode(error: unknown, code: string): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return 'code' in error && error.code === code;
}
/** Immutable identity means an existing path can be reused only for byte-identical content. */
function requireSame(previous: string | null, encoded: string): void {
  if (previous !== encoded)
    throw new StorageFault(
      'corrupt-asset',
      'digest',
      'Existing content-addressed file differs from submitted bytes',
    );
}
/** Temporary content is flushed and closed before its directory entry becomes authoritative. */
function writeTemporary(
  path: string,
  encoded: string,
  io: Pick<FileSystem, 'open' | 'write' | 'flush' | 'close'>,
): void {
  const handle = io.open(path);
  try {
    io.write(handle, encoded);
    io.flush(handle);
  } finally {
    io.close(handle);
  }
}
/** Cleanup is idempotent so failed publication and a later GC pass can share the same operation. */
function removeFile(path: string, io: Pick<FileSystem, 'remove'>): void {
  try {
    io.remove(path);
  } catch (error) {
    ignoreMissing(error);
  }
}
/** Atomic no-replace publication avoids overwriting an already admitted file under a digest. */
function publishFile(
  temporary: string,
  destination: string,
  encoded: string,
  io: Pick<FileSystem, 'publish' | 'read'>,
): void {
  try {
    io.publish(temporary, destination);
  } catch (error) {
    resolveCollision(error, destination, encoded, io);
  }
}
/** File and directory fsync finish before the caller's SQLite metadata transaction may commit. */
function persistFile(
  root: string,
  destination: string,
  encoded: string,
  io: FileSystem,
  nonce: () => string,
): void {
  const temporary = `${destination}.${nonce()}.tmp`;
  try {
    writeTemporary(temporary, encoded, io);
    publishFile(temporary, destination, encoded, io);
    io.flushDirectory(root);
  } finally {
    removeFile(temporary, io);
  }
}
/** Existing bytes are verified even after a previous metadata rollback left an orphan content file. */
function writeFile(
  root: string,
  id: Digest,
  encoded: string,
  io: FileSystem,
  nonce: () => string,
): void {
  const destination = join(root, `${id}.blob`);
  const previous = readFile(destination, io);
  if (previous !== null) {
    requireSame(previous, encoded);
    return;
  }
  persistFile(root, destination, encoded, io, nonce);
}
/** Only our strict temporary filename grammar is collected, while the caller holds maintenance serialization. */
function cleanupTemporary(
  root: string,
  names: readonly string[],
  io: Pick<FileSystem, 'remove'>,
): void {
  names
    .filter((name) => /^[a-f0-9]{64}\.blob\.[a-f0-9-]{36}\.tmp$/.test(name))
    .forEach((name) => removeFile(join(root, name), io));
}
/** List only owned digest files; unknown user filenames are never deletion candidates. */
function listFiles(root: string, io: Pick<FileSystem, 'list' | 'remove'>): readonly Digest[] {
  const names = io.list(root);
  cleanupTemporary(root, names, io);
  return names
    .filter((name) => /^[a-f0-9]{64}\.blob$/.test(name))
    .map((name) => digest.parse(name.slice(0, -5)));
}
/** Create the physical file adapter with injectable IO. AssetStorage catches all supported IO failures. */
export function createBlobFiles(
  root: string,
  io: FileSystem = native,
  nonce: () => string = randomUUID,
): BlobFiles {
  io.directory(root);
  return {
    read: (id) => readFile(join(root, `${id}.blob`), io),
    write: (id, encoded) => writeFile(root, id, encoded, io, nonce),
    remove: (id) => removeFile(join(root, `${id}.blob`), io),
    list: () => listFiles(root, io),
  };
}

/** Expected absence remains distinct from permissions and other native failures. */
function missingOrThrow(error: unknown): null {
  if (hasCode(error, 'ENOENT')) return null;
  throw error;
}
/** Idempotent cleanup ignores only already-missing files, not other failures. */
function ignoreMissing(error: unknown): void {
  if (!hasCode(error, 'ENOENT')) throw error;
}
/** A publication race may reuse identical content; unrelated native errors propagate to the store boundary. */
function resolveCollision(
  error: unknown,
  destination: string,
  encoded: string,
  io: Pick<FileSystem, 'read'>,
): void {
  if (!hasCode(error, 'EEXIST')) throw error;
  requireSame(readFile(destination, io), encoded);
}
