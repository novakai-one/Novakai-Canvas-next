import { assert, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { snapshotSchema } from '@novakai/canvas-authoring';
import { validate, type Collection } from '@novakai/canvas-model';
import { collectionIdSchema } from '@novakai/canvas-library';
import { createLibraryReader } from '../adapters/readers/library-reader.js';
import { createLibraryResults } from '../adapters/react/LibraryResults.js';
import type { LibraryView } from '../contract/records/library.js';

/** Real owner validation and query must remain usable when browser history names a removed collection. */
it('ignores obsolete local visits without masking invalid canonical organisation references', () => {
  const collection = sampleCollection();
  const snapshot = snapshotSchema.parse({
    workspace: 'local',
    sequence: 1,
    records: [
      {
        key: { kind: 'catalog', id: 'main' },
        version: 1,
        deleted: false,
        resources: [],
        value: {
          schemaVersion: 1,
          id: 'main',
          revision: 1,
          folders: [],
          entries: [{ collection: 'current', order: 0, archived: false }],
        },
      },
    ],
  });
  const reader = createLibraryReader();
  const visits = [
    { collection: collectionIdSchema().parse('retired-atlas'), openedAt: 200 },
    { collection: collectionIdSchema().parse('current'), openedAt: 100 },
  ];
  const loaded = reader.read(snapshot, [collection], visits);
  assert(loaded.ok, JSON.stringify(loaded));
  expect(loaded.value.recent).toEqual([visits[1]]);
  expect(visits).toHaveLength(2);
  const page = reader.query(
    loaded.value,
    { text: '', folder: null, archived: 'exclude', sort: 'recent' },
    null,
  );
  assert(page.ok, JSON.stringify(page));
  expect(page.value.hits.map((hit) => hit.collection)).toEqual(['current']);
  // Recording another visit can republish the retained list without a workspace reload.
  const revisited = reader.query(
    { ...loaded.value, recent: visits },
    { text: '', folder: null, archived: 'exclude', sort: 'recent' },
    null,
  );
  assert(revisited.ok, JSON.stringify(revisited));
  expect(revisited.value.hits.map((hit) => hit.collection)).toEqual(['current']);

  // A collection deleted after this browser opened is also an obsolete visit.
  const empty = {
    ...snapshot,
    records: snapshot.records.map((record) => ({
      ...record,
      value: { schemaVersion: 1, id: 'main', revision: 2, folders: [], entries: [] },
    })),
  };
  expect(reader.read(empty, [], visits)).toMatchObject({
    ok: true,
    value: { recent: [], collections: [] },
  });
  // Canonical organisation corruption must still reject with typed originating diagnostics.
  const rejected = reader.read(snapshot, [], visits);
  assert(!rejected.ok);
  expect(rejected.error).toMatchObject({
    code: 'invalid-library',
    source: { diagnostics: [{ code: 'broken-reference' }] },
  });
});

/** Failed initial loading must not keep announcing progress; a genuine pending request still does. */
it('distinguishes failed library loading from pending results', () => {
  const Results = createLibraryResults({
    Button: ({ label }) => createElement('button', null, label),
  });
  const state: LibraryView = {
    source: null,
    page: null,
    problem: null,
    folderDraft: null,
    filters: { text: '', folder: null, archived: 'exclude', sort: 'order' },
  };
  const navigation = {
    library: { next: () => undefined },
    workspace: { open: async () => undefined },
  };
  const pending = renderToStaticMarkup(createElement(Results, { ...navigation, state }));
  expect(pending).toContain('Library is loading');
  const failed = renderToStaticMarkup(
    createElement(Results, {
      ...navigation,
      state: {
        ...state,
        problem: {
          code: 'invalid-library',
          message: 'Invalid catalog',
          recovery: 'Reload the workspace.',
        },
      },
    }),
  );
  expect(failed).not.toContain('Library is loading');
  expect(failed).toContain('Library could not be loaded');
});

/** Minimal valid canonical input; no filesystem, live service or invented owner success is required. */
function sampleCollection(): Collection {
  const result = validate({
    schemaVersion: 1,
    id: 'current',
    revision: 0,
    title: 'Current collection',
    theme: { id: 'paper', version: '1', digest: `sha256:${'a'.repeat(64)}`, roles: ['neutral'] },
    arrangement: { algorithm: 'grid' },
  });
  assert(result.ok, JSON.stringify(result));
  return result.value;
}
