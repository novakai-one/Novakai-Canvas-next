import { assert, expect, it, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';
import { createExport } from '../contract/index.js';
import { fixture, value, startRaster, type Fixture } from './fixtures.js';

beforeAll(startRaster);

/** Fractional measured bounds must allocate ceiling pixels without asking native rounding to match by accident. */
async function checkFractionalRaster(setup: Fixture): Promise<void> {
  const snapshot = {
    ...setup.snapshot,
    scene: { ...setup.snapshot.scene, bounds: { x: 0, y: 0, width: 1000.4, height: 800.2 } },
  };
  const exporter = createExport({
    ...setup.bindings.dependencies,
    snapshots: {
      acquire: async () => ({
        ok: true,
        value: { snapshot, release: async () => ({ ok: true, value: undefined }) },
      }),
    },
  });
  const artifact = value(
    await exporter.exportArtifact({
      identity: { collectionId: snapshot.identity.collectionId, revision: 7 },
      format: 'png',
      scale: 1.3,
    }),
  );
  const pixels = await sharp(artifact.bytes).metadata();
  expect([pixels.width, pixels.height]).toEqual([1301, 1041]);
}

/** S2 SVG contract: real encoder retains figure geometry and fonts while removing the requested frame. */
it('exports frame-free measured figures with the same text and media coordinates', async () => {
  const setup = await fixture('media-top');
  const artifact = value(await setup.bindings.service.exportArtifact(setup.request('svg')));
  const svg = value(setup.bindings.dependencies.encoding.text(artifact.bytes));
  const document = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;
  const node = setup.snapshot.scene.sections
    .flatMap((section) => section.nodes)
    .find((node) => node.measured.objectId === 'alpha');
  assert(node);
  const rendered = document.querySelector(`[data-node-id="${node.id}"]`);
  assert(rendered);
  expect(rendered.getAttribute('data-frame')).toBe('none');
  expect(rendered.querySelector('rect,polygon')).toBeNull();
  const media = node.measured.content.primitives.find((item) => item.kind === 'media');
  assert(media?.kind === 'media');
  const image = rendered.querySelector('image');
  assert(image);
  const viewport = image.parentElement;
  assert(viewport);
  expect(Number(viewport.getAttribute('x')) + Number(image.getAttribute('x'))).toBe(media.x);
  expect(Number(viewport.getAttribute('y')) + Number(image.getAttribute('y'))).toBe(media.y);
  expect(Number(viewport.getAttribute('width'))).toBe(media.width);
  expect(Number(viewport.getAttribute('height'))).toBe(media.height);
  expect(Number(image.getAttribute('width'))).toBe(media.width);
  expect(Number(image.getAttribute('height'))).toBe(media.height);
  expect(image.getAttribute('href')).toBe(media.dataUri);
  const text = rendered.querySelector('text');
  const run = node.measured.content.primitives.find((item) => item.kind === 'text');
  assert(text && run?.kind === 'text');
  expect(Number(text.getAttribute('x'))).toBe(run.x);
  expect(Number(text.getAttribute('y'))).toBe(run.y);
  expect(run.y).toBeGreaterThan(media.y + media.height);
  expect(text.getAttribute('font-family')).toBe(`canvas-${run.font.digest}`);
  expect(text.textContent).toBe('Agent & human');
  await checkFractionalRaster(setup);
});
