import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { createBlobFiles } from '../adapters/files.js';
import { createSqliteFiles } from '../adapters/sqlite-files.js';
import { createIdentity } from '../adapters/identity.js';
import { createRaster } from '../adapters/raster.js';
import { createSvg } from '../adapters/svg.js';
import { createFont } from '../adapters/font.js';
import { detectMedia } from '../adapters/detect.js';
import { createAssets } from './api.js';
import { fail } from './errors.js';
import type { Result } from './errors.js';
import type { Assets } from './types.js';
import type { AssetDatabase, BlobFiles } from './ports/native.js';
/** Optional native factories make location/open failures testable without global IO replacement. */
interface NativeFactories {
  files(root: string): BlobFiles;
  database(location: string): AssetDatabase;
}
const native: NativeFactories = {
  files: createBlobFiles,
  database: (location) => new DatabaseSync(location),
};
/** Explicit open lifecycle: wire pure policy after the host asks for native storage, never during createAssets. */
export function openAssets(root: string, factories: NativeFactories = native): Result<Assets> {
  try {
    const files = factories.files(join(root, 'blobs'));
    const store = createSqliteFiles(factories.database(join(root, 'assets.sqlite')), files);
    if (!store.ok) return store;
    return {
      ok: true,
      value: createAssets({
        storage: store.value,
        identity: createIdentity(),
        media: { handlers: [createRaster(), createSvg(), createFont()], detect: detectMedia },
      }),
    };
  } catch {
    return fail(
      'storage-unavailable',
      '$',
      'Asset location could not be opened; retain original files',
    );
  }
}
