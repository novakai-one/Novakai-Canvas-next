import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createReactBindings } from '@novakai/canvas-presentation';
import { requestSchema } from '@novakai/canvas-authoring';
import { it, assert, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { createCanvas, createSession } from '@novakai/canvas-canvas';
import { createDiagramProducer } from '@novakai/canvas-service';
import { readDiagram, createSceneAdmission } from '../adapters/readers/diagram-reader.js';
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

it('PR3 concurrent pins isolate same-family font bytes, measured text and emitted media/styles', async () => {
  const fixture = await workspaceFixture();
  const service = fixture.session;
  const signal = new AbortController().signal;
  const proof = fileURLToPath(
    new URL('../../../resources/examples/agent-diagrams/pr3/', import.meta.url),
  );
  const manifests: { id: string; body: string; base64: string; media: string }[] = [];
  try {
    for (const [id, weight, image, mime, surface] of [
      ['harbor', '400', 'wetland.png', 'image/png', '#eef7f8'],
      ['ember', '700', 'deployment.svg', 'image/svg+xml', '#fff4eb'],
    ] as const) {
      assert([id, weight, image, mime, surface].every(Boolean));
      const base64 = (await readFile(join(proof, `inter-latin-${weight}-normal.woff2`))).toString(
        'base64',
      );
      const body = await service.resources.stage({
        base64,
        mediaType: 'font/woff2',
        alt: '',
        provenance: { source: 'font.woff2' },
      });
      assert(body.ok, JSON.stringify(body));
      const media = await service.resources.stage({
        base64: (await readFile(join(proof, image))).toString('base64'),
        mediaType: mime,
        alt: id,
        provenance: { source: image },
      });
      assert(media.ok, JSON.stringify(media));
      const mono = service.installation.fonts[1];
      const strong = service.installation.fonts[2];
      assert(mono);
      assert(strong);
      const assets = [
        { alias: 'body', digest: body.value.descriptor.digest },
        { alias: 'mono', digest: mono.digest },
        { alias: 'strong', digest: strong.digest },
      ];
      const before = await service.read();
      assert(before.ok);
      const preset = service.resources.preparePreset(
        {
          assets,
          admission: {
            schemaVersion: 1,
            kind: 'theme',
            id,
            version: '1.0.0',
            title: id,
            description: '',
            raw: { base: 'paper', overrides: { 'surface.base': surface } },
          },
        },
        before.value,
      );
      assert(preset.ok, JSON.stringify(preset));
      const metadata = before.value.records.find((item) => item.key.kind === 'workspace');
      assert(metadata);
      const expected = [
        { key: metadata.key, version: metadata.version },
        { key: preset.value.key, version: 'absent' },
      ];
      const admitted = await service.apply(
        requestSchema.parse({
          workspace: before.value.workspace,
          request: `theme-${id}`,
          version: 1,
          actor: { id: 'agent:cli', kind: 'agent' },
          assets,
          expected,
          scope: expected.map((item) => item.key),
          intent: { kind: 'change', planner: 'preset', payload: preset.value },
        }),
        signal,
      );
      assert(admitted.ok, JSON.stringify(admitted));
      const snapshot = await service.read();
      assert(snapshot.ok);
      const source = `canvas 1 collection @${id} "${id}" theme=${id} { asset @media image source="sha256:${media.value.descriptor.digest}" alt="${id}" node @topic step "Measured resource identity" { text @note "Body measurement probe" image @image asset=@media } section @overview "Overview" mode=story { show @topic } }`;
      const created = await service.apply(
        request(snapshot.value, `create-${id}`, id, 'dsl', { source, mode: 'create' }, true),
        signal,
      );
      assert(created.ok, JSON.stringify(created));
      manifests.push({
        id,
        body: body.value.descriptor.digest,
        base64,
        media: media.value.descriptor.digest,
      });
    }
    const rendered = await Promise.all(manifests.map((item) => service.render(item.id, signal)));
    const widths: number[] = [];
    for (const [index, result] of rendered.entries()) {
      assert(result.ok, JSON.stringify(result));
      const expected = manifests[index];
      assert(expected);
      const body = result.value.fonts.find((item) => item.digest === expected.body);
      expect(body?.base64).toBe(expected.base64);
      expect(body?.family).toBe('Inter');
      const node = result.value.projection.sections[0]?.nodes[0];
      assert(node);
      const heading = node.content.primitives.find(byText('Measured resource identity'));
      assert(heading);
      const strong = service.installation.fonts[2];
      assert(strong);
      expect(heading.font.digest).toBe(strong.digest);
      const text = node.content.primitives.find(byText('Body measurement probe'));
      assert(text);
      widths.push(text.width);
      expect(text.font.digest).toBe(expected.body);
      const media = node.content.primitives.find((item) => item.kind === 'media');
      expect(media).toMatchObject({ digest: expected.media, alt: expected.id });
      const react = await createReactBindings(service.installation.fonts);
      assert(react.ok);
      const markup = renderToStaticMarkup(
        createElement(react.value.NodeContent, { node, embedFonts: false }),
      );
      const definitions = renderToStaticMarkup(
        createElement(react.value.FontDefinitions, { fonts: result.value.fonts }),
      );
      expect(markup).toContain(`font-family="canvas-${expected.body}"`);
      expect(definitions).toContain(
        `@font-face{font-family:canvas-${expected.body};src:url(data:font/woff2;base64,${expected.base64})`,
      );
      assert(media?.kind === 'media');
      expect(markup).toContain(media.dataUri);
      expect(dataDigest(media.dataUri)).toBe(expected.media);
      expect(result.value.style.roles.neutral).toEqual({
        fill: '#ffffff',
        stroke: '#526170',
        text: '#17212b',
      });
      expect(result.value.style.surface).toBe(['#eef7f8', '#fff4eb'][index]);
    }
    expect(widths[0]).not.toBe(widths[1]);
  } finally {
    await fixture.close();
  }
}, 30000);

/** Renderer media evidence is checked against decoded bytes, not a repeated untrusted URI string. */
function dataDigest(uri: string): string {
  const encoded = /^data:[^;]+;base64,(.+)$/.exec(uri)?.[1];
  assert(encoded);
  return createHash('sha256').update(Buffer.from(encoded, 'base64')).digest('hex');
}
/** One narrowing run-finder keeps measured text probes out of the host case's branching budget. */
const byText =
  (text: string) =>
  <P extends { readonly kind: string; readonly text?: string }>(
    item: P,
  ): item is Extract<P, { kind: 'text' }> =>
    item.kind === 'text' && item.text === text;
