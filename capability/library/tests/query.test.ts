import { expect, test } from 'vitest';
import { query, type LibrarySnapshot } from '../contract/index.js';
import { snapshot, ids, valueOf, hasFailure } from './fixtures.js';
/** Search uses canonical projection text, includes unplaced objects, and respects archive/folder scope. */
test('search visible and unplaced content by scope', () => {
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
  expect(valueOf(query(base, { text: 'payments' })).hits[0]?.description).toBe('Payments overview');
  expect(valueOf(query(base, { folder: ids.folder })).total).toBe(0);
  expect(valueOf(query(base, { folder: ids.folder, descendants: true })).total).toBe(3);
  expect(valueOf(query(base, { archived: 'only' })).hits.map((hit) => hit.collection)).toEqual([
    ids.beta,
  ]);
  expect(valueOf(query(base, { text: 'database', kinds: ['section'] })).hits[0]?.visibleIn).toEqual(
    [ids.section],
  );
  expect(hasFailure(query(base, { folder: 'missing' }), 'not-found', 'query.folder')).toBe(true);
});
/** A cursor cannot silently paginate a different query, preference state or source revision. */
test('paginate stable ordering and reject stale cursors', () => {
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
    hasFailure(query(base, { limit: 2, cursor: first.nextCursor }), 'stale-cursor', 'query.cursor'),
  ).toBe(true);
  expect(hasFailure(query(base, { cursor: 'not-json' }), 'stale-cursor', 'query.cursor')).toBe(
    true,
  );
  expect(query(base, { limit: 0 }).ok).toBe(false);
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
/** Browser and CLI-shaped consumers get the same immutable results with no ambient clock or locale. */
test('serve recent/title discovery through two consumers', () => {
  const base = snapshot();
  const browser = (input: LibrarySnapshot) =>
    query(input, { kinds: ['collection'], archived: 'include', sort: 'recent' });
  const cli = (input: LibrarySnapshot) =>
    query(JSON.parse(JSON.stringify(input)), {
      kinds: ['collection'],
      archived: 'include',
      sort: 'recent',
    });
  const recent = valueOf(browser(base));
  expect(recent.hits.map((hit) => hit.collection)).toEqual([ids.beta, ids.alpha]);
  expect(cli(base)).toEqual(browser(base));
  expect(
    valueOf(query(base, { kinds: ['collection'], archived: 'include', sort: 'title' })).hits.map(
      (hit) => hit.label,
    ),
  ).toEqual(['Architecture', 'Billing']);
  expect(Object.isFrozen(recent)).toBe(true);
  expect(Object.isFrozen(recent.hits[0])).toBe(true);
  expect(recent.hits[0]).not.toBe(base.collections[1]);
});
