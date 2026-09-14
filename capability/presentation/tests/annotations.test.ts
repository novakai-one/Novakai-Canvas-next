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
