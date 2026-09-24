import { describe, expect, test } from 'vitest';
import { validate } from '../contract/index.js';
import { snapshot, ids, valueOf, hasFailure } from './fixtures.js';

// Validation checks a snapshot's shape and the rules across its records.
describe('Library snapshot validation', () => {
  /**
   * A valid snapshot comes back parsed. Catalog entries and collections must match one to one:
   * a duplicate entry, an entry without a collection and a collection without an entry are each
   * reported at their path. An unknown schema version or an unknown top-level key is rejected.
   */
  test('accepts a valid snapshot and requires one catalog entry per collection', () => {
    const base = snapshot();
    const valid = valueOf(validate(base));
    expect(valid.catalog.revision).toBe(7);
    expect(valid.catalog.entries).toHaveLength(2);

    // `alpha` listed twice.
    const duplicate = {
      ...base,
      catalog: { ...base.catalog, entries: [...base.catalog.entries, base.catalog.entries[0]] },
    };
    expect(hasFailure(validate(duplicate), 'duplicate', 'catalog.entries.alpha')).toBe(true);

    // Entries without collections, then collections without entries.
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

    // Shape: unknown schema version, unknown key.
    expect(
      hasFailure(
        validate({ ...base, catalog: { ...base.catalog, schemaVersion: 99 } }),
        'shape',
        'catalog.schemaVersion',
      ),
    ).toBe(true);
    expect(validate({ ...base, extra: true }).ok).toBe(false);
  });

  /**
   * A folder parent cycle is reported (and the check ends). An object's visible section, and a
   * recent visit's collection, must exist. A negative visit time and duplicate collections are
   * rejected.
   */
  test('rejects folder cycles, missing sections or visited collections, and bad visits', () => {
    const base = snapshot();

    // engineering → backend → engineering.
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

    // An object visible in a section that does not exist.
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

    // Visits: to a missing collection, with a negative time; then duplicate collections.
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
});
