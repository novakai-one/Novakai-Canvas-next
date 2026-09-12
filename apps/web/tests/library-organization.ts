import { assert, expect } from 'vitest';
import { requestSchema } from '@novakai/canvas-authoring';
import type { Snapshot } from '@novakai/canvas-authoring';
import type { WorkspaceSession } from '@novakai/canvas-service';
/** Extends host case2: organization uses the real Library planner and conditional Authoring transaction. */
export async function verifyLibraryOrganization(
  session: WorkspaceSession,
  before: Snapshot,
): Promise<void> {
  const catalog = before.records.find((record) => record.key.kind === 'catalog' && !record.deleted);
  assert(catalog);
  const request = requestSchema.parse({
    version: 1,
    workspace: before.workspace,
    request: 'organize-library',
    actor: { id: 'human:browser', kind: 'human' },
    assets: [],
    expected: [{ key: catalog.key, version: catalog.version }],
    scope: [catalog.key],
    intent: {
      kind: 'change',
      planner: 'library',
      payload: {
        changes: [
          { op: 'create-folder', value: { id: 'engineering', title: 'Engineering', order: 0 } },
          {
            op: 'replace-entry',
            value: { collection: 'sample', folder: 'engineering', order: 0, archived: true },
          },
        ],
      },
    },
  });
  const signal = new AbortController().signal;
  const receipt = await session.apply(request, signal);
  assert(receipt.ok, JSON.stringify(receipt));
  const after = await session.read();
  assert(after.ok);
  expect(after.value.records.filter((record) => record.key.kind === 'collection')).toEqual(
    before.records.filter((record) => record.key.kind === 'collection'),
  );
  expect(after.value.records.find((record) => record.key.kind === 'catalog')?.value).toMatchObject({
    folders: [{ id: 'engineering', title: 'Engineering' }],
    entries: [{ collection: 'sample', folder: 'engineering', archived: true }],
  });
  expect(await session.apply(request, signal)).toEqual(receipt);
  const stale = requestSchema.parse({ ...request, request: 'stale-library-edit' });
  expect(await session.apply(stale, signal)).toMatchObject({
    ok: false,
    error: { code: 'revision-conflict' },
  });
  expect(await session.read()).toEqual(after);
}
