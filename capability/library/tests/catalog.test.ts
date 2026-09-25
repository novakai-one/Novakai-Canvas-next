/*
 * Library snapshot validation: a snapshot's shape and the rules across its records, and the public
 * ID schema factories.
 * A failing test changes nothing outside the test; correct the code or the test and rerun.
 */
import { describe, expect, test } from 'vitest';
import {
  validateLibrarySnapshot,
  catalogIdSchema,
  collectionIdSchema,
  folderIdSchema,
  objectIdSchema,
  sectionIdSchema,
} from '../contract/index.js';
import { snapshot, ids } from './fixtures.js';
import { valueOf, diagnosticsOf, issueCodes } from './assertions.js';

describe('Library snapshot validation', () => {
  /**
   * A valid snapshot comes back parsed. Catalog entries and collections must match one to one:
   * a duplicate entry, an entry without a collection and a collection without an entry are each
   * reported at their path. An unknown schema version or an unknown top-level key is rejected.
   */
  function requiresOneEntryPerCollection(): void {
    const base = snapshot();
    const valid = valueOf(validateLibrarySnapshot(base));
    expect(valid.catalog.revision).toBe(7);
    expect(valid.catalog.entries).toHaveLength(2);

    // `alpha` listed twice.
    const duplicate = {
      ...base,
      catalog: { ...base.catalog, entries: [...base.catalog.entries, base.catalog.entries[0]] },
    };
    expect(diagnosticsOf(validateLibrarySnapshot(duplicate))).toEqual([
      'duplicate catalog.entries.alpha',
    ]);

    // Entries without collections (their visits too), then collections without entries.
    expect(diagnosticsOf(validateLibrarySnapshot({ ...base, collections: [] }))).toEqual([
      'reference catalog.entries.alpha',
      'reference catalog.entries.beta',
      'reference recent.alpha',
      'reference recent.beta',
    ]);
    const unlisted = { ...base, catalog: { ...base.catalog, entries: [] } };
    expect(diagnosticsOf(validateLibrarySnapshot(unlisted))).toEqual([
      'reference collections.alpha',
      'reference collections.beta',
    ]);

    // Shape: unknown schema version; unknown key (reported at the root, path '').
    const future = { ...base, catalog: { ...base.catalog, schemaVersion: 99 } };
    expect(diagnosticsOf(validateLibrarySnapshot(future))).toEqual(['shape catalog.schemaVersion']);
    expect(diagnosticsOf(validateLibrarySnapshot({ ...base, extra: true }))).toEqual(['shape ']);
  }

  test(
    'accepts a valid snapshot and requires one catalog entry per collection',
    requiresOneEntryPerCollection,
  );

  /**
   * Each folder in a parent cycle is reported. An object's visible section, and a recent visit's
   * collection, must exist. A negative visit time and duplicate collections are rejected.
   */
  function rejectsBrokenReferences(): void {
    const base = snapshot();

    // engineering → backend → engineering.
    const folders = [
      { id: ids.folder, title: 'Engineering', parent: ids.child, order: 0 },
      { id: ids.child, title: 'Backend', parent: ids.folder, order: 0 },
    ];
    expect(
      diagnosticsOf(validateLibrarySnapshot({ ...base, catalog: { ...base.catalog, folders } })),
    ).toEqual(['cycle catalog.folders.engineering.parent', 'cycle catalog.folders.backend.parent']);

    // An object visible in a section that does not exist.
    const collections = base.collections.map((collection) => ({
      ...collection,
      objects: [{ id: ids.object, label: 'Invoice', description: '', visibleIn: ['missing'] }],
    }));
    expect(diagnosticsOf(validateLibrarySnapshot({ ...base, collections }))).toEqual([
      'reference collections.alpha.objects.invoice.visibleIn.missing',
      'reference collections.beta.objects.invoice.visibleIn.missing',
    ]);

    // Visits: to a missing collection, with a negative time; then duplicate collections.
    const missingVisit = { ...base, recent: [{ collection: 'missing', openedAt: 1 }] };
    expect(diagnosticsOf(validateLibrarySnapshot(missingVisit))).toEqual([
      'reference recent.missing',
    ]);
    const negativeVisit = { ...base, recent: [{ collection: ids.alpha, openedAt: -1 }] };
    expect(diagnosticsOf(validateLibrarySnapshot(negativeVisit))).toEqual([
      'shape recent.0.openedAt',
    ]);
    const twice = { ...base, collections: [...base.collections, ...base.collections] };
    expect(diagnosticsOf(validateLibrarySnapshot(twice))).toEqual([
      'duplicate collections.alpha',
      'duplicate collections.beta',
    ]);
  }

  test(
    'rejects folder cycles, missing sections or visited collections, and bad visits',
    rejectsBrokenReferences,
  );

  /**
   * Each ID schema factory returns a new schema object per call, so no consumer can change a
   * schema another consumer uses. Each accepts a plain ID and rejects empty text or a space. The
   * fixture IDs are frozen.
   */
  function buildsFreshIdSchemas(): void {
    const factories = [
      catalogIdSchema,
      folderIdSchema,
      collectionIdSchema,
      objectIdSchema,
      sectionIdSchema,
    ];
    expect(Object.isFrozen(ids)).toBe(true);
    for (const factory of factories) {
      expect(factory()).not.toBe(factory());
      expect(factory().safeParse('alpha')).toMatchObject({ success: true, data: 'alpha' });
      expect(issueCodes(factory().safeParse(''))).toEqual(['invalid_format']);
      expect(issueCodes(factory().safeParse('a b'))).toEqual(['invalid_format']);
    }
  }

  test(
    'builds a fresh ID schema per call that accepts IDs and rejects empty text',
    buildsFreshIdSchemas,
  );
});
