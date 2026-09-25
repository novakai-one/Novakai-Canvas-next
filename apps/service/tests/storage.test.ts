import { it, expect, assert } from 'vitest';
import { openSqlite } from '@novakai/canvas-persistence';
import {
  workspaceId,
  requestId,
  digest,
  recordId,
  type CommitRequest,
} from '@novakai/canvas-authoring';
import { createAuthoringStore } from '../adapters/workspace/authoring-store.js';

/** Real in-memory SQLite verifies the mapping; service callers own receipt reconciliation after acknowledgement loss. */
it('host 1 preserves conditional versions, receipt identity and workspace isolation', async () => {
  const opened = openSqlite(':memory:', 'host-workspace');
  assert(opened.ok, JSON.stringify(opened));
  const storage = opened.value;
  try {
    const bridge = createAuthoringStore(storage);
    const workspace = workspaceId.parse('host-workspace');
    const key = { kind: 'workspace' as const, id: recordId.parse('metadata') };
    const initial = await bridge.snapshots.read(workspace);
    expect(initial).toEqual({ ok: true, value: { workspace, sequence: 0, records: [] } });
    const request: CommitRequest = {
      workspace,
      request: requestId.parse('first-write'),
      fingerprint: digest.parse('a'.repeat(64)),
      expected: [{ key, version: 'absent' }],
      writes: [{ kind: 'put', key, value: { title: 'Readable workspace' }, resources: [] }],
      outcome: {
        status: 'committed',
        transaction: requestId.parse('first-write'),
        pins: {},
        diff: {},
        warnings: [],
      },
    };
    const committed = await bridge.commits.commit(request);
    assert(committed.ok, JSON.stringify(committed));
    expect(committed.value.sequence).toBe(1);
    expect(committed.value.versions).toEqual([{ key, version: 0 }]);
    expect(await bridge.receipts.find(workspace, request.request)).toEqual(committed);
    expect(await bridge.commits.commit(request)).toEqual(committed);
    expect(
      await bridge.commits.commit({ ...request, request: requestId.parse('stale-write') }),
    ).toMatchObject({ ok: false, error: { code: 'revision-conflict' } });
    expect(await bridge.snapshots.read(workspace)).toMatchObject({
      ok: true,
      value: {
        sequence: 1,
        records: [{ key, version: 0, deleted: false, value: { title: 'Readable workspace' } }],
      },
    });
    expect(await bridge.receipts.find(workspace, requestId.parse('uncommitted'))).toEqual({
      ok: true,
      value: null,
    });
    expect(
      await bridge.commits.commit({
        ...request,
        workspace: workspaceId.parse('another-workspace'),
      }),
    ).toMatchObject({ ok: false, error: { code: 'permission-denied' } });
  } finally {
    expect(storage.close()).toEqual({ ok: true, value: undefined });
  }
});
