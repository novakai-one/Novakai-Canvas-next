import { describe, it, expect, vi } from 'vitest';
import {
  createAuthoring,
  failure,
  type Result,
  type Receipt,
  type CommitRequest,
} from '../contract/index.js';
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
import { race, gate } from './gates.js';
describe('Authoring retry identity', () => {
  it('6 retry recovers original pins before alias/byte resolution and refuses a changed submitted envelope', async () => {
    const h = harness();
    await seed(h);
    const before = value(await h.api.read(workspace));
    const edit = request(before, 'retry', [
      put('collection', 'demo', diagram('demo', 'Changed'), [media]),
    ]);
    const acquire = vi.fn(h.deps.resources.acquire);
    const api = createAuthoring({ ...h.deps, resources: { acquire } });
    const first = value(await api.apply(edit));
    acquire.mockResolvedValue(failure('missing-asset', 'digest', 'Original source removed'));
    const second = value(await api.apply(edit));
    expect(second).toEqual(first);
    expect(acquire).toHaveBeenCalledTimes(1);
    expect(first.outcome.pins).toEqual({ theme: 'paper@1' });
    rejects(
      await api.apply({ ...edit, assets: [{ alias: 'changed-file', digest: alternate }] }),
      'request-reused',
    );
    expect(value(await api.receipt(workspace, 'retry'))).toEqual(first);
    h.store.close();
  });
  it('7 simultaneous retries have one effect; reused IDs reject; unrelated collection edits both commit', async () => {
    const h = harness();
    await seed(h, ['demo', 'other']);
    const before = value(await h.api.read(workspace));
    const edit = request(before, 'race', [
      put('collection', 'demo', diagram('demo', 'Winner'), [media]),
    ]);
    const identical = await race(h.deps, edit, edit);
    expect(value(identical[0] ?? failure('invalid-input', '$', 'Missing race result'))).toEqual(
      value(identical[1] ?? failure('invalid-input', '$', 'Missing race result')),
    );
    expect(record(value(await h.api.read(workspace)), key('collection', 'demo')).version).toBe(1);
    const second = value(await h.api.read(workspace));
    const left = request(second, 'reused', [
      put('collection', 'demo', diagram('demo', 'Left'), [media]),
    ]);
    const right = request(second, 'reused', [
      put('collection', 'demo', diagram('demo', 'Right'), [media]),
    ]);
    const competing = await race(h.deps, left, right);
    expect(competing.filter((result) => result.ok)).toHaveLength(1);
    expect(competing.filter((result) => !result.ok)).toEqual([
      expect.objectContaining({ error: expect.objectContaining({ code: 'request-reused' }) }),
    ]);
    const current = value(await h.api.read(workspace));
    const independent = await race(
      h.deps,
      request(current, 'one', [put('collection', 'demo', diagram('demo', 'One'), [media])]),
      request(current, 'two', [put('collection', 'other', diagram('other', 'Two'), [media])]),
    );
    expect(independent.every((result) => result.ok)).toBe(true);
    expect(record(value(await h.api.read(workspace)), key('catalog', 'catalog')).version).toBe(0);
    const lateSnapshot = value(await h.api.read(workspace));
    const lateRequest = request(lateSnapshot, 'late-retry', [
      put('collection', 'demo', diagram('demo', 'Late retry'), [media]),
    ]);
    const entered = gate();
    const resume = gate();
    const delayed = createAuthoring({
      ...h.deps,
      snapshots: {
        read: async (workspace) => {
          entered.open();
          await resume.promise;
          return h.deps.snapshots.read(workspace);
        },
      },
    });
    const late = delayed.apply(lateRequest);
    await entered.promise;
    const winner = value(await h.api.apply(lateRequest));
    resume.open();
    expect(value(await late)).toEqual(winner);

    h.store.close();
  });
  it('8 terminal commit acknowledgement loss reconciles receipt; precommit storage failure is retryable', async () => {
    const h = harness();
    await seed(h);
    const before = value(await h.api.read(workspace));
    const edit = request(before, 'uncertain', [
      put('collection', 'demo', diagram('demo', 'Saved'), [media]),
    ]);
    const commits = {
      commit: vi.fn(async (commit: CommitRequest): Promise<Result<Receipt>> => {
        value(await h.deps.commits.commit(commit));
        return failure('storage-unavailable', 'ack', 'Acknowledgement lost');
      }),
    };
    const api = createAuthoring({ ...h.deps, commits });
    const recovered = value(await api.apply(edit));
    expect(recovered.outcome.status).toBe('committed');
    expect(record(value(await api.read(workspace)), key('collection', 'demo')).version).toBe(1);
    const next = request(value(await api.read(workspace)), 'retryable', [
      put('collection', 'demo', diagram('demo', 'Next'), [media]),
    ]);
    const failCommit = vi
      .fn(h.deps.commits.commit)
      .mockResolvedValueOnce(
        failure('storage-unavailable', 'commit', 'Unavailable before transaction'),
      );
    const retry = createAuthoring({ ...h.deps, commits: { commit: failCommit } });
    rejects(await retry.apply(next), 'storage-unavailable');
    expect(value(await retry.receipt(workspace, 'retryable'))).toBeNull();
    value(await retry.apply(next));
    expect(record(value(await retry.read(workspace)), key('collection', 'demo')).version).toBe(2);
    h.store.close();
  });
});
