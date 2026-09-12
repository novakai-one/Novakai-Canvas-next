import { createHash } from 'node:crypto';
import { assert, expect, it } from 'vitest';
import {
  composePresentation,
  visualAsset,
  type ComposedPresentation,
  type VisualNode,
} from '../contract/index.js';
import {
  collection,
  fonts,
  node,
  object,
  owners,
  section,
  style,
  themeDigest,
  value,
} from './fixtures.js';

/** A real portrait resource makes aspect-ratio loss observable independently of the composition algorithm. */
const bytes = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="200"><rect width="100" height="200" fill="#1265dd"/></svg>',
);
const asset = visualAsset.parse({
  digest: createHash('sha256').update(bytes).digest('hex'),
  mediaType: 'image/svg+xml',
  base64: bytes.toString('base64'),
  width: 100,
  height: 200,
});
const caption = 'A longer caption wraps without hiding its final words: evidence before action.';

/** Media, text and a typed port exercise both visual composition and addressable connection geometry. */
function figure(
  id: string,
  composition: 'media-top' | 'media-left',
  frame: 'none' | 'card',
): unknown {
  return object(
    id,
    'system',
    [
      { kind: 'image', id: 'figure', asset: 'portrait', size: 'small' },
      { kind: 'text', id: 'caption', text: caption, role: 'caption' },
    ],
    {
      composition,
      frame,
      ports: [{ id: 'submit', direction: 'out', label: 'Submit', type: 'Evidence' }],
    },
  );
}

/** Bounds are checked against independently meaningful inequalities, not another copy of placement arithmetic. */
function checkExtent(projected: VisualNode): void {
  const runs = projected.content.primitives.filter((item) => item.kind === 'text');
  expect(runs.every((run) => run.x >= 0 && run.x + run.width <= projected.width)).toBe(true);
  expect(runs.every((run) => run.y > 0 && run.y <= projected.height)).toBe(true);
  expect(projected.content.outline).toContain(caption);
  expect(
    runs
      .filter((run) => run.size === 14)
      .map((run) => run.text)
      .join(''),
  ).toBe(caption);
  const media = projected.content.primitives.filter((item) => item.kind === 'media');
  expect(media).toHaveLength(1);
  expect(media.every((item) => item.x >= 0 && item.x + item.width <= projected.width)).toBe(true);
  expect(media.every((item) => item.y >= 0 && item.y + item.height <= projected.height)).toBe(true);
  expect(projected.content.anchors).toEqual([
    expect.objectContaining({ member: 'submit', direction: 'out', collapsed: false }),
  ]);
  const anchor = projected.content.anchors[0];
  assert(anchor);
  expect(anchor.x).toBeGreaterThanOrEqual(0);
  expect(anchor.x).toBeLessThanOrEqual(projected.width);
  expect(anchor.y).toBeGreaterThanOrEqual(0);
  expect(anchor.y).toBeLessThan(projected.height);
}

/** S2 measurement: portrait ratio, semantic text metrics, orientations and member anchors survive real font measurement. */
it('measures figure orientations and full portrait/caption extents without clipping', async () => {
  const pinned = fonts();
  const tokens = style(pinned);
  const dark = { fill: '#000000', stroke: '#ffffff', text: '#ffffff' };
  const setup = value(
    await composePresentation(
      owners({ ...tokens, roles: { ...tokens.roles, dark } }, asset),
      pinned,
    ),
  );
  const source = collection({
    assets: [
      {
        id: 'portrait',
        digest: `sha256:${asset.digest}`,
        mediaType: asset.mediaType,
        alt: 'Portrait evidence marker',
      },
    ],
    objects: [figure('above', 'media-top', 'none'), figure('beside', 'media-left', 'card')],
    sections: [section('story', ['above', 'beside'])],
  });
  const projection = value(setup.presentation.project(source));
  const above = node(projection, 'above');
  const beside = node(projection, 'beside');
  [above, beside].forEach(checkExtent);
  const topMedia = above.content.primitives.find((item) => item.kind === 'media');
  const topHeading = above.content.primitives.find((item) => item.kind === 'text');
  const sideMedia = beside.content.primitives.find((item) => item.kind === 'media');
  const sideHeading = beside.content.primitives.find((item) => item.kind === 'text');
  assert(topMedia?.kind === 'media' && topHeading?.kind === 'text');
  assert(sideMedia?.kind === 'media' && sideHeading?.kind === 'text');
  expect(topMedia.height / topMedia.width).toBe(2);
  expect(sideMedia.height / sideMedia.width).toBe(2);
  expect(topHeading.y).toBeGreaterThan(topMedia.y + topMedia.height);
  expect(sideHeading.x).toBeGreaterThan(sideMedia.x + sideMedia.width);
  expect(
    above.content.primitives.filter((item) => item.kind === 'text').some((run) => run.size === 14),
  ).toBe(true);
  expect(above.frame).toBe('none');
  expect(beside.frame).toBe('card');
  checkContainerForeground(setup);
});

/** Transparent represented groups inherit their painted ancestor before text measurements are created. */
function checkContainerForeground(setup: ComposedPresentation): void {
  const source = collection({
    theme: {
      id: 'paper',
      version: '1.0.0',
      digest: `sha256:${themeDigest}`,
      roles: ['neutral', 'dark'],
    },
    objects: [object('represented', 'system', [], { frame: 'none' })],
    sections: [
      section('story', [], {
        groups: [
          {
            id: 'outer',
            title: 'Dark boundary',
            frame: 'panel',
            role: 'dark',
            layout: { algorithm: 'grid' },
          },
          {
            id: 'inner',
            title: 'Represented content',
            parent: 'outer',
            represents: 'represented',
            frame: 'none',
            layout: { algorithm: 'grid' },
          },
        ],
      }),
    ],
  });
  const projected = node(value(setup.presentation.project(source)), 'represented');
  expect(projected.parent).toBe('view:group:outer');
  const heading = projected.content.primitives.find((item) => item.kind === 'text');
  assert(heading?.kind === 'text');
  expect(heading.fill).toBe('#ffffff');
}
