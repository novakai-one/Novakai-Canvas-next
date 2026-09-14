import { describe, it, expect, vi } from 'vitest';
import {
  createAuthoring,
  failure,
  plannerId,
  requestSchema,
  workspaceId,
  type Diagnostic,
  type Snapshot,
  type RecordKey,
  type WorkspaceId,
  type Result,
  type ResourceLease,
  type FeasibilityReport,
} from '../contract/index.js';
import { createNodeIdentity } from '../adapters/node-identity.js';
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
} from './fixtures.js';
import { gate } from './gates.js';
describe('Authoring resource and failure boundaries', () => {
  it('11 hard feasibility runs without preview, soft adjustments survive receipt, no-op skips geometry', async () => {
    const h = harness();
    await seed(h);
    const before = value(await h.api.read(workspace));
    const edit = request(before, 'hard', [
      put('collection', 'demo', diagram('demo', 'Changed'), [media]),
    ]);
    const check = vi.fn(
      async (
        _candidate: Snapshot,
        _changed: readonly RecordKey[],
        _preview: boolean,
      ): Promise<Result<FeasibilityReport>> => {
        void [_candidate, _changed, _preview];
        return failure('constraint-conflict', 'route', 'Locked route blocked');
      },
    );
    const api = createAuthoring({ ...h.deps, feasibility: { check } });
    rejects(await api.apply(edit), 'constraint-conflict');
    expect(check.mock.calls[0]).toHaveLength(3);
    expect(check.mock.calls[0]?.[2]).toBe(false);
    expect(value(await api.receipt(workspace, 'hard'))).toBeNull();
    const warning: Diagnostic = {
      code: 'constraint-conflict',
      path: 'soft-position',
      targets: ['demo'],
      message: 'Soft preference adjusted',
      recovery: 'Review preview',
      traceId: null,
    };
    const soft = createAuthoring({
      ...h.deps,
      feasibility: {
        check: async () => ({
          ok: true,
          value: { warnings: [warning], diff: { moved: ['demo'] }, preview: null },
        }),
      },
    });
    const saved = value(await soft.apply({ ...edit, request: 'soft' }));
    expect(saved.outcome.warnings).toEqual([warning]);
    expect(saved.outcome.diff).toMatchObject({ geometry: { moved: ['demo'] } });
    const latest = value(await api.read(workspace));
    const data = record(latest, key('collection', 'demo'));
    value(
      await api.apply(
        request(latest, 'noop', [put('collection', 'demo', data.value, data.resources)]),
      ),
    );
    expect(check).toHaveBeenCalledTimes(1);
    h.store.close();
  });
  it('12 missing bytes and uncovered history resources reject; acquired leases release on failure and success', async () => {
    const h = harness();
    await seed(h);
    const before = value(await h.api.read(workspace));
    const edit = request(before, 'media', [
      put('collection', 'demo', diagram('demo', 'Changed'), [media]),
    ]);
    rejects(
      await createAuthoring({
        ...h.deps,
        resources: { acquire: async () => failure('missing-asset', 'digest', 'Missing source') },
      }).apply(edit),
      'missing-asset',
    );
    const release = vi.fn(async (): Promise<Result<void>> => ({ ok: true, value: undefined }));
    const acquire = vi.fn(async (): Promise<Result<ResourceLease>> => ({
      ok: true,
      value: { pins: {}, reads: [], covered: [], release },
    }));
    rejects(
      await createAuthoring({ ...h.deps, resources: { acquire } }).apply(edit),
      'missing-asset',
    );
    expect(release).toHaveBeenCalledTimes(1);
    acquire.mockResolvedValue({
      ok: true,
      value: { pins: {}, reads: [], covered: [media], release },
    });
    value(await createAuthoring({ ...h.deps, resources: { acquire } }).apply(edit));
    expect(release).toHaveBeenCalledTimes(2);
    const current = value(await h.api.read(workspace));
    const deletion = request(current, 'retention', [
      { kind: 'delete', key: key('collection', 'demo') },
      put('catalog', 'catalog', {
        schemaVersion: 1,
        id: 'catalog',
        revision: 0,
        folders: [],
        entries: [],
      }),
    ]);
    acquire.mockResolvedValue({ ok: true, value: { pins: {}, reads: [], covered: [], release } });
    rejects(
      await createAuthoring({ ...h.deps, resources: { acquire } }).apply(deletion),
      'missing-asset',
    );
    expect(record(value(await h.api.read(workspace)), key('collection', 'demo')).deleted).toBe(
      false,
    );
    const entered = gate();
    const terminal = gate();
    const delayedRelease = vi.fn(async (): Promise<Result<void>> => {
      throw new Error('release failed');
    });
    const delayed = createAuthoring({
      ...h.deps,
      resources: {
        acquire: async () => ({
          ok: true,
          value: { pins: {}, reads: [], covered: [media], release: delayedRelease },
        }),
      },
      commits: {
        commit: async (commit) => {
          entered.open();
          await terminal.promise;
          return h.deps.commits.commit(commit);
        },
      },
    });
    const pending = delayed.apply(deletion);
    await entered.promise;
    expect(delayedRelease).not.toHaveBeenCalled();
    terminal.open();
    expect(value(await pending).outcome.status).toBe('committed');
    expect(delayedRelease).toHaveBeenCalledTimes(1);
    h.store.close();
  });
  it('13 cancellation before commit rejects; cancellation/notification failure after commit cannot undo success', async () => {
    const h = harness();
    await seed(h);
    const before = value(await h.api.read(workspace));
    const edit = request(before, 'cancel', [
      put('collection', 'demo', diagram('demo', 'Changed'), [media]),
    ]);
    const cancelled = vi.fn(() => true);
    rejects(
      await createAuthoring({ ...h.deps, cancellation: { cancelled } }).apply(edit),
      'cancelled',
    );
    expect(value(await h.api.receipt(workspace, 'cancel'))).toBeNull();
    cancelled.mockReturnValue(false);
    const publish = vi.fn(async (): Promise<Result<void>> => {
      cancelled.mockReturnValue(true);
      throw new Error('lost hint');
    });
    const api = createAuthoring({
      ...h.deps,
      cancellation: { cancelled },
      notifications: { publish },
    });
    const first = value(await api.apply(edit));
    expect(first.outcome.status).toBe('committed');
    expect(value(await api.apply(edit))).toEqual(first);
    expect(publish).toHaveBeenCalledTimes(1);
    h.store.close();
  });
  it('14 malformed/oversized/unsupported input and provider faults are bounded; input is detached before await', async () => {
    const h = harness();
    await seed(h);
    const before = value(await h.api.read(workspace));
    const edit = request(before, 'detached', [
      put('collection', 'demo', diagram('demo', 'Changed'), [media]),
    ]);
    rejects(await h.api.apply({ ...edit, version: 2 }), 'unsupported-version');
    rejects(await h.api.apply({ ...edit, extra: NaN }), 'invalid-input');
    const oversized = {
      ...edit,
      intent: {
        kind: 'change',
        planner: 'fixture',
        payload: { writes: [], reads: [], warnings: [], diff: 'x'.repeat(16 * 1024 * 1024) },
      },
    };
    expect(requestSchema.safeParse(oversized).success).toBe(true);
    rejects(await h.api.apply(oversized), 'invalid-input');
    const wrongWorkspace = createAuthoring({
      ...h.deps,
      snapshots: {
        read: async () => ({
          ok: true,
          value: { ...before, workspace: workspaceId.parse('other') },
        }),
      },
    });
    rejects(await wrongWorkspace.apply(edit), 'corrupt-record');
    const getter = vi.fn(() => 1);
    const unsafe = Object.defineProperty({ ...edit }, 'extra', { enumerable: true, get: getter });
    rejects(await h.api.apply(unsafe), 'invalid-input');
    expect(getter).not.toHaveBeenCalled();
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    rejects(await h.api.apply(cyclic), 'invalid-input');
    const bad = createAuthoring({
      ...h.deps,
      planners: [
        {
          id: plannerId.parse('fixture'),
          plan: async () => {
            throw new Error('private provider details');
          },
        },
      ],
    });
    const failed = await bad.apply(edit);
    rejects(failed, 'storage-unavailable');
    expect(JSON.stringify(failed)).not.toContain('private provider details');
    const waiting = gate();
    const entered = gate();
    const read = vi.fn(async (workspace: WorkspaceId) => {
      entered.open();
      await waiting.promise;
      return h.deps.snapshots.read(workspace);
    });
    const api = createAuthoring({ ...h.deps, snapshots: { read } });
    const mutable = { ...structuredClone(edit), actor: { ...edit.actor } };
    const pending = api.apply(mutable);
    await entered.promise;
    mutable.actor.kind = 'agent';
    waiting.open();
    const committed = value(await pending);
    expect(
      record(value(await h.api.read(workspace)), key('history', 'tx:detached')).value,
    ).toMatchObject({ actor: { kind: 'human' } });
    expect(value(await h.api.apply(edit))).toEqual(committed);
    const maximum = {
      ...edit,
      request: 'r'.repeat(120),
      expected: [],
      scope: [],
      intent: {
        kind: 'change',
        planner: 'fixture',
        payload: { writes: [], reads: [], diff: [], warnings: [] },
      },
    };
    expect(value(await h.api.apply(maximum)).request).toHaveLength(120);
    rejects(await h.api.apply({ ...maximum, request: 'r'.repeat(121) }), 'invalid-input');
    const identity = createNodeIdentity();
    expect(value(identity.hash.digest('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    rejects(
      createNodeIdentity(() => {
        throw new Error('hash failure');
      }).hash.digest('abc'),
      'storage-unavailable',
    );
    h.store.close();
  });
});
