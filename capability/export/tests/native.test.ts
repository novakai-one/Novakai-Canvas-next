import { beforeAll, describe, it, expect, assert } from 'vitest';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-wasm';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { decompressFont } from '../adapters/native/woff2.js';
import type { Fixture } from './fixtures.js';
import { createExport } from '../contract/index.js';
import { createFontDecoder } from '../adapters/native/fonts.js';
import { createPdfEncoder } from '../adapters/native/pdf.js';
import { fixture, value, startRaster, failed } from './fixtures.js';
beforeAll(startRaster);
describe('Concrete portable rendering', () => {
  it('4 shared SVG retains labelled ER notation, nested nodes, sequence and escaped text', async () => {
    const f = await fixture();
    const artifact = value(await f.bindings.service.exportArtifact(f.request('svg')));
    const text = value(f.bindings.dependencies.encoding.text(artifact.bytes));
    const document = new JSDOM(text, { contentType: 'image/svg+xml' }).window.document;
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('[data-marker="zero-many"]')).not.toBeNull();
    expect(document.querySelector('[data-wire="apply"] text')?.textContent).toBe(
      'validated changes',
    );
    expect(document.querySelector('[data-sequence-event="message"]')).not.toBeNull();
    expect(document.querySelector('metadata')?.textContent).toContain('"revision":7');
    expect(document.querySelectorAll('[data-node-id]').length).toBe(3);
    expect(document.querySelectorAll('style')).toHaveLength(1);
  });
  it('5 actual PNG has exact dimensions, font-bearing pixels and bounded allocation', async () => {
    const f = await fixture();
    const image = value(await f.bindings.service.exportArtifact(f.request('png')));
    expect([...image.bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    const metadata = await sharp(image.bytes).metadata();
    expect([metadata.width, metadata.height]).toEqual([1000, 800]);
    const stats = await sharp(image.bytes).stats();
    expect(stats.channels[0]?.stdev).toBeGreaterThan(10);
    const headerPixels = await sharp(image.bytes)
      .extract({ left: 52, top: 92, width: 180, height: 20 })
      .removeAlpha()
      .greyscale()
      .raw()
      .toBuffer();
    expect([...headerPixels].filter((pixel) => pixel < 100).length).toBeGreaterThan(40);
    expect(headerPixels).toEqual(await interHeader(f));
    const invalid = await f.bindings.service.exportArtifact({
      ...Object(f.request('png')),
      scale: 4,
    });
    expect(invalid.ok).toBe(true);
    const snapshot = {
      ...f.snapshot,
      scene: { ...f.snapshot.scene, bounds: { x: 0, y: 0, width: 9000, height: 100 } },
    };
    const deps = {
      ...f.bindings.dependencies,
      snapshots: {
        acquire: async () => ({
          ok: true as const,
          value: { snapshot, release: async () => ({ ok: true as const, value: undefined }) },
        }),
      },
    };
    expect(await createExport(deps).exportArtifact(f.request('png'))).toMatchObject({
      ok: false,
      error: { code: 'limit-exceeded' },
    });
  });
  it('6 actual WebP-bearing PDF paginates with complete overlap and source footer metadata', async () => {
    const f = await fixture();
    const pdf = value(await f.bindings.service.exportArtifact(f.request('pdf')));
    const text = Buffer.from(pdf.bytes).toString('latin1');
    expect(text.startsWith('%PDF-')).toBe(true);
    expect(text.match(/\/Type \/Page\b/g)?.length).toBe(pdf.pages.length);
    expect(pdf.pages.length).toBe(2);
    expect(text).toContain('revision 7');
    expect(text).toContain('/Subtype /Image');
    const footers = await paintedFooters(pdf.bytes);
    expect(footers).toHaveLength(2);
    expect(footers[0]).toContain('revision 7 · 1/2');
    expect(footers[1]).toContain('revision 7 · 2/2');
    const first = pdf.pages[0];
    const second = pdf.pages[1];
    expect(first?.crop.x).toBe(-80);
    expect(second?.crop.x).toBeCloseTo(-80 + (595.276 - 48) / 0.75 - 16);
    expect(pdf.pages.every((page) => page.footer.includes('revision 7'))).toBe(true);
    expect((second?.crop.x ?? 0) + (second?.crop.width ?? 0)).toBeGreaterThanOrEqual(920);
    const snapshot = {
      ...f.snapshot,
      scene: {
        ...f.snapshot.scene,
        sections: f.snapshot.scene.sections.map((section) => ({
          ...section,
          box: { ...section.box, width: 1000000, height: 1000000 },
        })),
      },
    };
    const tooMany = createExport({
      ...f.bindings.dependencies,
      snapshots: {
        acquire: async () => ({
          ok: true as const,
          value: { snapshot, release: async () => ({ ok: true as const, value: undefined }) },
        }),
      },
    });
    expect(await tooMany.exportArtifact(f.request('pdf'))).toMatchObject({
      ok: false,
      error: { code: 'limit-exceeded' },
    });
  });
  it('7 offline HTML exposes navigation, measured outline and inline assets without script or remote fetch', async () => {
    const f = await fixture();
    const artifact = value(await f.bindings.service.exportArtifact(f.request('html')));
    const text = value(f.bindings.dependencies.encoding.text(artifact.bytes));
    const document = new JSDOM(text).window.document;
    expect(document.querySelector('nav a')?.getAttribute('href')).toBe('#section-0');
    expect(document.querySelector('details')?.textContent).toContain('validated changes');
    expect(document.querySelectorAll('script,link,iframe').length).toBe(0);
    expect(document.querySelector('image')?.getAttribute('href')).toMatch(
      /^data:image\/webp;base64,/,
    );
    expect(document.querySelector('h1')?.textContent).toBe(f.snapshot.identity.title);
  });
  it('12 native faults are typed and headless/service-shaped callers share one interface', async () => {
    const f = await fixture();
    const broken = {
      ...f.bindings.dependencies,
      formats: {
        ...f.bindings.dependencies.formats,
        png: {
          encode: async () => {
            throw new Error('Native failed');
          },
        },
      },
    };
    const api = createExport(broken);
    const missingFonts = createFontDecoder([], async (bytes) => bytes);
    expect(await missingFonts.decode()).toMatchObject({
      ok: false,
      error: { code: 'encoding-failed' },
    });
    const actualPdf = createPdfEncoder(
      { renderer: f.bindings.renderer },
      { decode: async () => ({ ok: true, value: [] }) },
      { convert: async () => ({ ok: true, value: new Map() }) },
    );
    const nativeFault = createExport({
      ...f.bindings.dependencies,
      formats: { ...f.bindings.dependencies.formats, pdf: actualPdf },
    });
    expect(await nativeFault.exportArtifact(f.request('pdf'))).toMatchObject({
      ok: false,
      error: { code: 'encoding-failed' },
    });
    expect(await api.exportArtifact(f.request('png'))).toMatchObject({
      ok: false,
      error: { code: 'encoding-failed' },
    });
    const http = async (body: unknown) => f.bindings.service.exportArtifact(body);
    const cli = async (source: unknown) => f.bindings.service.exportArtifact(source);
    expect(value(await http(f.request())).digest).toBe(value(await cli(f.request())).digest);
    const invalid = createExport({
      ...f.bindings.dependencies,
      formats: { ...f.bindings.dependencies.formats, pdf: { encode: async () => failed() } },
    });
    expect(await invalid.exportArtifact(f.request('pdf'))).toMatchObject({
      ok: false,
      error: { code: 'encoding-failed' },
    });
  });
});

/** Independent glyph oracle: direct resvg uses only the pinned Inter bytes, bypassing Export's family rebinding. */
async function interHeader(fixture: Fixture): Promise<Buffer> {
  const font = fixture.snapshot.resources.find((resource) => resource.metadata.family === 'Inter');
  const node = fixture.snapshot.scene.sections[0]?.nodes[0];
  const run = node?.measured.content.primitives.find((primitive) => primitive.kind === 'text');
  assert(font && run);
  expect(run.text).toBe('Validation group');
  const decoded = await decompressFont(font.bytes);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="20" viewBox="12 12 180 20"><rect x="12" y="12" width="180" height="20" fill="#ffffff"/><text x="${run.x}" y="${run.y}" font-family="Inter" font-size="${run.size}" fill="${run.fill}" textLength="${run.width}" lengthAdjust="spacingAndGlyphs">Validation group</text></svg>`;
  const renderer = new Resvg(svg, { font: { fontBuffers: [decoded] } });
  try {
    return await headerPixels(renderer);
  } finally {
    renderer.free();
  }
}
/** Copy native image bytes before freeing them; compare actual grayscale pixels, not signatures or metadata. */
async function headerPixels(renderer: InstanceType<typeof Resvg>): Promise<Buffer> {
  const image = renderer.render();
  try {
    return await sharp(image.asPng()).removeAlpha().greyscale().raw().toBuffer();
  } finally {
    image.free();
  }
}
/** PDF.js reads actual page content; source metadata and planned Page DTOs cannot satisfy this oracle. */
async function paintedFooters(bytes: Uint8Array): Promise<readonly string[]> {
  const loading = getDocument({
    data: bytes.slice(),
    useSystemFonts: false,
  });
  const document = await loading.promise;
  try {
    return await Promise.all(
      Array.from({ length: document.numPages }, (_, index) => readFooter(document, index + 1)),
    );
  } finally {
    await loading.destroy();
  }
}
/** Extract only the physical bottom footer region, in PDF points, from each actual page's text operators. */
async function readFooter(
  document: Awaited<ReturnType<typeof getDocument>['promise']>,
  number: number,
): Promise<string> {
  const page = await document.getPage(number);
  const content = await page.getTextContent();
  return content.items
    .flatMap((item) => {
      if (!('str' in item)) return [];
      const baseline = item.transform[5];
      if (baseline > 45) return [];
      return [item.str];
    })
    .join('');
}
