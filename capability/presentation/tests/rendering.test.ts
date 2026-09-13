import type { VisualNode, MeasurementPort, TextRun } from '../contract/index.js';
import { it, expect, assert } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createFontMetrics } from '../adapters/fontkit.js';
import { fixture, fonts, style, value, collection, object, section, node } from './fixtures.js';
/** Exact fontkit output is checked against a real monospace property, not the production wrapping helper. */
it('1 measures pinned offline fonts and refuses missing resources or glyphs', async () => {
  const pinned = fonts();
  const metrics = value(createFontMetrics(pinned));
  const mono = style(pinned).monoFont;
  const a = value(metrics.measure('iiii', mono, 16));
  const b = value(metrics.measure('WWWW', mono, 16));
  expect(a.width).toBeCloseTo(b.width, 8);
  expect(a.width).toBeCloseTo(38.4, 4);
  expect(a.ascent + a.descent).toBeGreaterThan(16);
  expect(metrics.measure('a', { family: 'Unknown', digest: 'c'.repeat(64) }, 16)).toMatchObject({
    ok: false,
    error: { code: 'missing-resource' },
  });
  expect(metrics.measure('🦄', mono, 16)).toMatchObject({
    ok: false,
    error: { code: 'missing-glyph' },
  });
  const first = pinned[0];
  assert(first);
  expect(createFontMetrics([{ ...first, base64: 'aGVsbG8=' }])).toMatchObject({
    ok: false,
    error: { code: 'missing-resource' },
  });
});
/** React and public static export serialize the same measured node and exact embedded font bytes. */
it('9 shares escaped React markup and pinned fonts across every local shape', async () => {
  const setup = await fixture();
  const source = collection({
    objects: [
      object('A', 'step', [{ kind: 'text', id: 'html', text: '<script>alert(1)</script>' }]),
    ],
    sections: [section('flow', ['A'])],
  });
  const projected = node(value(setup.presentation.project(source)), 'A');
  const markup = value(setup.presentation.renderContent(projected));
  expect(markup).toBe(
    renderToStaticMarkup(createElement(setup.react.NodeContent, { node: projected })),
  );
  expect(markup).toContain('&lt;script&gt;');
  expect(markup).not.toContain('<script>');
  expect(markup).toContain(`font-family:canvas-${setup.react.fonts[0]?.digest}`);
  expect(markup).toContain(setup.react.fonts[0]?.base64);
  const structured = node(
    value(
      setup.presentation.project(
        collection({
          objects: [
            object('Typed', 'module', [
              {
                kind: 'signature',
                id: 'run',
                label: 'run',
                parameters: ['input: Request'],
                returns: 'Result',
              },
            ]),
          ],
          sections: [section('modules', ['Typed'])],
        }),
      ),
    ),
    'Typed',
  );
  const structuredMarkup = value(setup.presentation.renderContent(structured));
  expect(structuredMarkup).toBe(
    renderToStaticMarkup(createElement(setup.react.NodeContent, { node: structured })),
  );
  for (const pinned of setup.react.fonts) {
    expect(structuredMarkup).toContain(pinned.base64);
    expect(structuredMarkup).toContain(`font-family="canvas-${pinned.digest}"`);
  }
  const runs = structured.content.primitives.filter((item) => item.kind === 'text');
  expect(runs.find((run) => run.text === 'Typed')).toMatchObject({
    size: 20,
    font: { digest: setup.react.fonts[2]?.digest },
  });
  expect(runs.find((run) => run.text.startsWith('run('))).toMatchObject({
    size: 16,
    font: { digest: setup.react.fonts[1]?.digest },
  });

  const kinds: Readonly<Record<string, string>> = {
    step: 'card',
    start: 'pill',
    decision: 'diamond',
    fork: 'bar',
    entity: 'entity',
    module: 'module',
    interface: 'interface',
    function: 'function',
    state: 'state',
    participant: 'participant',
    note: 'note',
    system: 'container',
  };
  const metrics = value(createFontMetrics(setup.react.fonts));
  Object.entries(kinds).forEach(([kind, shape]) => {
    const source = collection({
      objects: [object('Node', kind, [{ kind: 'text', id: 'body', text: 'Readable content' }])],
      sections: [section('grid', ['Node'])],
    });
    const measured = node(value(setup.presentation.project(source)), 'Node');
    const rendered = value(setup.presentation.renderContent(measured));
    expect(measured.shape).toBe(shape);
    expect(rendered).toContain(`data-shape="${shape}"`);
    assertContained(measured, metrics);
    expect(rendered.includes('<polygon')).toBe(shape === 'diamond');
  });
  expect(
    setup.presentation.renderContent({
      ...projected,
      paint: { ...projected.paint, fill: 'url(https://evil.invalid)' },
    }),
  ).toMatchObject({ ok: false, error: { code: 'invalid-input' } });
});

/** Independent bounding-box oracle includes font ascent/descent rather than only SVG metadata. */
function assertContained(node: VisualNode, metrics: MeasurementPort): void {
  node.content.primitives
    .filter((item) => item.kind === 'text')
    .forEach((run) => assertRun(node, run, metrics));
}
/** Every text rectangle must fit its measured node; diamond corners satisfy its normalized half-plane. */
function assertRun(node: VisualNode, run: TextRun, metrics: MeasurementPort): void {
  const font = value(metrics.measure(run.text, run.font, run.size));
  const corners = [
    { x: run.x, y: run.y - font.ascent },
    { x: run.x + run.width, y: run.y - font.ascent },
    { x: run.x, y: run.y + font.descent },
    { x: run.x + run.width, y: run.y + font.descent },
  ];
  corners.forEach((point) => assertCorner(node, point));
}
/** Frame-specific geometry is asserted without calling production sizing helpers. */
function assertCorner(node: VisualNode, point: { readonly x: number; readonly y: number }): void {
  expect(point.x).toBeGreaterThanOrEqual(0);
  expect(point.y).toBeGreaterThanOrEqual(0);
  expect(point.x).toBeLessThanOrEqual(node.width);
  expect(point.y).toBeLessThanOrEqual(node.height);
  if (node.shape === 'diamond')
    expect(
      Math.abs(point.x - node.width / 2) / (node.width / 2) +
        Math.abs(point.y - node.height / 2) / (node.height / 2),
    ).toBeLessThanOrEqual(1.000001);
}
