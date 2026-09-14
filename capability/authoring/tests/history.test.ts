import { describe, it, expect, vi } from 'vitest';
import { createAuthoring, failure } from '../contract/index.js';
import {
  harness,
  seed,
  value,
  rejects,
  request,
  diagram,
  put,
  key,
  record,
  workspace,
  media,
  alternate,
} from './fixtures.js';
import { inverse, replaceHistoryBefore } from './history-fixtures.js';
describe('Authoring reversible transactions', () => {
  it('9 undo restores every participant/resource and redo reapplies with advancing revisions', async () => {
    const h = harness();
    await seed(h, ['demo', 'other']);
    const before = value(await h.api.read(workspace));
    const keys = [key('collection', 'demo'), key('collection', 'other')];
    value(
      await h.api.apply(
        request(before, 'pair', [
          put('collection', 'demo', diagram('demo', 'First', alternate), [alternate]),
          put('collection', 'other', diagram('other', 'Second', alternate), [alternate]),
        ]),
      ),
    );
    const changed = value(await h.api.read(workspace));
    value(await h.api.undo(inverse(changed, 'undo-pair', 'pair', 'undo', keys)));
    const undone = value(await h.api.read(workspace));
    expect(keys.map((key) => record(undone, key))).toEqual([
      expect.objectContaining({
        version: 2,
        value: expect.objectContaining({ title: 'Original', revision: 2 }),
        resources: [media],
      }),
      expect.objectContaining({
        version: 2,
        value: expect.objectContaining({ title: 'Original', revision: 2 }),
        resources: [media],
      }),
    ]);
    expect(record(undone, key('history', 'tx:pair')).resources.toSorted()).toEqual(
      [media, alternate].toSorted(),
    );
    value(await h.api.redo(inverse(undone, 'redo-pair', 'pair', 'redo', keys)));
    const redone = value(await h.api.read(workspace));
    expect(keys.map((key) => record(redone, key).version)).toEqual([3, 3]);
    expect(record(redone, keys[0] ?? key('collection', 'demo'))).toMatchObject({
      value: { title: 'First' },
      resources: [alternate],
    });
    expect(record(redone, key('history', 'head:pair')).value).toMatchObject({
      state: 'active',
      last: 'redo-pair',
    });
    h.store.close();
  });
  it('10 missing history, duplicate inverse, divergent participants and invalid/infeasible inverse reject atomically', async () => {
    const h = harness();
    await seed(h);
    const keys = [key('collection', 'demo')];
    const before = value(await h.api.read(workspace));
    value(
      await h.api.apply(
        request(before, 'edit', [put('collection', 'demo', diagram('demo', 'Changed'), [media])]),
      ),
    );
    const current = value(await h.api.read(workspace));
    const undo = inverse(current, 'undo', 'edit', 'undo', keys);
    const check = vi.fn(async () =>
      failure<never>('constraint-conflict', 'locked-route', 'Old geometry infeasible'),
    );
    rejects(
      await createAuthoring({ ...h.deps, feasibility: { check } }).undo(undo),
      'constraint-conflict',
    );
    expect(check).toHaveBeenCalledTimes(1);
    const validation = vi.fn(async () =>
      failure<never>('invariant-violation', 'admission', 'Retained source unavailable'),
    );
    rejects(
      await createAuthoring({ ...h.deps, validation: { validate: validation } }).undo(undo),
      'invariant-violation',
    );
    expect(value(await h.api.read(workspace)).sequence).toBe(current.sequence);
    value(await h.api.undo(undo));
    const undone = value(await h.api.read(workspace));
    rejects(await h.api.undo(inverse(undone, 'double', 'edit', 'undo', keys)), 'revision-conflict');
    value(
      await h.api.apply(
        request(undone, 'divergent', [
          put('collection', 'demo', diagram('demo', 'Divergent'), [media]),
        ]),
      ),
    );
    const divergent = value(await h.api.read(workspace));
    rejects(
      await h.api.redo(inverse(divergent, 'redo', 'edit', 'redo', keys)),
      'revision-conflict',
    );
    rejects(
      await h.api.undo(inverse(divergent, 'missing', 'absent', 'undo', keys)),
      'unknown-reference',
    );

    const initial = value(await h.api.read(workspace));
    value(
      await h.api.apply(
        request(initial, 'metadata-init', [
          put('workspace', 'a', { label: 'A' }),
          put('workspace', 'b', { label: 'B' }),
        ]),
      ),
    );
    value(
      await h.api.apply(
        request(value(await h.api.read(workspace)), 'metadata-edit', [
          put('workspace', 'a', { label: 'A edited' }),
        ]),
      ),
    );
    const metadata = value(await h.api.read(workspace));
    const malformed = replaceHistoryBefore(metadata, 'metadata-edit', key('workspace', 'b'));
    const corrupt = createAuthoring({
      ...h.deps,
      snapshots: { read: async () => ({ ok: true, value: malformed }) },
    });
    rejects(
      await corrupt.undo(
        inverse(metadata, 'wrong-image', 'metadata-edit', 'undo', [key('workspace', 'a')]),
      ),
      'corrupt-record',
    );
    expect(record(value(await h.api.read(workspace)), key('workspace', 'a'))).toMatchObject({
      version: 1,
      value: { label: 'A edited' },
    });
    h.store.close();
  });
});
