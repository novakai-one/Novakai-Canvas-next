import { harness, faultStore } from './storage-harness.js';
import { describe, it, expect } from 'vitest';
import { openSqlite, digest } from '../contract/index.js';
import type { CommitRequest } from '../contract/index.js';
import { request, value, rejects, collection, history, workspace, pristine } from './fixtures.js';

describe.each(['memory', 'file'] as const)('SQLite %s configuration', (mode) => {
  it('atomically commits records and checks read-only dependencies', () => {
    const store = harness(mode);
    const initial = request();
    const batch: CommitRequest = {
      ...initial,
      expected: [...initial.expected, { key: history, version: 'absent' }],
      writes: [
        ...initial.writes,
        { kind: 'put', key: history, value: { before: null }, resources: [] },
      ],
    };
    expect(value(store.persistence.commit(batch)).versions).toEqual([
      { key: collection, version: 0 },
      { key: history, version: 0 },
    ]);
    const stale = {
      ...request('second'),
      expected: [
        { key: collection, version: 0 },
        { key: history, version: 1 },
      ],
    };
    rejects(store.persistence.commit(stale), 'revision-conflict');
    expect(value(store.persistence.readSnapshot()).slots).toHaveLength(2);
    expect(value(store.persistence.receipt('second'))).toBeNull();
    value(store.persistence.close());
    store.remove();
  });
  it('reconciles receipts before stale comparisons and preserves no-op revisions', () => {
    const store = harness(mode);
    const first = value(store.persistence.commit(request()));
    expect(value(store.persistence.commit(request()))).toEqual(first);
    rejects(
      store.persistence.commit({ ...request(), fingerprint: digest.parse('b'.repeat(64)) }),
      'request-reused',
    );
    const noop = { ...request('noop'), expected: [{ key: collection, version: 0 }], writes: [] };
    expect(value(store.persistence.commit(noop))).toMatchObject({ sequence: 2, versions: [] });
    expect(value(store.persistence.readSnapshot()).slots[0]?.version).toBe(0);
    rejects(
      store.persistence.commit({
        ...noop,
        request: 'stale-noop',
        expected: [{ key: collection, version: 4 }],
      }),
      'revision-conflict',
    );
    value(store.persistence.close());
    store.remove();
  });
  it('retains tombstone versions and rejects unchecked requests', () => {
    const store = harness(mode);
    value(store.persistence.commit(request()));
    value(
      store.persistence.commit({
        ...request('delete'),
        expected: [{ key: collection, version: 0 }],
        writes: [{ kind: 'delete', key: collection }],
      }),
    );
    expect(value(store.persistence.readSnapshot()).slots[0]).toMatchObject({
      version: 1,
      deleted: true,
      value: null,
      resources: [],
    });
    rejects(store.persistence.commit(request('stale-create')), 'revision-conflict');
    expect(
      value(
        store.persistence.commit({
          ...request('recreate'),
          expected: [{ key: collection, version: 1 }],
        }),
      ).versions,
    ).toEqual([{ key: collection, version: 2 }]);
    rejects(store.persistence.commit({ ...request('blind'), expected: [] }), 'invalid-input');
    rejects(
      store.persistence.commit({
        ...request('duplicate'),
        expected: [...request().expected, ...request().expected],
      }),
      'invalid-input',
    );
    rejects(
      store.persistence.commit({ ...request('function'), outcome: { f: () => 1 } }),
      'invalid-input',
    );
    value(store.persistence.close());
    store.remove();
  });
  it('returns detached frozen snapshots and protects workspace identity', () => {
    const store = harness(mode);
    const input = { ...request(), outcome: { title: 'Original' } };
    value(store.persistence.commit(input));
    input.outcome.title = 'Changed externally';
    const snapshot = value(store.persistence.readSnapshot());
    expect(snapshot.receipts[0]?.outcome).toEqual({ title: 'Original' });
    expect(Object.isFrozen(snapshot.slots)).toBe(true);
    expect(Object.isFrozen(snapshot.slots[0]?.value)).toBe(true);
    rejects(store.persistence.commit({ ...request('wrong'), workspace: 'other' }), 'invalid-input');
    const newer = faultStore('none', { ...pristine(), schemaVersion: 2 });
    rejects(newer.persistence.readSnapshot(), 'unsupported-version');
    expect(newer.inspect()).toMatchObject({ schemaVersion: 2 });
    newer.close();
    const corrupt = faultStore('none', { ...pristine(), sequence: 1 });
    rejects(corrupt.persistence.readSnapshot(), 'corrupt-record');
    corrupt.close();
    value(store.persistence.close());
    store.remove();
  });
  it('closes and reopens with explicit durability semantics', () => {
    const store = harness(mode);
    const receipt = value(store.persistence.commit(request()));
    value(store.persistence.close());
    rejects(store.persistence.readSnapshot(), 'storage-unavailable');
    const reopened = value(openSqlite(store.location, workspace));
    const expected = mode === 'file' ? receipt : null;
    expect(value(reopened.receipt('request-one'))).toEqual(expected);
    expect(value(reopened.readSnapshot()).slots.length).toBe(mode === 'file' ? 1 : 0);
    value(reopened.close());
    store.remove();
  });
});
it('reports injected write/commit/read failures and uncertain commit recovery honestly', () => {
  ['read', 'write', 'commit'].forEach((fault) => checkRollback(fault));
  const uncertain = faultStore('after-commit');
  rejects(uncertain.persistence.commit(request()), 'storage-unavailable');
  expect(uncertain.inspect()).toMatchObject({
    sequence: 1,
    receipts: [{ request: 'request-one' }],
  });
  uncertain.close();
});
/** Typed selection validates fixture fault names; failed transactions must leave pristine durable state. */
function checkRollback(fault: string): void {
  if (fault !== 'read' && fault !== 'write' && fault !== 'commit') return;
  const store = faultStore(fault);
  rejects(store.persistence.commit(request()), 'storage-unavailable');
  expect(store.inspect()).toMatchObject({ sequence: 0, slots: [], receipts: [] });
  store.close();
}
