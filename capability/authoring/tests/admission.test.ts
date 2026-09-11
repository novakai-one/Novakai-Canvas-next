import { describe, it, expect, assert } from 'vitest';
import { createAuthoring, requestSchema, type Write } from '../contract/index.js';
import { gate } from './gates.js';
import {
  harness,
  seed,
  value,
  rejects,
  request,
  diagram,
  catalog,
  put,
  key,
  record,
  workspace,
  media,
  liveCollections,
} from './fixtures.js';
describe('Authoring admission', () => {
  it('1 human create commits collection and catalog together with aligned revisions and detached read', async () => {
    const h = harness();
    const receipt = await seed(h);
    const read = value(await h.api.read(workspace));
    expect(receipt.outcome.status).toBe('committed');
    expect(receipt.versions).toHaveLength(4);
    expect(liveCollections(read)).toHaveLength(1);
    expect(record(read, key('collection', 'demo'))).toMatchObject({
      version: 0,
      value: { revision: 0, title: 'Original' },
    });
    expect(record(read, key('catalog', 'catalog'))).toMatchObject({
      version: 0,
      value: { entries: [{ collection: 'demo' }] },
    });
    expect(Object.isFrozen(read.records)).toBe(true);
    expect(Object.isFrozen(record(read, key('collection', 'demo')).value)).toBe(true);
    expect(h.store.close().ok).toBe(true);
  });
  it('2 agent changes are domain-validated; rejected complete candidates do not mutate or receive receipts', async () => {
    const h = harness();
    await seed(h);
    const before = value(await h.api.read(workspace));
    const edit = request(
      before,
      'agent-edit',
      [put('collection', 'demo', diagram('demo', 'Agent update'), [media])],
      { actor: { id: 'agent', kind: 'agent' } },
    );
    value(await h.api.apply(edit));
    expect(record(value(await h.api.read(workspace)), key('collection', 'demo'))).toMatchObject({
      version: 1,
      value: { title: 'Agent update', revision: 1 },
    });
    const invalid = request(value(await h.api.read(workspace)), 'bad-edit', [
      put('collection', 'demo', { id: 'demo', title: 'Missing required shape' }, [media]),
    ]);
    rejects(await h.api.apply(invalid), 'invariant-violation');
    expect(value(await h.api.receipt(workspace, 'bad-edit'))).toBeNull();
    expect(record(value(await h.api.read(workspace)), key('collection', 'demo')).version).toBe(1);
    h.store.close();
  });
  it('3 missing observations, stale versions, scope escapes, reserved and duplicate writes reject', async () => {
    const h = harness();
    await seed(h);
    const before = value(await h.api.read(workspace));
    const edit = request(before, 'edit', [
      put('collection', 'demo', diagram('demo', 'Changed'), [media]),
    ]);
    rejects(await h.api.apply({ ...edit, expected: [] }), 'invalid-input');
    rejects(
      await h.api.apply({ ...edit, expected: [{ key: key('collection', 'demo'), version: 8 }] }),
      'revision-conflict',
    );
    rejects(await h.api.apply({ ...edit, scope: [] }), 'permission-denied');
    const reserved = request(before, 'reserved', [put('history', 'illegal', {})]);
    rejects(await h.api.apply(reserved), 'permission-denied');
    const duplicate = {
      ...edit,
      intent: {
        ...edit.intent,
        payload: {
          writes: [put('collection', 'demo', diagram()), put('collection', 'demo', diagram())],
          reads: [],
          diff: [],
          warnings: [],
        },
      },
    };
    rejects(await h.api.apply(duplicate), 'invalid-input');
    expect(value(await h.api.read(workspace)).sequence).toBe(before.sequence);
    h.store.close();
  });
  it('4 no-op receipts retain content/history revisions; delete and resurrection preserve monotonic tokens', async () => {
    const h = harness();
    await seed(h);
    const before = value(await h.api.read(workspace));
    const original = record(before, key('collection', 'demo'));
    const noOp = value(
      await h.api.apply(
        request(before, 'same', [put('collection', 'demo', original.value, [media])]),
      ),
    );
    expect(noOp.outcome).toMatchObject({ status: 'no-op', transaction: null });
    expect(noOp.versions).toEqual([]);
    expect(value(await h.api.read(workspace)).records).toEqual(before.records);
    const deleted = value(await h.api.read(workspace));
    const deletes: readonly Write[] = [
      { kind: 'delete', key: key('collection', 'demo') },
      put('catalog', 'catalog', catalog([])),
    ];
    value(await h.api.apply(request(deleted, 'delete', deletes)));
    const tombstone = value(await h.api.read(workspace));
    expect(record(tombstone, key('collection', 'demo'))).toMatchObject({
      version: 1,
      deleted: true,
      value: null,
    });
    value(
      await h.api.apply(
        request(tombstone, 'restore', [
          put('collection', 'demo', diagram(), [media]),
          put('catalog', 'catalog', catalog(['demo'])),
        ]),
      ),
    );
    expect(record(value(await h.api.read(workspace)), key('collection', 'demo'))).toMatchObject({
      version: 2,
      deleted: false,
      value: { revision: 2 },
    });
    h.store.close();
  });
  it('5 preparation hash and discovered dependency versions prevent stale or changed admission', async () => {
    const h = harness();
    await seed(h);
    const before = value(await h.api.read(workspace));
    const edit = request(before, 'prepared', [
      put('collection', 'demo', diagram('demo', 'Prepared'), [media]),
    ]);
    const prepared = value(await h.api.prepare(edit));
    expect(prepared).toHaveProperty('candidateHash');
    const checked = requestSchema.parse({ ...edit, request: 'other' });
    value(await h.api.apply(checked));
    rejects(await h.api.apply(edit), 'revision-conflict');
    const latest = value(await h.api.read(workspace));
    const fresh = request(latest, 'fresh', [
      put('collection', 'demo', diagram('demo', 'Newer'), [media]),
    ]);
    rejects(await h.api.apply(fresh, { candidateHash: 'f'.repeat(64) }), 'revision-conflict');
    const reader = createAuthoring({
      ...h.deps,
      validation: {
        validate: async () => ({
          ok: true,
          value: [{ key: key('catalog', 'catalog'), version: 99 }],
        }),
      },
    });
    rejects(await reader.apply(fresh), 'revision-conflict');
    const exact = value(await h.api.prepare(fresh));
    assert('candidateHash' in exact);
    value(await h.api.apply(fresh, { candidateHash: exact.candidateHash }));
    const raced = value(await h.api.read(workspace));
    const entered = gate();
    const finish = gate();
    const api = createAuthoring({
      ...h.deps,
      feasibility: {
        check: async () => {
          entered.open();
          await finish.promise;
          return { ok: true, value: { warnings: [], diff: [], preview: null } };
        },
      },
    });
    const pending = api.apply(
      request(raced, 'catalog-dependent', [
        put('collection', 'demo', diagram('demo', 'Dependent'), [media]),
      ]),
    );
    await entered.promise;
    value(
      await h.api.apply(
        request(raced, 'catalog-change', [
          put('catalog', 'catalog', {
            schemaVersion: 1,
            id: 'catalog',
            revision: 0,
            folders: [{ id: 'folder', title: 'New folder', order: 0 }],
            entries: [{ collection: 'demo', order: 0, archived: false }],
          }),
        ]),
      ),
    );
    finish.open();
    rejects(await pending, 'revision-conflict');
    h.store.close();
  });
});
