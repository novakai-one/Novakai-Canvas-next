import { assert, expect, it } from 'vitest';
import type { ServiceClient } from '../contract/ports/client.js';
import type { Request, TransportResponse } from '../contract/records/owners.js';
import type { Result } from '../contract/index.js';
import type { DraftRetention } from '../contract/ports/workspace.js';
import type { WorkspaceSession } from '@novakai/canvas-service';
import { definitionDraftId } from '../contract/api.js';
import { dropObject } from '../adapters/react/palette-drop.js';
import { controller, memoryRetention, submitted } from './recovery-fixtures.js';
import { workspaceFixture, request, source } from './host-workspace-fixture.js';

/** The owner refusal a layout failure produces; its message is raw JSON on purpose. */
function refusal(): Result<TransportResponse> {
  return envelope({
    ok: false,
    error: {
      code: 'invalid-input',
      path: 'changes/0',
      message: '{"code":"unroutable-leg"}',
      recovery: 'Nothing was changed.',
    },
  });
}
function envelope(outcome: unknown): Result<TransportResponse> {
  return {
    ok: true,
    value: { version: 1, generation: 'generation-one', outcome } as TransportResponse,
  };
}
/** Real in-process service; only the next `refuse.count` applies are answered with a refusal instead. */
function serviceClient(
  service: WorkspaceSession,
  sent: Request[],
  refuse: { count: number },
): ServiceClient {
  const signal = new AbortController().signal;
  const reads: Record<string, (query: URLSearchParams) => Promise<unknown>> = {
    '/api/v1/workspace': () => service.read(),
    '/api/v1/history': () => service.history(),
    '/api/v1/render': (query) => service.render(query.get('id') ?? '', signal),
    '/api/v1/receipt': (query) => service.receipt(query.get('id')),
  };
  return {
    get: async (path) => {
      const [route = '', query = ''] = path.split('?');
      const read = reads[route];
      assert(read, `unexpected GET ${route}`);
      return envelope(await read(new URLSearchParams(query)));
    },
    post: async (_path, input) => {
      const body = submitted(input);
      sent.push(body);
      if (refuse.count-- > 0) return refusal();
      return envelope(await service.apply(body, signal));
    },
    changes: () => () => undefined,
  };
}
async function withSample(test: (service: WorkspaceSession) => Promise<void>): Promise<void> {
  const fixture = await workspaceFixture();
  try {
    const before = await fixture.session.read();
    assert(before.ok);
    const created = await fixture.session.apply(
      request(before.value, 'sample', 'sample', 'dsl', { source, mode: 'create' }, true),
      new AbortController().signal,
    );
    assert(created.ok, JSON.stringify(created));
    await test(fixture.session);
  } finally {
    await fixture.close();
  }
}
async function opened(client: ServiceClient, retention: DraftRetention = memoryRetention()) {
  const human = controller(client, retention);
  await human.start();
  await human.open('sample');
  assert(human.getSnapshot().active !== null, JSON.stringify(human.getSnapshot().problem));
  return human;
}
const module = {
  section: 'process',
  group: null,
  kind: 'module' as const,
  label: 'Parser',
  reuseObject: null,
};

it('a refused creation releases its request so the Add form is editable and the next add is a new request', async () => {
  await withSample(async (service) => {
    const sent: Request[] = [];
    const human = await opened(serviceClient(service, sent, { count: 1 }));
    expect(await human.addObject(module)).toMatchObject({ ok: false });
    expect(human.getSnapshot().creation.busy).toBe(false);
    expect(human.getSnapshot().status).not.toContain('{');
    expect(await human.addObject(module)).toMatchObject({ ok: true });
    expect(sent).toHaveLength(2);
    expect(sent[1]?.request).not.toBe(sent[0]?.request);
    human.dispose();
  });
});

it('shows one refusal at a time and clears it when a later edit starts', async () => {
  await withSample(async (service) => {
    const sent: Request[] = [];
    const human = await opened(serviceClient(service, sent, { count: 2 }));
    await human.addObject(module);
    await human.addObject({ ...module, label: 'Lexer' });
    const refused = human.getSnapshot().pending;
    expect(refused).toHaveLength(1);
    expect(refused[0]).toMatchObject({ state: 'rejected', request: { request: sent[1]?.request } });
    expect(await human.addObject({ ...module, label: 'Emitter' })).toMatchObject({ ok: true });
    expect(human.getSnapshot().pending).toEqual([]);
    expect(human.getSnapshot().status).toBe('Saved');
    human.dispose();
  });
});

it('blocks palette drops on tree sections with a plain message and sends nothing', () => {
  const reports: string[] = [];
  let adds = 0;
  const sections = [
    { id: 'outline', mode: 'tree', title: 'Outline' },
    { id: 'process', mode: 'flow', title: 'Process' },
  ];
  const target = {
    report: (error: { message: string }) => {
      reports.push(error.message);
    },
    addObject: async () => {
      adds++;
      return envelope(null) as never;
    },
  };
  dropObject(target, sections, 'module', { section: 'outline', group: null });
  expect(reports).toEqual([
    "Modules can't be dropped into a tree. Drop it into a diagram section instead.",
  ]);
  expect(adds).toBe(0);
  dropObject(target, sections, 'module', { section: 'process', group: null });
  expect(adds).toBe(1);
});

it('a refused definition stays editable after reload', async () => {
  await withSample(async (service) => {
    const retention = memoryRetention();
    const sent: Request[] = [];
    const human = await opened(serviceClient(service, sent, { count: 1 }), retention);
    const active = human.getSnapshot().active;
    assert(active !== null);
    const created = human.definitions.create(
      { base: active.base, generation: active.generation, collection: active.document.collection },
      {
        id: definitionDraftId('definition-actor'),
        label: 'Actor',
        expression: { kind: 'literal', value: 'Human' },
      },
    );
    assert(created.ok, JSON.stringify(created));
    const key = human.definitions.getSnapshot().drafts[0]?.key;
    assert(key !== undefined);
    await human.definitions.apply(key);
    expect(sent).toHaveLength(1);
    expect(human.getSnapshot().pending).toMatchObject([{ state: 'rejected' }]);
    human.dispose();

    const reloaded = await opened(serviceClient(service, sent, { count: 0 }), retention);
    expect(reloaded.getSnapshot().pending).toEqual([]);
    const drafts = reloaded.definitions.getSnapshot();
    expect(drafts.pending).toEqual([]);
    expect(drafts.drafts[0]).toMatchObject({ key });
    expect(drafts.drafts[0]?.request).toBeUndefined();
    expect(await reloaded.definitions.apply(key)).toMatchObject({ ok: true });
    reloaded.dispose();
  });
});
