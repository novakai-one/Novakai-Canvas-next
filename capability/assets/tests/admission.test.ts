import { createHash } from 'node:crypto';
import { it, expect } from 'vitest';
import { harness } from './harness.js';
import { submission, png, svg, encoded, value, rejects } from './fixtures.js';

it('decodes and normalizes raster bytes with exact dimensions and MIME checks', async () => {
  const { assets } = harness();
  const admission = value(await assets.stage(submission()));
  expect(admission.descriptor).toMatchObject({
    kind: 'image',
    mediaType: 'image/png',
    width: 2,
    height: 3,
    fontFamily: null,
  });
  expect(admission.descriptor.byteLength).toBeGreaterThan(0);
  const resolved = value(assets.resolve(admission.descriptor.digest));
  const expectedHash = createHash('sha256');
  expectedHash.update(Buffer.from(resolved.base64, 'base64'));
  expect(admission.descriptor.digest).toBe(expectedHash.digest('hex'));
  value(await assets.verify(admission.descriptor.digest, resolved.base64));
  rejects(await assets.stage(submission(png, 'image/jpeg')), 'unsupported-media');
  rejects(await assets.stage(submission('%%%%')), 'invalid-input');
  rejects(await assets.stage({ ...submission(), alt: '' }), 'invalid-input');
});
it('retains safe SVG vector shapes, labels and resolved local markers', async () => {
  const { assets } = harness();
  const admission = value(await assets.stage(submission(encoded(svg), 'image/svg+xml')));
  expect(admission.descriptor).toMatchObject({
    kind: 'icon',
    mediaType: 'image/svg+xml',
    width: 180,
    height: 100,
  });
  const resolved = value(assets.resolve(admission.descriptor.digest));
  const xml = Buffer.from(resolved.base64, 'base64').toString();
  expect(xml).toContain('marker-end="url(#arrow)"');
  expect(xml).toContain('Authoring &amp; validation');
  value(await assets.verify(admission.descriptor.digest, resolved.base64));
});
it('rejects active external malformed and oversized SVG before durable admission', async () => {
  const { assets } = harness();
  const rejected = [
    String.raw`<svg width="1" height="1"><rect fill="u\72l(other.svg#paint)"/></svg>`,
    '<svg width="1" height="1"><desc>' + '>'.repeat(300000) + '</desc></svg>',

    '<svg width="1" height="1"><script>alert(1)</script></svg>',
    '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg width="1" height="1">&x;</svg>',
    '<svg width="1" height="1"><image href="https://example.com/x"/></svg>',
    '<?xml-stylesheet href="https://example.com/x"?><svg width="1" height="1"/>',
    '<svg width="1" height="1" onload="alert(1)"/>',
    '<svg width="1" height="1" style="fill:red"/>',
    '<svg width="1" height="1"><path fill="url(#missing)"/></svg>',
    '<svg width="1" height="1"><g id="x"/><g id="x"/></svg>',
    '<svg width="1" height="1">' + '<g>'.repeat(65) + '</g>'.repeat(65) + '</svg>',
    '<svg width="1" height="1">' + ' '.repeat(1024 * 1024) + '</svg>',
  ];
  await Promise.all(
    rejected.map(async (text) =>
      rejects(await assets.stage(submission(encoded(text), 'image/svg+xml')), 'unsafe-media'),
    ),
  );
  expect(value(assets.collectUnreferenced(() => ({ ok: true, value: [] })))).toEqual({
    removed: [],
    retained: [],
  });
});
it('admits a real offline font and rejects malformed or misdeclared formats', async () => {
  const fixture = harness();
  const base64 = fixture.font();
  const admission = value(
    await fixture.assets.stage({ ...submission(base64, 'font/woff2'), alt: '' }),
  );
  expect(admission.descriptor).toMatchObject({
    kind: 'font',
    fontFamily: 'Inter',
    width: null,
    height: null,
    mediaType: 'font/woff2',
  });
  expect(value(fixture.assets.resolve(admission.descriptor.digest)).base64).toBe(base64);
  rejects(await fixture.assets.stage(submission(base64, 'font/ttf')), 'unsupported-media');
  rejects(
    await fixture.assets.stage(submission(encoded('wOF2broken'), 'font/woff2')),
    'unsafe-media',
  );
});
it('reuses immutable bytes without overwriting caller-specific alt or provenance', async () => {
  const { assets } = harness();
  const first = value(await assets.stage(submission()));
  const second = value(
    await assets.stage({
      ...submission(),
      alt: 'Another description',
      provenance: { source: 'different-source' },
    }),
  );
  expect(second.descriptor.digest).toBe(first.descriptor.digest);
  expect(first.alt).toBe('A blue two by three image');
  expect(second.alt).toBe('Another description');
  expect(second.provenance.source).toBe('different-source');
  expect(Object.isFrozen(first.descriptor)).toBe(true);
  expect(value(assets.collectUnreferenced(() => ({ ok: true, value: [] }))).removed).toEqual([
    first.descriptor.digest,
  ]);
});
