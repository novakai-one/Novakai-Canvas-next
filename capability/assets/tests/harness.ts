import type {
  BlobFiles,
  Result,
  AssetStorage,
  IdentityPort,
  MediaRegistry,
} from '../contract/index.js';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { onTestFinished } from 'vitest';
import { createAssets } from '../contract/index.js';
import type { Assets, AssetDependencies, Digest, AssetDatabase } from '../contract/index.js';
import { createSqliteFiles } from '../adapters/sqlite-files.js';
import { createBlobFiles } from '../adapters/files.js';
import { createIdentity } from '../adapters/identity.js';
import { createRaster } from '../adapters/raster.js';
import { createSvg } from '../adapters/svg.js';
import { createFont } from '../adapters/font.js';
import { detectMedia } from '../adapters/detect.js';
import { value } from './fixtures.js';

/** The native pieces a harness is built from and the file operations tests use to damage it. */
interface NativeFixture {
  files(root: string): BlobFiles;
  storage(database: AssetDatabase, files: BlobFiles): Result<AssetStorage>;
  identity(): IdentityPort;
  media(): MediaRegistry;
  directory(): string;
  remove(root: string): void;
  database(path: string): AssetDatabase;
  read(path: URL): string;
  corrupt(path: string): void;
  unlink(path: string): void;
}

/** A real Assets instance in its own temporary directory, plus ways to damage its storage. */
interface AssetHarness {
  /** The facade over real SQLite storage, blob files, hasher and media processors. */
  readonly assets: Assets;
  /** The dependencies `assets` was built from, for building variants. */
  readonly deps: AssetDependencies;
  /** The temporary directory. */
  readonly root: string;
  /** Reads the bundled Inter WOFF2 font as base64. */
  font(): string;
  /** Overwrites a blob's file with other bytes. */
  corrupt(id: Digest): void;
  /** Deletes a blob's file. */
  unlink(id: Digest): void;
  /** Deletes the metadata schema row, through a separate connection. */
  removeSchema(): void;
}

/**
 * Builds a real Assets instance in a new temporary directory: blob files at `root/blobs` and the
 * database at `root/assets.sqlite`. When the test finishes, storage is closed and the directory
 * removed.
 *
 * @param io - The native pieces. Defaults to the real adapters and `node:fs`.
 * @returns The harness.
 * @throws When opening storage fails (the `value` assertion fails first).
 */
export function harness(io: NativeFixture = native): AssetHarness {
  const root = io.directory();
  onTestFinished(() => io.remove(root));
  const files = io.files(join(root, 'blobs'));
  const storage = value(io.storage(io.database(join(root, 'assets.sqlite')), files));
  onTestFinished(() => {
    storage.close();
  });
  const deps: AssetDependencies = {
    storage,
    identity: io.identity(),
    media: io.media(),
  };
  return {
    assets: createAssets(deps),
    deps,
    root,
    font: () =>
      io.read(new URL('../../../resources/fonts/inter-latin-400-normal.woff2', import.meta.url)),
    corrupt: (id) => io.corrupt(join(root, 'blobs', `${id}.blob`)),
    unlink: (id) => io.unlink(join(root, 'blobs', `${id}.blob`)),
    removeSchema: () => removeSchema(io.database(join(root, 'assets.sqlite'))),
  };
}

/** The real adapters and `node:fs` operations. */
const native: NativeFixture = {
  files: createBlobFiles,
  storage: createSqliteFiles,
  identity: createIdentity,
  media: () => ({ handlers: [createRaster(), createSvg(), createFont()], detect: detectMedia }),
  directory: () => mkdtempSync(join(tmpdir(), 'canvas-assets-')),
  remove: (root) => rmSync(root, { recursive: true, force: true }),
  database: (path) => new DatabaseSync(path),
  read: (path) => readFileSync(path).toString('base64'),
  corrupt: (path) => writeFileSync(path, 'corrupt bytes'),
  unlink: unlinkSync,
};

/** Deletes the schema row; the connection is closed even when that fails. */
function removeSchema(database: AssetDatabase): void {
  try {
    database.exec("DELETE FROM asset_metadata WHERE key='schema'");
  } finally {
    database.close();
  }
}
