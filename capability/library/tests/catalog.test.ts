import { expect, test } from 'vitest';
import { validate } from '../contract/index.js';
import { snapshot, ids, valueOf, hasFailure } from './fixtures.js';
/** Catalog membership is a bijection with the supplied collection inventory. */
test('validate catalog and inventory identities', () => {
  const base = snapshot();
  const valid = valueOf(validate(base));
  expect(valid.catalog.revision).toBe(7);
  expect(valid.catalog.entries).toHaveLength(2);
  const duplicate = {
    ...base,
    catalog: { ...base.catalog, entries: [...base.catalog.entries, base.catalog.entries[0]] },
  };
  expect(hasFailure(validate(duplicate), 'duplicate', 'catalog.entries.alpha')).toBe(true);
  expect(
    hasFailure(validate({ ...base, collections: [] }), 'reference', 'catalog.entries.alpha'),
  ).toBe(true);
  expect(
    hasFailure(
      validate({ ...base, catalog: { ...base.catalog, entries: [] } }),
      'reference',
      'collections.alpha',
    ),
  ).toBe(true);
  expect(
    hasFailure(
      validate({ ...base, catalog: { ...base.catalog, schemaVersion: 99 } }),
      'shape',
      'catalog.schemaVersion',
    ),
  ).toBe(true);
  expect(validate({ ...base, extra: true }).ok).toBe(false);
});
/** Parent cycles and discovery references must fail without hanging traversal. */
test('validate containment and projection references', () => {
  const base = snapshot();
  const folders = [
    { id: ids.folder, title: 'Engineering', parent: ids.child, order: 0 },
    { id: ids.child, title: 'Backend', parent: ids.folder, order: 0 },
  ];
  expect(
    hasFailure(
      validate({ ...base, catalog: { ...base.catalog, folders } }),
      'cycle',
      'catalog.folders.engineering.parent',
    ),
  ).toBe(true);
  const collections = base.collections.map((collection) => ({
    ...collection,
    objects: [{ id: ids.object, label: 'Invoice', description: '', visibleIn: ['missing'] }],
  }));
  expect(
    hasFailure(
      validate({ ...base, collections }),
      'reference',
      'collections.alpha.objects.invoice.visibleIn.missing',
    ),
  ).toBe(true);
  expect(
    hasFailure(
      validate({ ...base, recent: [{ collection: 'missing', openedAt: 1 }] }),
      'reference',
      'recent.missing',
    ),
  ).toBe(true);
  expect(validate({ ...base, recent: [{ collection: ids.alpha, openedAt: -1 }] }).ok).toBe(false);
  expect(validate({ ...base, collections: [...base.collections, ...base.collections] }).ok).toBe(
    false,
  );
});
