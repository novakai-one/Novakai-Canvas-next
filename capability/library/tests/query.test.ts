import { describe, expect, test } from 'vitest';
import { query, type LibrarySnapshot } from '../contract/index.js';
import { snapshot, ids, valueOf, hasFailure } from './fixtures.js';

// Search over one snapshot: filters, paging with cursors, and sorting.
describe('Library search', () => {
  /**
   * Text search ignores case and extra spaces and matches labels and descriptions, including
   * objects in no section. Folder, archive and kind filters narrow the results; a missing folder
   * is `not-found`.
   */
  test('finds labels and descriptions, including unplaced objects, within folder and archive filters', () => {
    const base = snapshot();
    const found = valueOf(query(base, { text: '  INVOICE financial ' }));
    expect(found.hits).toEqual([
      {
        kind: 'object',
        collection: ids.alpha,
        id: ids.object,
        label: 'Invoice',
        description: 'Unplaced financial record',
        visibleIn: [],
      },
    ]);
    expect(valueOf(query(base, { text: 'payments' })).hits[0]?.description).toBe(
      'Payments overview',
    );

    // `alpha` is in `backend`, a child of `engineering`: found only with descendants.
    expect(valueOf(query(base, { folder: ids.folder })).total).toBe(0);
    expect(valueOf(query(base, { folder: ids.folder, descendants: true })).total).toBe(3);

    // Archived only: `beta`. Sections only: `er`, visible in itself.
    expect(valueOf(query(base, { archived: 'only' })).hits.map((hit) => hit.collection)).toEqual([
      ids.beta,
    ]);
    expect(
      valueOf(query(base, { text: 'database', kinds: ['section'] })).hits[0]?.visibleIn,
    ).toEqual([ids.section]);
    expect(hasFailure(query(base, { folder: 'missing' }), 'not-found', 'query.folder')).toBe(true);
  });

  /**
   * Pages follow a stable order (collection, section, object); the last page has no cursor. A
   * cursor fails with `stale-cursor` after a source revision changes, with another page size, or
   * when it is not JSON. When the next cursor would exceed the size budget, the query fails with
   * `limit` instead of returning it.
   */
  test('pages in a stable order, rejects stale cursors and refuses an oversized next cursor', () => {
    const base = snapshot();
    const first = valueOf(query(base, { limit: 1 }));
    expect(first.hits.map((hit) => hit.kind)).toEqual(['collection']);
    expect(first.total).toBe(3);
    expect(first.nextCursor).toBeTypeOf('string');
    const second = valueOf(query(base, { limit: 1, cursor: first.nextCursor }));
    expect(second.hits.map((hit) => hit.kind)).toEqual(['section']);
    const third = valueOf(query(base, { limit: 1, cursor: second.nextCursor }));
    expect(third.hits.map((hit) => hit.kind)).toEqual(['object']);
    expect(third.nextCursor).toBeUndefined();

    // Stale: the catalog revision changed; the page size changed; not JSON.
    expect(
      hasFailure(
        query(
          { ...base, catalog: { ...base.catalog, revision: 8 } },
          { limit: 1, cursor: first.nextCursor },
        ),
        'stale-cursor',
        'query.cursor',
      ),
    ).toBe(true);
    expect(
      hasFailure(
        query(base, { limit: 2, cursor: first.nextCursor }),
        'stale-cursor',
        'query.cursor',
      ),
    ).toBe(true);
    expect(hasFailure(query(base, { cursor: 'not-json' }), 'stale-cursor', 'query.cursor')).toBe(
      true,
    );
    expect(query(base, { limit: 0 }).ok).toBe(false);

    // A catalog ID over 1,000,000 characters makes the next cursor too long.
    const longId = 'x'.repeat(1_000_001);
    const huge = {
      catalog: {
        schemaVersion: 1,
        id: longId,
        revision: 0,
        folders: [],
        entries: [{ collection: 'c', order: 0, archived: false }],
      },
      collections: [
        { id: 'c', revision: 0, title: 'C', sections: [{ id: 's', title: 'S' }], objects: [] },
      ],
      recent: [],
    };
    expect(hasFailure(query(huge, { limit: 1 }), 'limit', 'query.cursor')).toBe(true);
  });

  /**
   * Two consumers (one passing the snapshot object, one a JSON copy) get equal results with no
   * clock or locale involved. `recent` sorts the latest visit first; `title` sorts by label. Results
   * are frozen and are new objects, not the input's.
   */
  test('sorts by recent visit or title and gives every consumer the same frozen result', () => {
    const base = snapshot();
    const browser = (input: LibrarySnapshot) =>
      query(input, { kinds: ['collection'], archived: 'include', sort: 'recent' });
    const cli = (input: LibrarySnapshot) =>
      query(JSON.parse(JSON.stringify(input)), {
        kinds: ['collection'],
        archived: 'include',
        sort: 'recent',
      });

    // `beta` (opened at 200) before `alpha` (100); the same result from both consumers.
    const recent = valueOf(browser(base));
    expect(recent.hits.map((hit) => hit.collection)).toEqual([ids.beta, ids.alpha]);
    expect(cli(base)).toEqual(browser(base));
    expect(
      valueOf(query(base, { kinds: ['collection'], archived: 'include', sort: 'title' })).hits.map(
        (hit) => hit.label,
      ),
    ).toEqual(['Architecture', 'Billing']);

    // Frozen, and not the input's collection object.
    expect(Object.isFrozen(recent)).toBe(true);
    expect(Object.isFrozen(recent.hits[0])).toBe(true);
    expect(recent.hits[0]).not.toBe(base.collections[1]);
  });
});
