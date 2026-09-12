import { it, assert, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { createCanvas, createSession } from '@novakai/canvas-canvas';
import { createDiagramProducer } from '@novakai/canvas-service';
import { readDiagram, createSceneAdmission } from '../adapters/diagram-reader.js';
import { workspaceFixture, request, source } from './host-workspace-fixture.js';
import { verifyRenderGeneration } from './render-generation.js';
/** Actual measurement/routing output crosses JSON and both owner admission boundaries before Canvas receives it. */
it('host 5 admits serialized owner output, rejects corrupt geometry and ignores cancelled or obsolete worker results', async () => {
  const fixture = await workspaceFixture();
  const service = fixture.session;
  const signal = new AbortController().signal;
  try {
    const before = await service.read();
    assert(before.ok);
    const created = await service.apply(
      request(before.value, 'render-sample', 'sample', 'dsl', { source, mode: 'create' }, true),
      signal,
    );
    assert(created.ok, JSON.stringify(created));
    const rendered = await service.render('sample', signal);
    assert(rendered.ok, JSON.stringify(rendered));
    const document = rendered.value;
    const raw: unknown = JSON.parse(JSON.stringify(document));
    const read = readDiagram(raw);
    assert(read.ok, JSON.stringify(read));
    expect(read.value.collection).toEqual(document.collection);
    expect(read.value.scene).toEqual(document.scene);
    const section = document.scene.sections[0];
    assert(section);
    expect(
      readDiagram({
        ...document,
        scene: { ...document.scene, sections: [{ ...section, nodes: [] }] },
      }),
    ).toMatchObject({ ok: false, error: { code: 'invalid-diagram' } });
    expect(
      readDiagram({ ...document, scene: { ...document.scene, inputKey: 'unrelated-input' } }),
    ).toMatchObject({ ok: false });
    const canvas = createCanvas({ sceneAdmission: createSceneAdmission() });
    const opened = canvas.open({
      scene: raw,
      expected: {
        collectionId: 'sample',
        revision: 0,
        inputKey: document.scene.inputKey,
        generation: 0,
      },
      viewport: { width: 1000, height: 700 },
    });
    assert(opened.ok, JSON.stringify(opened));
    const session = createSession(canvas, opened.value);
    const stamp = { ...opened.value.stamp, generation: 1 };
    const expected = session.dispatch({ kind: 'expect-scene', stamp });
    assert(expected.ok);
    const retained = session.getSnapshot();
    const late = session.dispatch({ kind: 'receive-scene', stamp: opened.value.stamp, scene: raw });
    expect(session.getSnapshot().scene).toEqual(retained.scene);
    expect(session.getSnapshot().requested).toEqual(stamp);
    expect(late).toMatchObject({ ok: false, error: { code: 'stale-scene' } });
    const producer = await createDiagramProducer(5000);
    assert(producer.ok);
    const cancellation = new AbortController();
    const job = {
      id: 'cancelled-job',
      collection: document.collection,
      fonts: document.fonts,
      style: document.style,
      assets: [],
      options: document.options,
      previous: null,
      wasmResource: fileURLToPath(
        new URL('../../../resources/vendor/layout/libavoid.wasm', import.meta.url),
      ),
    };
    const producing = producer.value.produce(job, cancellation.signal);
    cancellation.abort();
    expect(await producing).toMatchObject({ ok: false, error: { code: 'cancelled' } });
    expect(session.getSnapshot().scene).toEqual(retained.scene);
    session.dispose();
    const snapshot = await service.read();
    assert(snapshot.ok);
    await verifyRenderGeneration(document, snapshot.value);
  } finally {
    await fixture.close();
  }
}, 30000);
