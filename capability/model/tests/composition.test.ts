import { expect, it } from 'vitest';
import { validate } from '../contract/index.js';
import { base, node, section, digest, value, invalid } from './fixtures.js';

/** Independent canonical input exercises semantic admission without a parser or renderer oracle. */
function figureInput(view: Readonly<Record<string, unknown>> = {}): unknown {
  return base({
    assets: [{ id: 'figure', digest, mediaType: 'image/svg+xml', alt: 'A diagram figure' }],
    objects: [
      node('actor', 'system', {
        frame: 'none',
        composition: 'media-top',
        content: [
          { kind: 'image', id: 'figure', asset: 'figure' },
          { kind: 'text', id: 'caption', text: 'An explanatory caption', role: 'caption' },
        ],
      }),
    ],
    sections: [
      section('view', 'story', {
        groups: [
          {
            id: 'region',
            title: 'Boundary',
            frame: 'panel',
            role: 'supporting',
            layout: { algorithm: 'grid' },
          },
        ],
        appearances: [{ object: 'actor', group: 'region', ...view }],
      }),
    ],
  });
}

/** S2 admission: missing visible media rejects, explicit stack permits a label-only view, and unknown intent never enters Model. */
it('admits composition intent and rejects hidden or missing required media', () => {
  const original = value(validate(figureInput()));
  expect(original.objects[0]).toMatchObject({ frame: 'none', composition: 'media-top' });
  expect(original.sections[0]?.groups[0]).toMatchObject({ frame: 'panel', role: 'supporting' });
  invalid(validate(figureInput({ detail: 'label' })), 'content', 'appearances.actor.composition');
  const labelView = value(validate(figureInput({ detail: 'label', composition: 'stack' })));
  expect(labelView.sections[0]?.appearances[0]).toMatchObject({
    detail: 'label',
    composition: 'stack',
  });
  invalid(validate(figureInput({ frame: 'mystery' })), 'shape', 'frame');
  invalid(
    validate(base({ objects: [node('empty', 'concept', { composition: 'media-left' })] })),
    'content',
    'objects.empty.composition',
  );
  expect(value(validate(base({ objects: [node('plain')] }))).objects[0]).toMatchObject({
    frame: 'auto',
    composition: 'stack',
  });
});
