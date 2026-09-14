import { assert, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import type { MeasuredContent, VisualNode, MarkerKind } from '@novakai/canvas-presentation';
import type { PlacedSection, PlacedNode, Box } from '@novakai/canvas-layout';
import index from '../../../resources/examples/showcase/manifest.json' with { type: 'json' };
import { corpusFixture } from './corpus-fixture.js';

/** Every measured text run and media reference survives encoding. These assertions do not certify placement aesthetics. */
function contentMatches(element: Element, content: MeasuredContent): void {
  const expectedText = content.primitives
    .filter((item) => item.kind === 'text')
    .map((item) => item.text);
  expect([...element.querySelectorAll('text')].map((item) => item.textContent)).toEqual(
    expectedText,
  );
  rulesMatch(element, content);
  const expectedMedia = content.primitives
    .filter((item) => item.kind === 'media')
    .map((item) => item.dataUri);
  expect([...element.querySelectorAll('image')].map((item) => item.getAttribute('href'))).toEqual(
    expectedMedia,
  );
}

/** Both endpoint marker groups retain source/target order; the none group has no painted primitive. */
function markersMatch(element: Element, kinds: readonly MarkerKind[]): void {
  const expected = kinds;
  expect(
    [...element.querySelectorAll('[data-marker]')].map((item) => item.getAttribute('data-marker')),
  ).toEqual(expected);
  [...element.querySelectorAll('[data-marker]')].forEach((marker, position) => {
    const kind = kinds[position];
    assert(kind);
    markerPaintMatches(marker, kind);
  });
}

/** Public scene geometry is the encoder's contract, not a reconstructed route algorithm. */
function sectionMatches(element: Element, section: PlacedSection): void {
  expect(element.querySelectorAll('[data-node-id]')).toHaveLength(section.nodes.length);
  for (const node of section.nodes) {
    const rendered = element.querySelector(`[data-node-id="${node.id}"]`);
    assert(rendered, node.id);
    contentMatches(rendered, node.measured.content);
    expect(rendered.getAttribute('data-frame')).toBe(node.measured.frame);
    expect(rendered.getAttribute('data-shape')).toBe(node.measured.shape);
    frameMatches(rendered, node);
  }
  expect(element.querySelectorAll('[data-wire]')).toHaveLength(section.wires.length);
  for (const wire of section.wires) {
    const rendered = element.querySelector(`[data-wire="${wire.id}"]`);
    assert(rendered, wire.id);
    contentMatches(rendered, wire.measuredLabel);
    expect(rendered.querySelector('path')?.getAttribute('d')).toBe(wire.path);
    markersMatch(rendered, [wire.sourceMarker, wire.targetMarker]);
  }
}

/** Sequence events retain both message text and supplied endpoints. */
function sequenceEventsMatch(element: Element, section: PlacedSection): void {
  expect(element.querySelectorAll('[data-sequence-event]')).toHaveLength(
    section.sequence.events.length,
  );
  for (const event of section.sequence.events) {
    const rendered = element.querySelector(`[data-sequence-event="${event.id}"]`);
    assert(rendered, event.id);
    contentMatches(rendered, event.content);
    markersMatch(rendered, [event.marker]);
    expect(rendered.querySelector('polyline')?.getAttribute('points')).toBe(
      event.points.map((point) => `${point.x},${point.y}`).join(' '),
    );
  }
}

/** All 24 real admitted scenes exercise the current SVG encoder; no browser, service or hand-authored geometry is used by this case. */
it('encodes all corpus families without losing admitted text, notation or media', async () => {
  expect(index.examples).toHaveLength(24);
  for (const entry of index.examples) {
    await collectionMatches(entry.collectionId);
  }
}, 10000);

/** Fragments and branch labels are content, too: event-only checks would miss an erased condition or retry boundary. */
function sequenceFramesMatch(element: Element, section: PlacedSection): void {
  const layer = element.querySelector('[data-layer="sequence"]');
  assert(layer);
  const geometry = section.sequence;
  const content = [
    ...geometry.fragments.flatMap((frame) => [
      frame.content,
      ...frame.branches.map((branch) => branch.content),
    ]),
    ...geometry.events.map((event) => event.content),
  ];
  const expected = content.flatMap((item) =>
    item.primitives.filter((run) => run.kind === 'text').map((run) => run.text),
  );
  expect([...layer.querySelectorAll('text')].map((text) => text.textContent)).toEqual(expected);
  for (const frame of geometry.fragments) {
    const bounds = [frame.box.x, frame.box.y, frame.box.width, frame.box.height];
    const rectangles = [...layer.querySelectorAll('rect')].map((rect) =>
      ['x', 'y', 'width', 'height'].map((key) => Number(rect.getAttribute(key))),
    );
    expect(rectangles).toContainEqual(bounds);
  }
}

/** One admitted collection is encoded and checked independently of the corpus iteration. */
async function collectionMatches(id: string): Promise<void> {
  const { bindings, snapshot } = await corpusFixture(id);
  expect(snapshot.collection.id).toBe(id);
  const result = await bindings.service.exportArtifact({
    identity: {
      collectionId: snapshot.identity.collectionId,
      revision: snapshot.identity.revision,
    },
    format: 'svg',
  });
  assert(result.ok, JSON.stringify(result));
  const document = new JSDOM(new TextDecoder().decode(result.value.bytes), {
    contentType: 'image/svg+xml',
  }).window.document;
  expect(document.querySelector('svg > title')?.textContent).toBe(snapshot.collection.title);
  expect(document.querySelectorAll('[data-section]')).toHaveLength(snapshot.scene.sections.length);
  for (const section of snapshot.scene.sections) {
    const rendered = document.querySelector(`[data-section="${section.id}"]`);
    assert(rendered, section.id);
    sectionMatches(rendered, section);
    sequenceEventsMatch(rendered, section);
    sequenceFramesMatch(rendered, section);
  }
}

/** Independent notation expectations: mandatory ends have bars; optional ends retain their circle; none remains empty. */
const markerElements: Readonly<Record<MarkerKind, readonly [number, number]>> = {
  none: [0, 0],
  arrow: [1, 0],
  'open-arrow': [1, 0],
  one: [2, 0],
  'zero-one': [1, 1],
  'one-many': [2, 0],
  'zero-many': [1, 1],
};

/** Metadata alone is insufficient: the expected paths/circles must actually paint nonempty geometry. */
function markerPaintMatches(element: Element, kind: MarkerKind): void {
  const [paths, circles] = markerElements[kind];
  expect(element.querySelectorAll('path')).toHaveLength(paths);
  expect(element.querySelectorAll('circle')).toHaveLength(circles);
  for (const path of element.querySelectorAll('path')) {
    expect(path.getAttribute('d')).toMatch(/[ML].*[ML]/u);
    expect(path.getAttribute('stroke')).toMatch(/^#[a-f0-9]{6}$/iu);
  }
  for (const circle of element.querySelectorAll('circle')) {
    expect(Number(circle.getAttribute('r'))).toBeGreaterThan(0);
    expect(circle.getAttribute('stroke')).toMatch(/^#[a-f0-9]{6}$/iu);
  }
}

/** Measured table/content separators must survive as visible lines, rather than just accessible text. */
function rulesMatch(element: Element, content: MeasuredContent): void {
  const lines = [...element.querySelectorAll('line')];
  const rendered = lines.map((line) => [
    ...['x1', 'y1', 'x2', 'y2'].map((attribute) => Number(line.getAttribute(attribute))),
    line.getAttribute('stroke'),
    Number(line.getAttribute('stroke-width')),
  ]);
  for (const rule of content.primitives.filter((item) => item.kind === 'rule')) {
    expect(rendered).toContainEqual([rule.x1, rule.y1, rule.x2, rule.y2, rule.stroke, rule.width]);
  }
}

/** Frame-free actors stay unframed; framed actors retain a painted enclosing shape at their measured extent. */
function frameMatches(element: Element, placed: PlacedNode): void {
  const node = placed.measured;
  const frames = [...element.children].filter((child) =>
    ['rect', 'polygon'].includes(child.tagName),
  );
  if (node.frame === 'none') {
    expect(frames).toHaveLength(0);
    return;
  }
  expect(frames).toHaveLength(1);
  const frame = frames[0];
  assert(frame);
  expect(frame.getAttribute('fill')).toBe(node.paint.fill);
  expect(frame.getAttribute('stroke')).toBe(node.paint.stroke);
  frameBoundsMatch(frame, placed.box);
  headingDividerMatches(element, node);
}

/** A decision has a diamond boundary; all rectangular frame forms retain the measured width and height. */
function frameBoundsMatch(frame: Element, box: Box): void {
  if (frame.tagName === 'polygon') {
    expect(frame.getAttribute('points')?.trim().split(/\s+/u)).toHaveLength(4);
    return;
  }
  expect(Number(frame.getAttribute('width'))).toBe(box.width);
  expect(Number(frame.getAttribute('height'))).toBe(box.height);
}

/** Engineering auto frames preserve the header/member division independently of field text. */
function headingDividerMatches(element: Element, node: VisualNode): void {
  if (!hasMemberCompartment(node)) return;
  const divider = [...element.children].find((child) => child.tagName === 'line');
  assert(divider);
  expect(['x1', 'y1', 'x2', 'y2'].map((key) => Number(divider.getAttribute(key)))).toEqual([
    0,
    node.headerHeight,
    node.width,
    node.headerHeight,
  ]);
  expect(divider.getAttribute('stroke')).toBe(node.paint.stroke);
}

/** A compact applicability predicate keeps the visible-divider check focused on its asserted geometry. */
function hasMemberCompartment(node: VisualNode): boolean {
  return (
    node.frame === 'auto' &&
    ['entity', 'module', 'interface', 'function'].includes(node.shape) &&
    node.height > node.headerHeight
  );
}
