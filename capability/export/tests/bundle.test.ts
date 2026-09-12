import { describe, it, expect } from 'vitest';
import { createExport } from '../contract/index.js';
import { fixture, value, bundle, manifestBytes, encoding, failed } from './fixtures.js';
describe('Portable bundle integrity', () => {
  it('8 deterministic bundle preserves resource bytes and independent source/manual hashes', async () => {
    const f = await fixture();
    const first = value(await f.bindings.service.exportArtifact(f.request('bundle')));
    const second = value(await f.bindings.service.exportArtifact(f.request('bundle')));
    expect(first.bytes).toEqual(second.bytes);
    const manifest = bundle(first.bytes);
    expect(manifest.source).toMatch(/^canvas 1/);
    expect(manifest.sourceDigest).toBe(encoding.hash(encoding.utf8(manifest.source)));
    const inspection = value(await f.bindings.service.inspectBundle(first.bytes));
    expect(inspection.resources.length).toBe(4);
    expect(inspection.manual.sections[0]?.appearances[0]?.placement).toMatchObject({
      x: 31,
      y: 42,
      locked: true,
    });
    expect(inspection.resources.map((resource) => resource.digest).sort()).toEqual(
      f.snapshot.resources.map((resource) => resource.digest).sort(),
    );
  });
  it('9 corrupt versions, text, base64, hashes, duplicates and rejected owner validation fail closed', async () => {
    const f = await fixture();
    const original = value(await f.bindings.service.exportArtifact(f.request('bundle')));
    const manifest = bundle(original.bytes);
    const resource = manifest.resources[0];
    expect(resource).toBeDefined();
    const corruptions = [
      { ...manifest, schemaVersion: 2 },
      { ...manifest, source: manifest.source + ' ' },
      { ...manifest, resources: [...manifest.resources, ...manifest.resources] },
      { ...manifest, resources: manifest.resources.map((item) => ({ ...item, base64: '!!!!' })) },
      {
        ...manifest,
        resources: manifest.resources.map((item) => ({ ...item, digest: '0'.repeat(64) })),
      },
    ];
    const results = await Promise.all(
      corruptions.map((item) =>
        f.bindings.service.inspectBundle(encoding.utf8(JSON.stringify(item))),
      ),
    );
    expect(results.every((result) => !result.ok)).toBe(true);
    expect(
      await f.bindings.service.inspectBundle(new Uint8Array(128 * 1024 * 1024 + 1)),
    ).toMatchObject({ ok: false, error: { code: 'limit-exceeded' } });
    expect(await f.bindings.service.inspectBundle(new Uint8Array([255]))).toMatchObject({
      ok: false,
      error: { code: 'invalid-bundle' },
    });
    const rejecting = createExport({
      ...f.bindings.dependencies,
      resources: { inspect: async () => failed('resource-rejected') },
    });
    expect(await rejecting.inspectBundle(manifestBytes(manifest))).toMatchObject({
      ok: false,
      error: { code: 'resource-rejected' },
    });
  });
});
