import { describe, it, expect, assert } from 'vitest';
import {
  createAuthoring,
  requestSchema,
  failure,
  type Authoring,
  type Request,
  type HistoryStatus,
} from '../contract/index.js';
import {
  harness,
  seed,
  value,
  workspace,
  request,
  put,
  diagram,
  media,
  record,
  key,
  rejects,
} from './fixtures.js';
async function edit(api: Authoring, id: string, title: string, collection = 'demo') {
  return api.apply(
    request(value(await api.read(workspace)), id, [
      put('collection', collection, diagram(collection, title), [media]),
    ]),
  );
}
function inverse(status: HistoryStatus, id: string, direction: 'undo' | 'redo'): Request {
  const action = status[direction];
  assert(action);
  return requestSchema.parse({
    version: 1,
    workspace,
    request: id,
    actor: { id: 'human', kind: 'human' },
    assets: [],
    expected: action.expected,
    scope: action.scope,
    intent: { kind: direction, transaction: action.transaction },
  });
}
async function navigate(api: Authoring, id: string, direction: 'undo' | 'redo') {
  return api.apply(inverse(value(await api.history(workspace)), id, direction));
}
async function title(api: Authoring) {
  return record(value(await api.read(workspace)), key('collection', 'demo')).value;
}
async function edits(api: Authoring, from: number, to: number) {
  for (let index = from; index < to; index++) value(await edit(api, `E${index}`, `E${index}`));
}
function historyRecords(snapshot: { records: readonly { key: { kind: string } }[] }) {
  return snapshot.records.filter((item) => item.key.kind === 'history');
}
describe('workspace chronological history', () => {
  it('adopts existing state without making old edits selectable and reopens idempotently', async () => {
    const h = harness();
    await seed(h);
    const original = value(await h.api.read(workspace));
    expect(value(await h.api.initializeHistory(workspace))).toMatchObject({
      undo: null,
      redo: null,
    });
    const adopted = value(await h.api.read(workspace));
    expect(adopted.sequence).toBe(original.sequence + 2);
    expect(record(adopted, key('collection', 'demo'))).toEqual(
      record(original, key('collection', 'demo')),
    );
    expect(adopted.records.some((item) => item.key.id === 'tx:seed')).toBe(false);
    value(await h.api.initializeHistory(workspace));
    expect(value(await h.api.read(workspace))).toEqual(adopted);
    h.store.close();
  });
  it('keeps the last 100 steps, trims old history on open, and undo still works', async () => {
    const h = harness();
    await seed(h);
    await edits(h.api, 0, 30);
    value(await h.api.initializeHistory(workspace));
    expect(historyRecords(value(await h.api.read(workspace)))).toHaveLength(1);
    await edits(h.api, 30, 135);
    const bounded = value(await h.api.read(workspace));
    expect(historyRecords(bounded)).toHaveLength(201);
    expect(bounded.records.some((item) => item.key.id === 'tx:E34')).toBe(false);
    for (const id of ['U1', 'U2', 'U3']) value(await navigate(h.api, id, 'undo'));
    expect(await title(h.api)).toMatchObject({ title: 'E131' });
    expect(value(await h.api.history(workspace)).redo?.transaction).toBe('E132');
    h.store.close();
  }, 60_000);
  it('A B undo B undo A redo A redo B restores contents with fresh versions', async () => {
    const h = harness();
    await seed(h);
    value(await h.api.initializeHistory(workspace));
    value(await edit(h.api, 'A', 'A'));
    value(await edit(h.api, 'B', 'B'));
    value(await navigate(h.api, 'undo-B', 'undo'));
    expect(await title(h.api)).toMatchObject({ title: 'A', revision: 3 });
    value(await navigate(h.api, 'undo-A', 'undo'));
    expect(await title(h.api)).toMatchObject({ title: 'Original', revision: 4 });
    value(await navigate(h.api, 'redo-A', 'redo'));
    expect(await title(h.api)).toMatchObject({ title: 'A', revision: 5 });
    value(await navigate(h.api, 'redo-B', 'redo'));
    expect(await title(h.api)).toMatchObject({ title: 'B', revision: 6 });
    expect(value(await h.api.history(workspace))).toMatchObject({
      undo: { transaction: 'B' },
      redo: null,
    });
    h.store.close();
  });
  it('no-op and replay retain redo; a new edit in another collection truncates redo', async () => {
    const h = harness();
    await seed(h, ['demo', 'other']);
    value(await h.api.initializeHistory(workspace));
    value(await edit(h.api, 'A', 'A'));
    value(await navigate(h.api, 'undo-A', 'undo'));
    const state = value(await h.api.read(workspace));
    const unchanged = request(state, 'no-op', [
      put('collection', 'demo', record(state, key('collection', 'demo')).value, [media]),
    ]);
    const receipt = value(await h.api.apply(unchanged));
    expect(receipt.outcome.status).toBe('no-op');
    expect(value(await h.api.apply(unchanged))).toEqual(receipt);
    expect(value(await h.api.history(workspace)).redo?.transaction).toBe('A');
    value(await edit(h.api, 'C', 'Changed elsewhere', 'other'));
    expect(value(await h.api.history(workspace))).toMatchObject({
      undo: { transaction: 'C' },
      redo: null,
    });
    const records = value(await h.api.read(workspace)).records;
    expect(records.some((item) => item.key.id === 'tx:A')).toBe(false);
    h.store.close();
  });
  it('two inverse requests from the same status commit once; stale navigation never retargets', async () => {
    const h = harness();
    await seed(h);
    value(await h.api.initializeHistory(workspace));
    value(await edit(h.api, 'A', 'A'));
    const status = value(await h.api.history(workspace));
    const results = await Promise.all([
      h.api.apply(inverse(status, 'U1', 'undo')),
      h.api.apply(inverse(status, 'U2', 'undo')),
    ]);
    expect(results.filter((item) => item.ok)).toHaveLength(1);
    expect(results.filter((item) => !item.ok)).toHaveLength(1);
    expect(await title(h.api)).toMatchObject({ title: 'Original', revision: 2 });
    rejects(await h.api.apply(inverse(status, 'U3', 'undo')), 'revision-conflict');
    h.store.close();
  });
  it('inverse validation or commit failure changes neither content nor cursor', async () => {
    const h = harness();
    await seed(h);
    value(await h.api.initializeHistory(workspace));
    value(await edit(h.api, 'A', 'A'));
    const before = value(await h.api.read(workspace));
    const command = inverse(value(await h.api.history(workspace)), 'undo-A', 'undo');
    const invalid = createAuthoring({
      ...h.deps,
      feasibility: { check: async () => failure('constraint-conflict', 'test', 'Cannot render') },
    });
    rejects(await invalid.apply(command), 'constraint-conflict');
    const failed = createAuthoring({
      ...h.deps,
      commits: { commit: async () => failure('storage-unavailable', 'test', 'Cannot commit') },
    });
    rejects(await failed.apply(command), 'storage-unavailable');
    expect(value(await h.api.read(workspace))).toEqual(before);
    h.store.close();
  });
  it('reopened facade preserves redo and a lost commit acknowledgement replays only its receipt', async () => {
    const h = harness();
    await seed(h);
    value(await h.api.initializeHistory(workspace));
    value(await edit(h.api, 'A', 'A'));
    const command = inverse(value(await h.api.history(workspace)), 'undo-A', 'undo');
    const lost = createAuthoring({
      ...h.deps,
      commits: {
        commit: async (input) => {
          value(await h.deps.commits.commit(input));
          return failure('storage-unavailable', 'test', 'Lost acknowledgement');
        },
      },
    });
    const receipt = value(await lost.apply(command));
    const reopened = createAuthoring(h.deps);
    expect(value(await reopened.initializeHistory(workspace)).redo?.transaction).toBe('A');
    expect(value(await reopened.apply(command))).toEqual(receipt);
    expect(await title(reopened)).toMatchObject({ revision: 2, title: 'Original' });
    h.store.close();
  });
  it('a prepared edit cannot reuse its hash after history changes in another collection', async () => {
    const h = harness();
    await seed(h, ['demo', 'other']);
    value(await h.api.initializeHistory(workspace));
    const command = request(value(await h.api.read(workspace)), 'prepared', [
      put('collection', 'demo', diagram('demo', 'Prepared'), [media]),
    ]);
    const prepared = value(await h.api.prepare(command));
    assert('candidateHash' in prepared);
    value(await edit(h.api, 'foreign', 'Other edit', 'other'));
    const before = value(await h.api.read(workspace));
    rejects(
      await h.api.apply(command, { candidateHash: prepared.candidateHash }),
      'revision-conflict',
    );
    expect(value(await h.api.read(workspace))).toEqual(before);
    h.store.close();
  });
  it('concurrent startup adopts once even when the first receipt read predates adoption', async () => {
    const h = harness();
    await seed(h);
    let first = true;
    const racing = createAuthoring({
      ...h.deps,
      receipts: {
        find: async (workspace, id) => {
          const receipt = await h.deps.receipts.find(workspace, id);
          if (first) {
            first = false;
            value(await h.api.initializeHistory(workspace));
          }
          return receipt;
        },
      },
    });
    expect(value(await racing.initializeHistory(workspace))).toEqual(
      value(await h.api.history(workspace)),
    );
    h.store.close();
  });
  it('reopening rejects repeated retained participants before exposing history controls', async () => {
    const h = harness();
    await seed(h);
    value(await h.api.initializeHistory(workspace));
    value(await edit(h.api, 'A', 'A'));
    const snapshot = value(await h.api.read(workspace));
    const corrupt = {
      ...snapshot,
      records: snapshot.records.map((item) => {
        const field = new Map([
          ['tx:A', 'transitions'],
          ['head:A', 'participants'],
        ]).get(item.key.id);
        if (!field) return item;
        const data = item.value as Record<string, import('../contract/index.js').Json>;
        const items = data[field] as readonly import('../contract/index.js').Json[];
        return { ...item, value: { ...data, [field]: [...items, ...items] } };
      }),
    };
    const reopened = createAuthoring({
      ...h.deps,
      snapshots: { read: async () => ({ ok: true, value: corrupt }) },
    });
    const result = await reopened.initializeHistory(workspace);
    expect(result.ok).toBe(false);
    h.store.close();
  });
});
