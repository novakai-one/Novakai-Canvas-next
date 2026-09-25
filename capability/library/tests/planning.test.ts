/*
 * Library catalog planning: a batch of catalog changes applied to a snapshot without storing
 * anything, and the named-input boundary shared with search.
 * A failing test changes nothing outside the test; correct the code or the test and rerun.
 */
import { describe, expect, test } from 'vitest';
import { plan, query, type PlanInput, type QueryInput } from '../contract/index.js';
import { snapshot, ids } from './fixtures.js';
import { valueOf, hasFailure, diagnosticsOf, isDeepFrozen } from './assertions.js';

describe('Library catalog planning', /** The planning tests. */ () => {
  /**
   * Changes apply in order, and a change may name a folder a later change creates. The candidate
   * keeps revision 7 and is frozen throughout; the input is not changed. `changed` is the net
   * effect, so a batch that ends where it started is unchanged. Any failed change fails the whole
   * batch with no value.
   */
  function appliesChangesInOrder(): void {
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
    const result = valueOf(plan({ snapshot: base, changes }));
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
    expect(isDeepFrozen(result)).toBe(true);

    // Replacing an entry with itself, and undoing the batch within the batch: unchanged.
    const same = [{ op: 'replace-entry', value: base.catalog.entries[0] }];
    expect(valueOf(plan({ snapshot: base, changes: same })).changed).toBe(false);
    const undone = [...changes, ...same, { op: 'remove-folder', id: 'new' }];
    expect(valueOf(plan({ snapshot: base, changes: undone })).changed).toBe(false);

    // Failures: creating an existing folder; unregistering a missing entry at the end.
    const existing = [{ op: 'create-folder', value: { id: ids.folder, title: 'Duplicate' } }];
    expect(diagnosticsOf(plan({ snapshot: base, changes: existing }))).toEqual([
      'already-exists catalog.folders.engineering',
    ]);
    const absent = [...changes, { op: 'unregister', collection: 'absent' }];
    const failed = plan({ snapshot: base, changes: absent });
    expect(diagnosticsOf(failed)).toEqual(['not-found catalog.entries.absent']);
    expect(failed).not.toHaveProperty('value');
  }

  test(
    'applies changes in order and fails the whole batch on any failed change',
    appliesChangesInOrder,
  );

  /**
   * Registering or unregistering a collection needs the matching inventory from Authoring;
   * Library never adds or deletes a collection itself. Newer collection revisions alone do not
   * change the catalog.
   */
  function registersOnlyWithInventory(): void {
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
    const register = [{ op: 'register', value: { collection: 'gamma' } }];
    expect(
      hasFailure(plan({ snapshot: base, changes: register }), 'reference', 'catalog.entries.gamma'),
    ).toBe(true);
    const withGamma = [...base.collections, added];
    const registered = valueOf(
      plan({ snapshot: base, changes: register, proposedCollections: withGamma }),
    );
    expect(registered.candidate.entries.at(-1)?.collection).toBe('gamma');
    expect(registered.versions.collections).toHaveLength(2);

    // Unregister `beta`: rejected while `beta` is still in the inventory, accepted without it.
    const unregister = [{ op: 'unregister', collection: ids.beta }];
    expect(
      hasFailure(plan({ snapshot: base, changes: unregister }), 'reference', 'collections.beta'),
    ).toBe(true);
    const remaining = base.collections.filter(
      /** Whether the collection is not `beta`. */ (collection) => collection.id !== ids.beta,
    );
    const removed = valueOf(
      plan({ snapshot: base, changes: unregister, proposedCollections: remaining }),
    );
    expect(
      removed.candidate.entries.map(/** The listed collection. */ (entry) => entry.collection),
    ).toEqual([ids.alpha]);

    // Every collection one revision newer, no changes: catalog unchanged. `null` is rejected.
    const projected = base.collections.map(
      /** The collection one revision newer. */ (collection) => ({
        ...collection,
        revision: collection.revision + 1,
      }),
    );
    const newer = { snapshot: base, changes: [], proposedCollections: projected };
    expect(valueOf(plan(newer)).changed).toBe(false);
    const nulled = { snapshot: base, changes: [], proposedCollections: null };
    expect(diagnosticsOf(plan(nulled))).toEqual(['shape ']);
  }

  test(
    'registers or unregisters a collection only with the matching proposed inventory',
    registersOnlyWithInventory,
  );

  /**
   * A folder with contents is removed only under `rehome`, which moves its direct child folders
   * and entries to its parent. No collection is dropped. Deeper folders stay attached to their
   * own parent.
   */
  function removesOnlyUnderRehome(): void {
    const base = snapshot();
    const refused = [{ op: 'remove-folder', id: ids.folder }];
    expect(diagnosticsOf(plan({ snapshot: base, changes: refused }))).toEqual([
      'folder-not-empty catalog.folders.engineering',
    ]);

    // Remove `engineering`: `backend` moves to the root; entries are unchanged.
    const parent = [{ op: 'remove-folder', id: ids.folder, policy: 'rehome' }];
    const rehomed = valueOf(plan({ snapshot: base, changes: parent }));
    expect(rehomed.candidate.folders).toEqual([{ id: ids.child, title: 'Backend', order: 0 }]);
    expect(rehomed.candidate.entries).toEqual(base.catalog.entries);

    // Remove `backend`: `alpha` moves up to `engineering`; `beta` keeps its archive flag.
    const child = [{ op: 'remove-folder', id: ids.child, policy: 'rehome' }];
    const ungrouped = valueOf(plan({ snapshot: base, changes: child }));
    expect(ungrouped.candidate.entries[0]?.folder).toBe(ids.folder);
    expect(ungrouped.candidate.entries[1]?.archived).toBe(true);

    // Add `deep` under `backend`, then remove `engineering`: `deep` stays under `backend`.
    const deep = { id: 'deep', title: 'Deep', parent: ids.child, order: 0 };
    const grandchild = [
      { op: 'create-folder', value: deep },
      { op: 'remove-folder', id: ids.folder, policy: 'rehome' },
    ];
    const kept = valueOf(plan({ snapshot: base, changes: grandchild }));
    expect(kept.candidate.folders).toEqual([{ id: ids.child, title: 'Backend', order: 0 }, deep]);
  }

  test(
    'removes a folder with contents only under rehome, moving them to its parent',
    removesOnlyUnderRehome,
  );

  /**
   * Plan and search read their named inputs inside the failure boundary: an input whose
   * `snapshot` throws when read gives one `shape` failure at `$`, never a thrown error.
   */
  function reportsThrowingInputs(): void {
    const planInput: PlanInput = {
      /** Throws on every read, like a revoked or hostile input. */
      get snapshot(): unknown {
        throw new Error('unreadable');
      },
      changes: [],
    };
    const queryInput: QueryInput = {
      /** Throws on every read, like a revoked or hostile input. */
      get snapshot(): unknown {
        throw new Error('unreadable');
      },
      request: {},
    };
    expect(diagnosticsOf(plan(planInput))).toEqual(['shape $']);
    expect(diagnosticsOf(query(queryInput))).toEqual(['shape $']);
  }

  test('reports an input that throws when read as a shape failure', reportsThrowingInputs);
});
