import { expect, test } from 'vitest';
import { plan } from '../contract/index.js';
import { snapshot, ids, valueOf, hasFailure } from './fixtures.js';
/** Ordered changes permit forward folder references; rejected batches return no partial catalog. */
test('plan ordered immutable catalog changes', () => {
  const base = snapshot();
  const original = JSON.stringify(base);
  const changes = [
    {
      op: 'replace-entry',
      value: { collection: ids.alpha, folder: 'new', order: 9, archived: true },
    },
    { op: 'create-folder', value: { id: 'new', title: 'New' } },
  ];
  const result = valueOf(plan(base, changes));
  expect(result.candidate.revision).toBe(7);
  expect(result.candidate.entries[0]).toEqual({
    collection: ids.alpha,
    folder: 'new',
    order: 9,
    archived: true,
  });
  expect(result.changed).toBe(true);
  expect(result.versions.collections).toEqual([
    { id: ids.alpha, revision: 3 },
    { id: ids.beta, revision: 4 },
  ]);
  expect(JSON.stringify(base)).toBe(original);
  expect(Object.isFrozen(result.candidate.entries)).toBe(true);
  const unchanged = valueOf(plan(base, [{ op: 'replace-entry', value: base.catalog.entries[0] }]));
  expect(unchanged.changed).toBe(false);
  const reverted = valueOf(
    plan(base, [
      ...changes,
      { op: 'replace-entry', value: base.catalog.entries[0] },
      { op: 'remove-folder', id: 'new' },
    ]),
  );
  expect(reverted.changed).toBe(false);
  expect(
    hasFailure(
      plan(base, [{ op: 'create-folder', value: { id: ids.folder, title: 'Duplicate' } }]),
      'already-exists',
      'catalog.folders.engineering',
    ),
  ).toBe(true);
  const failed = plan(base, [...changes, { op: 'unregister', collection: 'absent' }]);
  expect(hasFailure(failed, 'not-found', 'catalog.entries.absent')).toBe(true);
  expect(failed).not.toHaveProperty('value');
});
/** Inventory changes are supplied by Authoring; Library never invents or deletes a collection. */
test('coordinate inventory registration and deletion', () => {
  const base = snapshot();
  const added = {
    id: 'gamma',
    revision: 0,
    title: 'New',
    description: '',
    sections: [],
    objects: [],
  };
  expect(
    hasFailure(
      plan(base, [{ op: 'register', value: { collection: 'gamma' } }]),
      'reference',
      'catalog.entries.gamma',
    ),
  ).toBe(true);
  const registered = valueOf(
    plan(base, [{ op: 'register', value: { collection: 'gamma' } }], [...base.collections, added]),
  );
  expect(registered.candidate.entries.at(-1)?.collection).toBe('gamma');
  expect(registered.versions.collections).toHaveLength(2);
  expect(
    hasFailure(
      plan(base, [{ op: 'unregister', collection: ids.beta }]),
      'reference',
      'collections.beta',
    ),
  ).toBe(true);
  const remaining = base.collections.filter((collection) => collection.id !== ids.beta);
  const removed = valueOf(plan(base, [{ op: 'unregister', collection: ids.beta }], remaining));
  expect(removed.candidate.entries.map((entry) => entry.collection)).toEqual([ids.alpha]);
  const projected = base.collections.map((collection) => ({
    ...collection,
    revision: collection.revision + 1,
  }));
  expect(valueOf(plan(base, [], projected)).changed).toBe(false);
});
/** Folder removal cannot implicitly delete content or detach nested descendants. */
test('remove folders only with explicit rehome', () => {
  const base = snapshot();
  expect(
    hasFailure(
      plan(base, [{ op: 'remove-folder', id: ids.folder }]),
      'folder-not-empty',
      'catalog.folders.engineering',
    ),
  ).toBe(true);
  const rehomed = valueOf(plan(base, [{ op: 'remove-folder', id: ids.folder, policy: 'rehome' }]));
  expect(rehomed.candidate.folders).toEqual([{ id: ids.child, title: 'Backend', order: 0 }]);
  expect(rehomed.candidate.entries).toEqual(base.catalog.entries);
  const ungrouped = valueOf(plan(base, [{ op: 'remove-folder', id: ids.child, policy: 'rehome' }]));
  expect(ungrouped.candidate.entries[0]?.folder).toBe(ids.folder);
  expect(ungrouped.candidate.entries[1]?.archived).toBe(true);
});
