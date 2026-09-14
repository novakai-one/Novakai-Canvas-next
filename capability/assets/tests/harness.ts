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
/** Isolated native fixture with injected setup/corruption factories; Vitest owns setup/assertion failure and final cleanup. */
export function harness(io: NativeFixture = native): {
  readonly assets: Assets;
  readonly deps: AssetDependencies;
  readonly root: string;
  font(): string;
  corrupt(id: Digest): void;
  unlink(id: Digest): void;
  removeSchema(): void;
} {
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

/** Corrupt the owned header explicitly; the native database is closed even if the fixture mutation fails. */
function removeSchema(database: AssetDatabase): void {
  try {
    database.exec("DELETE FROM asset_metadata WHERE key='schema'");
  } finally {
    database.close();
  }
}
