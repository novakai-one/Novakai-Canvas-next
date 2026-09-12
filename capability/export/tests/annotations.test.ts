import { assert, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { fixture, value } from './fixtures.js';

/** The real encoder paints the admitted route and measured badge, using wire-owned appearance. */
it('retains numbered annotations and connection styling in the exported SVG', async () => {
  const setup = await fixture('stack', true);
  const artifact = value(await setup.bindings.service.exportArtifact(setup.request('svg')));
  const svg = value(setup.bindings.dependencies.encoding.text(artifact.bytes));
  const document = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;
  const wire = setup.snapshot.scene.sections[0]?.wires[0];
  assert(wire);
  const rendered = document.querySelector('[data-wire="apply"]');
  assert(rendered);
  const path = rendered.querySelector('path');
  assert(path);
  expect(path.getAttribute('d')).toBe('M240 160L500 160');
  expect(path.getAttribute('stroke')).toBe('#444444');
  expect(path.getAttribute('stroke-width')).toBe('2');
  expect(path.getAttribute('stroke-dasharray')).toBe('8 4');
  const badge = rendered.querySelector('[data-badge="true"]');
  const measured = wire.measuredLabel.primitives.find((item) => item.kind === 'badge');
  assert(badge && measured?.kind === 'badge');
  expect(Number(badge.getAttribute('x'))).toBe(measured.x);
  expect(Number(badge.getAttribute('y'))).toBe(measured.y);
  expect(Number(badge.getAttribute('width'))).toBe(measured.width);
  expect(Number(badge.getAttribute('height'))).toBe(measured.height);
  expect(badge.getAttribute('fill')).toBe('#444444');
  const text = [...rendered.querySelectorAll('text')];
  expect(text.map((run) => run.textContent).join('')).toBe('12validated changes');
  expect(text[0]?.getAttribute('fill')).toBe('#ffffff');
  const viewport = badge.closest('g[transform]');
  assert(viewport);
  expect(viewport.getAttribute('transform')).toBe(
    `translate(${wire.labelBox.x} ${wire.labelBox.y})`,
  );
});
