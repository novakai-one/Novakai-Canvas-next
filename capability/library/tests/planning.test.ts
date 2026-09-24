import { describe, expect, test } from 'vitest';
import { plan } from '../contract/index.js';
import { snapshot, ids, valueOf, hasFailure } from './fixtures.js';

// Planning applies a batch of catalog changes to a snapshot without storing anything.
describe('Library catalog planning', () => {
  /**
   * Changes apply in order, and a change may name a folder a later change creates. The candidate
   * keeps revision 7 and is frozen; the input is not changed. `changed` is the net effect, so a
   * batch that ends where it started is unchanged. Any failed change fails the whole batch with no
   * value.
   */
  test('applies changes in order and fails the whole batch on any failed change', () => {
    const base = snapshot();
    const original = JSON.stringify(base);
    // Move `alpha` into folder `new` before `new` is created.
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

    // Replacing an entry with itself, and undoing the batch within the batch: unchanged.
    const unchanged = valueOf(
      plan(base, [{ op: 'replace-entry', value: base.catalog.entries[0] }]),
    );
    expect(unchanged.changed).toBe(false);
    const reverted = valueOf(
      plan(base, [
        ...changes,
        { op: 'replace-entry', value: base.catalog.entries[0] },
        { op: 'remove-folder', id: 'new' },
      ]),
    );
    expect(reverted.changed).toBe(false);

    // Failures: creating an existing folder; unregistering a missing entry at the end.
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

  /**
   * Registering or unregistering a collection needs the matching inventory from Authoring;
   * Library never adds or deletes a collection itself. Newer collection revisions alone do not
   * change the catalog.
   */
  test('registers or unregisters a collection only with the matching proposed inventory', () => {
    const base = snapshot();
    const added = {
      id: 'gamma',
      revision: 0,
      title: 'New',
      description: '',
      sections: [],
      objects: [],
    };

    // Register `gamma`: rejected without it in the inventory, accepted with it.
    expect(
      hasFailure(
        plan(base, [{ op: 'register', value: { collection: 'gamma' } }]),
        'reference',
        'catalog.entries.gamma',
      ),
    ).toBe(true);
    const registered = valueOf(
      plan(
        base,
        [{ op: 'register', value: { collection: 'gamma' } }],
        [...base.collections, added],
      ),
    );
    expect(registered.candidate.entries.at(-1)?.collection).toBe('gamma');
    expect(registered.versions.collections).toHaveLength(2);

    // Unregister `beta`: rejected while `beta` is still in the inventory, accepted without it.
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

    // Every collection one revision newer, no changes: catalog unchanged.
    const projected = base.collections.map((collection) => ({
      ...collection,
      revision: collection.revision + 1,
    }));
    expect(valueOf(plan(base, [], projected)).changed).toBe(false);
  });

  /**
   * A folder with contents is removed only under `rehome`, which moves its direct child folders
   * and entries to its parent. No collection is dropped and deeper folders stay attached.
   */
  test('removes a folder with contents only under rehome, moving them to its parent', () => {
    const base = snapshot();
    expect(
      hasFailure(
        plan(base, [{ op: 'remove-folder', id: ids.folder }]),
        'folder-not-empty',
        'catalog.folders.engineering',
      ),
    ).toBe(true);

    // Remove `engineering`: `backend` moves to the root; entries are unchanged.
    const rehomed = valueOf(
      plan(base, [{ op: 'remove-folder', id: ids.folder, policy: 'rehome' }]),
    );
    expect(rehomed.candidate.folders).toEqual([{ id: ids.child, title: 'Backend', order: 0 }]);
    expect(rehomed.candidate.entries).toEqual(base.catalog.entries);

    // Remove `backend`: `alpha` moves up to `engineering`; `beta` keeps its archive flag.
    const ungrouped = valueOf(
      plan(base, [{ op: 'remove-folder', id: ids.child, policy: 'rehome' }]),
    );
    expect(ungrouped.candidate.entries[0]?.folder).toBe(ids.folder);
    expect(ungrouped.candidate.entries[1]?.archived).toBe(true);
  });
});
