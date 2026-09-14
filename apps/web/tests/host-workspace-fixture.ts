import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert } from 'vitest';
import { openWorkspace } from '@novakai/canvas-service';
import { requestSchema } from '@novakai/canvas-authoring';
import type { Request, Snapshot } from '@novakai/canvas-authoring';
import type { WorkspaceSession } from '@novakai/canvas-service';
/** In-process integration opens the actual owner composition; there is no HTTP, browser or replacement planner. */
export async function workspaceFixture(): Promise<{
  readonly session: WorkspaceSession;
  readonly directory: string;
  close(): Promise<void>;
  reopen(): Promise<WorkspaceSession>;
}> {
  const directory = await mkdtemp(join(tmpdir(), 'canvas-host-contract-'));
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const options = {
    directory,
    workspace: 'integration',
    title: 'Integration workspace',
    resourceRoot: join(root, 'resources'),
    tokenRoot: join(root, 'capability/design-system'),
    createdAt: 1,
  };
  const opened = await openWorkspace(options);
  if (!opened.ok) await rm(directory, { recursive: true, force: true });
  assert(opened.ok, JSON.stringify(opened));
  let active = opened.value;
  return {
    session: opened.value,
    directory,
    reopen: async () => {
      assert((await active.close()).ok);
      const reopened = await openWorkspace(options);
      assert(reopened.ok, JSON.stringify(reopened));
      active = reopened.value;
      return active;
    },
    close: async () => {
      await active.close();
      await rm(directory, { recursive: true, force: true });
    },
  };
}
/** Every expected version is explicit in the same public Authoring envelope used by both host pathways. */
export function request(
  snapshot: Snapshot,
  id: string,
  collection: string,
  planner: 'dsl' | 'model',
  payload: unknown,
  create = false,
): Request {
  const current = snapshot.records.find(
    (item) => item.key.kind === 'collection' && item.key.id === collection,
  );
  const key = { kind: 'collection', id: collection };
  const expected = [
    { key, version: current?.version ?? 'absent' },
    ...catalogVersions(snapshot, create),
  ];
  return requestSchema.parse({
    version: 1,
    workspace: snapshot.workspace,
    request: id,
    actor: { id: planner, kind: planner === 'dsl' ? 'agent' : 'human' },
    expected,
    scope: expected.map((item) => item.key),
    assets: [],
    intent: { kind: 'change', planner, payload },
  });
}
/** Creation must atomically register catalog membership; existing edits never acquire catalog write scope. */
function catalogVersions(snapshot: Snapshot, create: boolean) {
  if (!create) return [];
  return snapshot.records
    .filter((item) => item.key.kind === 'catalog' && !item.deleted)
    .map((item) => ({ key: item.key, version: item.version }));
}
export const source = `canvas 1
collection @sample "Sample" theme=paper {
 node @one step "First" {}
 node @two step "Second" {}
 wire @next @one -> @two "then"
 section @process "Process" mode=flow layout=flow direction=right { show @one @two connect @next }
}`;
export const nested = `canvas 1
collection @nested "Nested" theme=paper {
 node @one step "First" {}
 node @two step "Second" {}
 section @story "Nested process" mode=story {
  group @boundary "Boundary" layout=grid { show @one @two }
 }
}`;
