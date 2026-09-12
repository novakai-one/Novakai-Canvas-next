import { describe, it, expect, assert } from 'vitest';
import { createExport, type Dependencies } from '../contract/index.js';
import { createPdfEncoder } from '../adapters/native/pdf.js';
import { fixture, value, failed } from './fixtures.js';
describe('Export revision lifecycle', () => {
  it('1 pins revision, rejects mismatches and releases every acquired lease', async () => {
    const f = await fixture();
    const result = value(await f.bindings.service.exportArtifact(f.request()));
    expect(result.identity.revision).toBe(7);
    expect(result.digest).toBe(f.bindings.dependencies.encoding.hash(result.bytes));
    expect(f.releases()).toBe(1);
    const mismatch = await f.bindings.service.exportArtifact({
      identity: { collectionId: 'engineering', revision: 8 },
      format: 'svg',
    });
    expect(mismatch).toMatchObject({ ok: false, error: { code: 'snapshot-mismatch' } });
    expect(f.releases()).toBe(2);
  });
  it('2 cancellation and provider failures expose no partial artifacts and release once', async () => {
    const f = await fixture();
    expect(await f.bindings.service.exportArtifact(f.request(), { aborted: true })).toMatchObject({
      ok: false,
      error: { code: 'cancelled' },
    });
    expect(f.releases()).toBe(0);
    const formats = { ...f.bindings.dependencies.formats, svg: { encode: async () => failed() } };
    const encodedFailure = await createExport({
      ...f.bindings.dependencies,
      formats,
    }).exportArtifact(f.request());
    expect(encodedFailure).toMatchObject({ ok: false, error: { code: 'encoding-failed' } });
    expect(encodedFailure).not.toHaveProperty('value');
    expect(f.releases()).toBe(1);
    const duringFonts = { aborted: false };
    let mediaCalls = 0;
    const pdf = createPdfEncoder(
      { renderer: f.bindings.renderer },
      {
        decode: async () => {
          duringFonts.aborted = true;
          return { ok: true, value: [] };
        },
      },
      {
        convert: async () => {
          mediaCalls += 1;
          return { ok: true, value: new Map() };
        },
      },
    );
    const pdfService = createExport({
      ...f.bindings.dependencies,
      formats: { ...f.bindings.dependencies.formats, pdf },
    });
    expect(await pdfService.exportArtifact(f.request('pdf'), duringFonts)).toMatchObject({
      ok: false,
      error: { code: 'cancelled' },
    });
    expect(mediaCalls).toBe(0);
    const snapshot = f.snapshot;
    let count = 0;
    const deps: Dependencies = {
      ...f.bindings.dependencies,
      snapshots: {
        acquire: async () => ({
          ok: true,
          value: {
            snapshot,
            release: async () => {
              count += 1;
              return failed('cleanup-failed');
            },
          },
        }),
      },
    };
    expect(await createExport(deps).exportArtifact(f.request())).toMatchObject({
      ok: false,
      error: { code: 'cleanup-failed' },
    });
    expect(count).toBe(1);
    const signal = { aborted: false };
    const cancelled = {
      ...formats,
      svg: {
        encode: async () => {
          signal.aborted = true;
          return {
            ok: true as const,
            value: { bytes: new Uint8Array([1]), pages: [], warnings: [] },
          };
        },
      },
    };
    expect(
      await createExport({ ...deps, formats: cancelled }).exportArtifact(f.request(), signal),
    ).toMatchObject({
      ok: false,
      error: { code: 'cancelled' },
      diagnostics: [{ code: 'cleanup-failed' }],
    });
  });
  it('3 selected bounds preserve negative origins and apply nested section transforms once', async () => {
    const f = await fixture();
    const artifact = value(
      await f.bindings.service.exportArtifact({
        ...Object(f.request()),
        scope: { kind: 'section', id: 'flow' },
      }),
    );
    const svg = value(f.bindings.dependencies.encoding.text(artifact.bytes));
    expect(svg).toContain('viewBox="-80 120 1000 800"');
    expect(svg.match(/translate\(-80 120\)/g)).toHaveLength(1);
    expect(svg).toContain('translate(40 80)');
    const missing = await f.bindings.service.exportArtifact({
      ...Object(f.request()),
      scope: { kind: 'section', id: 'missing' },
    });
    expect(missing).toMatchObject({ ok: false, error: { code: 'missing-section' } });
    const all = value(await f.bindings.service.exportArtifact(f.request()));
    expect(all.bytes).toEqual(artifact.bytes);
    assert(f.snapshot.scene.sections[0]?.nodes.some((node) => node.parent !== null));
  });
});
