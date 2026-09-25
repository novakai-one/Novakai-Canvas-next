import { it, expect, assert } from 'vitest';
import { validateLibrarySnapshot } from '@novakai/canvas-library';
import { snapshotSchema } from '@novakai/canvas-authoring';
import { createLibraryReader } from '../adapters/library-reader.js';
it('preserves Library diagnostics through the browser reader and leaves success unchanged', () => {
  const catalog = {
    schemaVersion: 1,
    id: 'catalog',
    revision: 0,
    folders: [
      { id: 'a', title: 'A', parent: 'missing', order: 0 },
      { id: 'a', title: 'Again', order: 1 },
    ],
    entries: [],
  };
  const expected = validateLibrarySnapshot({ catalog, collections: [], recent: [] });
  assert(!expected.ok);
  expect(expected.error.diagnostics.length).toBeGreaterThanOrEqual(2);
  const snapshot = snapshotSchema.parse({
    workspace: 'probe',
    sequence: 0,
    records: [
      {
        key: { kind: 'catalog', id: 'catalog' },
        version: 0,
        deleted: false,
        resources: [],
        value: catalog,
      },
    ],
  });
  const reader = createLibraryReader();
  const result = reader.read(snapshot, [], []);
  assert(!result.ok);
  expect(result.error.source).toEqual(expected.error);
  expect(result).not.toHaveProperty('diagnostics');
  const valid = { ...catalog, folders: [] };
  const accepted = reader.read(
    { ...snapshot, records: snapshot.records.map((record) => ({ ...record, value: valid })) },
    [],
    [],
  );
  expect(accepted).toEqual(
    validateLibrarySnapshot({ catalog: valid, collections: [], recent: [] }),
  );
});
