import { assert, expect, it } from 'vitest';
import { composePresentation } from '../contract/index.js';
import { collection, fonts, object, owners, section, style, value } from './fixtures.js';

const label =
  'Send the complete review evidence, including the requested corrections and their sources.';

/** Real pinned font metrics make badge digits and a long wrapped label one collision footprint. */
it('measures a numbered annotation without losing label text or separating its badge', async () => {
  const pinned = fonts();
  const tokens = style(pinned);
  const setup = value(await composePresentation(owners(tokens), pinned));
  const projection = value(
    setup.presentation.project(
      collection({
        objects: [object('request'), object('review')],
        relationships: [
          {
            id: 'send',
            kind: 'flow',
            source: { object: 'request' },
            target: { object: 'review' },
            label,
            step: 12,
          },
        ],
        sections: [section('flow', ['request', 'review'], { wires: [{ relationship: 'send' }] })],
      }),
    ),
  );
  const wire = projection.sections[0]?.wires[0];
  assert(wire);
  const badge = wire.label.primitives.find((item) => item.kind === 'badge');
  assert(badge?.kind === 'badge');
  const runs = wire.label.primitives.filter((item) => item.kind === 'text');
  expect(runs.map((run) => run.text).join('')).toBe('12' + label);
  const digit = runs[0];
  assert(digit);
  expect(digit.x).toBeGreaterThanOrEqual(badge.x);
  expect(digit.x + digit.width).toBeLessThanOrEqual(badge.x + badge.width);
  expect(digit.y).toBeGreaterThan(badge.y);
  expect(digit.y).toBeLessThan(badge.y + badge.height);
  expect(runs.slice(1).every((run) => run.x >= badge.x + badge.width + tokens.gap)).toBe(true);
  expect(
    runs.every(
      (run) => run.x + run.width <= wire.label.width && run.y >= 0 && run.y <= wire.label.height,
    ),
  ).toBe(true);
  expect(badge.y + badge.height).toBeLessThanOrEqual(wire.label.height);
  expect(wire.appearance).toEqual(tokens.connection);
});

/** Long node badges wrap inside their own capsule; actual text survives canonical admission and measurement. */
it('contains wrapped node badge text within a measured capsule', async () => {
  const pinned = fonts();
  const tokens = style(pinned);
  const inverted = {
    ...tokens,
    roles: { neutral: { fill: tokens.text, stroke: tokens.surface, text: tokens.surface } },
  };
  const setup = value(await composePresentation(owners(inverted), pinned));
  const projection = value(
    setup.presentation.project(
      collection({
        objects: [
          object('operations', 'note', [
            { kind: 'text', id: 'operation', text: label, role: 'badge' },
          ]),
        ],
        sections: [section('story', ['operations'])],
      }),
    ),
  );
  const primitives = projection.sections[0]?.nodes[0]?.content.primitives;
  assert(primitives);
  const capsule = primitives.find((item) => item.kind === 'badge');
  assert(capsule?.kind === 'badge');
  const runs = primitives
    .filter((item) => item.kind === 'text')
    .filter((item) => item.y > capsule.y);
  expect(runs.map((run) => run.text).join('')).toBe(label);
  expect(runs.length).toBeGreaterThan(1);
  expect(runs.every((run) => run.fill === style(pinned).connection.paint.text)).toBe(true);
  expect(
    runs.every((run) => run.x >= capsule.x && run.x + run.width <= capsule.x + capsule.width),
  ).toBe(true);
  expect(runs.every((run) => run.y <= capsule.y + capsule.height)).toBe(true);
});

/** Every prose role preserves inline emphasis through public admission and real-font projection. */
it.each(['body', 'caption', 'annotation', 'badge'])(
  'preserves strong runs in %s text',
  async (role) => {
    const pinned = fonts();
    const tokens = style(pinned);
    const setup = value(await composePresentation(owners(tokens), pinned));
    const projection = value(
      setup.presentation.project(
        collection({
          objects: [
            object('sample', 'note', [
              { kind: 'text', id: 'prose', text: 'The *receipt* proves the commit.', role },
            ]),
          ],
          sections: [section('story', ['sample'])],
        }),
      ),
    );
    const content = projection.sections[0]?.nodes[0]?.content;
    assert(content);
    const runs = content.primitives.filter((item) => item.kind === 'text').slice(1);
    expect(runs.map((run) => run.text).join('')).toBe('The receipt proves the commit.');
    expect(runs.find((run) => run.text === 'receipt')?.font).toEqual(tokens.strongFont);
    expect(runs.find((run) => run.text === 'The ')?.font).toEqual(tokens.bodyFont);
    expect(content.primitives.some((item) => item.kind === 'badge')).toBe(role === 'badge');
  },
);
