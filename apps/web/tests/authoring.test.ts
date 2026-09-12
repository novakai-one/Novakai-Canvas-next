import { verifyLibraryOrganization } from './library-organization.js';
import { it, expect, assert } from 'vitest';
import { validate } from '@novakai/canvas-model';
import { workspaceFixture, request, source, nested } from './host-workspace-fixture.js';
import { planCanvasEdit } from '../contract/index.js';

it('host 2 atomically registers DSL collections, rejects stale changes and returns the same receipt on retry', async () => {
  const fixture = await workspaceFixture();
  const session = fixture.session;
  const signal = new AbortController().signal;
  try {
    const initial = await session.read();
    assert(initial.ok);
    const create = request(
      initial.value,
      'create-sample',
      'sample',
      'dsl',
      { source, mode: 'create' },
      true,
    );
    const accepted = await session.apply(create, signal);
    assert(accepted.ok, JSON.stringify(accepted));
    expect(
      accepted.value.versions
        .filter((item) => item.key.kind !== 'history')
        .map((item) => item.key.kind)
        .sort(),
    ).toEqual(['catalog', 'collection']);
    const after = await session.read();
    assert(after.ok);
    const catalog = after.value.records.find((item) => item.key.kind === 'catalog');
    expect(catalog?.value).toMatchObject({
      entries: [expect.objectContaining({ collection: 'sample' })],
    });
    const original = after.value.records.find(
      (item) => item.key.kind === 'collection' && item.key.id === 'sample',
    );
    expect(original).toMatchObject({
      version: 0,
      value: { id: 'sample', revision: 0, objects: expect.any(Array) },
    });
    expect(await session.apply(create, signal)).toEqual(accepted);
    expect(await session.receipt(create.request)).toEqual(accepted);
    const replace = request(after.value, 'replace-sample', 'sample', 'dsl', {
      source: source.replace('"First"', '"Revised first"'),
      mode: 'replace',
    });
    const changed = await session.apply(replace, signal);
    assert(changed.ok, JSON.stringify(changed));
    const stale = request(after.value, 'stale-sample', 'sample', 'dsl', {
      source,
      mode: 'replace',
    });
    expect(await session.apply(stale, signal)).toMatchObject({
      ok: false,
      error: { code: 'revision-conflict' },
    });
    const current = await session.read();
    assert(current.ok);
    const invalid = request(current.value, 'invalid-sample', 'sample', 'dsl', {
      source: source.replace('-> @two', '-> @absent'),
      mode: 'replace',
    });
    expect(await session.apply(invalid, signal)).toMatchObject({ ok: false });
    expect(await session.read()).toEqual(current);
    expect(await session.receipt(invalid.request)).toEqual({ ok: true, value: null });
    await verifyLibraryOrganization(session, current.value);
  } finally {
    await fixture.close();
  }
}, 30000);

it('host 3 preserves immediate-parent placement through the real Model and Authoring pathway', async () => {
  const fixture = await workspaceFixture();
  const session = fixture.session;
  const signal = new AbortController().signal;
  try {
    const initial = await session.read();
    assert(initial.ok);
    const create = request(
      initial.value,
      'create-nested',
      'nested',
      'dsl',
      { source: nested, mode: 'create' },
      true,
    );
    const accepted = await session.apply(create, signal);
    assert(accepted.ok, JSON.stringify(accepted));
    const rendered = await session.render('nested', signal);
    assert(rendered.ok, JSON.stringify(rendered));
    const document = rendered.value;
    const section = document.scene.sections[0];
    const node = section?.nodes.find((item) => item.measured.objectId === 'one');
    assert(section && node);
    const stamp = {
      collectionId: 'nested',
      revision: 0,
      inputKey: document.scene.inputKey,
      generation: 1,
    };
    const intent = {
      kind: 'placement' as const,
      id: 'human-drag',
      scope: 'appearance' as const,
      base: stamp,
      entries: [
        {
          target: { kind: 'node' as const, section: section.id, id: node.id },
          placement: { x: 42, y: 190, locked: false },
        },
      ],
    };
    const planned = planCanvasEdit(intent, { document, stamp });
    assert(planned.ok, JSON.stringify(planned));
    expect(
      document.collection.sections[0]?.appearances.find((item) => item.object === 'one')?.placement,
    ).toBeUndefined();
    const snapshot = await session.read();
    assert(snapshot.ok);
    const moved = await session.apply(
      request(snapshot.value, 'human-drag', 'nested', 'model', {
        collection: 'nested',
        changes: planned.value,
      }),
      signal,
    );
    assert(moved.ok, JSON.stringify(moved));
    const stored = await session.read();
    assert(stored.ok);
    const value = stored.value.records.find(
      (item) => item.key.kind === 'collection' && item.key.id === 'nested',
    );
    const collection = validate(value?.value);
    assert(collection.ok, JSON.stringify(collection));
    const appearance = collection.value.sections[0]?.appearances.find(
      (item) => item.object === 'one',
    );
    expect(appearance).toMatchObject({
      group: 'boundary',
      placement: { x: 42, y: 190, locked: false },
    });
    expect(collection.value.objects).toEqual(document.collection.objects);
    expect(collection.value.revision).toBe(1);
    expect(
      planCanvasEdit({ ...intent, base: { ...stamp, generation: 0 } }, { document, stamp }),
    ).toMatchObject({ ok: false, error: { code: 'stale-gesture' } });
  } finally {
    await fixture.close();
  }
}, 30000);
