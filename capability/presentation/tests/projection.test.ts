import { describe, it, expect, assert } from 'vitest';
import { composePresentation, createPresentation } from '../contract/index.js';
import { createFontMetrics } from '../adapters/fontkit.js';
import {
  fixture,
  fonts,
  style,
  owners,
  collection,
  object,
  section,
  value,
  node,
  text,
  layout,
} from './fixtures.js';
import type { VisualAsset } from '../contract/index.js';

describe('Presentation measured content', () => {
  it('2 preserves newlines and graphemes while wrapping long content', async () => {
    const app = (await fixture()).presentation;
    const pinned = fonts();
    const font = style(pinned).bodyFont;
    const result = value(
      app.measureText({
        text: 'Alpha\n\nCafé longidentifierlongidentifier',
        width: 80,
        font,
        size: 16,
        lineHeight: 1,
        fill: '#000000',
      }),
    );
    const runs = result.primitives.filter((item) => item.kind === 'text');
    expect(runs[0]?.text).toBe('Alpha');
    expect(runs[1]?.text).toBe('');
    expect(runs.map((item) => item.text).join('')).toBe('AlphaCafé longidentifierlongidentifier');
    expect(runs.every((item) => item.width <= 80)).toBe(true);
    expect(runs.every((item) => !item.text.startsWith('́'))).toBe(true);
    expect(result.height).toBeGreaterThan(runs.length * 16);
  });
  it('3 renders ER types, keys, nullability and addressable field rows', async () => {
    const source = collection({
      objects: [
        object('Customer', 'entity', [
          { kind: 'field', id: 'id', label: 'id', type: 'UUID', key: 'primary' },
          {
            kind: 'field',
            id: 'email',
            label: 'email',
            type: 'string',
            nullable: true,
            key: 'unique',
          },
        ]),
      ],
      sections: [section('er', ['Customer'])],
    });
    const projected = value((await fixture()).presentation.project(source));
    const customer = node(projected, 'Customer');
    expect(customer.shape).toBe('entity');
    const rows = customer.content.primitives.filter((item) => item.kind === 'text');
    expect(rows.map((item) => item.text)).toEqual([
      'Customer',
      'PK',
      'id:',
      'UUID',
      'UQ',
      'email:',
      'string?',
    ]);
    const primary = rows.find((item) => item.text === 'PK');
    const name = rows.find((item) => item.text === 'id:');
    const type = rows.find((item) => item.text === 'UUID');
    assert(primary && name && type);
    expect(primary.y).toBe(name.y);
    expect(type.y).toBe(name.y);
    expect(primary.x).toBeLessThan(name.x);
    expect(name.x + name.width).toBeLessThan(type.x);
    expect(rows.find((item) => item.text === 'email:')?.x).toBe(name.x);
    expect(rows.find((item) => item.text === 'string?')?.x).toBe(type.x);
    expect(customer.content.primitives.filter((item) => item.kind === 'rule')).toHaveLength(2);
    expect(customer.content.outline.join(' ')).toContain('nullable');
    expect(customer.content.anchors.map((anchor) => anchor.member)).toEqual(['id', 'email']);
    expect(customer.content.anchors[0]?.y).toBeLessThan(customer.content.anchors[1]?.y ?? 0);
    expect(rows[0]?.size).toBe(20);
    expect(primary.size).toBe(16);
    const [firstAnchor, secondAnchor] = customer.content.anchors;
    assert(firstAnchor && secondAnchor);
    expect(secondAnchor.y - firstAnchor.y).toBe(56);
    const dense = collection({
      objects: [
        object('Ledger', 'entity', [
          {
            kind: 'field',
            id: 'key',
            label: 'external_customer_identifier',
            type: 'UUID',
            key: 'primary',
          },
          {
            kind: 'field',
            id: 'owner',
            label: 'owner',
            type: 'NullableExternalAccountReference',
            nullable: true,
          },
        ]),
      ],
      sections: [
        section('er', [], {
          appearances: [{ object: 'Ledger', placement: { x: 0, y: 0, width: 120 } }],
        }),
      ],
    });
    const expanded = node(value((await fixture()).presentation.project(dense)), 'Ledger');
    const denseRuns = expanded.content.primitives.filter((item) => item.kind === 'text');
    expect(denseRuns.map((run) => run.text)).toContain('external_customer_identifier:');
    expect(denseRuns.map((run) => run.text)).toContain('NullableExternalAccountReference?');
    expect(expanded.width).toBeGreaterThan(600);
    expect(denseRuns.find((run) => run.text === 'UUID')?.x).toBe(
      denseRuns.find((run) => run.text === 'NullableExternalAccountReference?')?.x,
    );
    const heading = node(
      value(
        (await fixture()).presentation.project(
          collection({
            objects: [object('Heading', 'concept', [], { label: 'Customer lifecycle records' })],
            sections: [section('grid', ['Heading'])],
          }),
        ),
      ),
      'Heading',
    );
    expect(heading.width).toBeGreaterThan(264);
    expect(heading.width).toBeLessThanOrEqual(344);
  });
  it('4 preserves typed ports, members, callable signatures and table row anchors', async () => {
    const source = collection({
      objects: [
        object(
          'Service',
          'module',
          [
            { kind: 'member', id: 'state', label: 'state', type: 'State', visibility: 'private' },
            {
              kind: 'signature',
              id: 'run',
              label: 'run',
              parameters: ['input: Request'],
              returns: 'Outcome',
            },
            {
              kind: 'table',
              id: 'matrix',
              columns: ['Name', 'Meaning'],
              rows: [{ id: 'row', cells: ['accept', 'Accepts the request without mutation'] }],
            },
          ],
          { ports: [{ id: 'input', label: 'input', type: 'Request', direction: 'in' }] },
        ),
      ],
      sections: [section('modules', ['Service'])],
    });
    const service = node(value((await fixture()).presentation.project(source)), 'Service');
    expect(service.content.outline.join(' ')).toContain('run(input: Request): Outcome');
    expect(service.content.outline.join(' ')).toContain('private state: State');
    expect(service.content.anchors.map((item) => item.member)).toEqual([
      'state',
      'run',
      'row',
      'input',
    ]);
    expect(service.width).toBeGreaterThan(360);
    expect(service.headerHeight).toBe(54);
    expect(service.content.anchors.find((item) => item.member === 'input')?.direction).toBe('in');
    const callable = collection({
      objects: [
        object('Callable', 'function', [
          {
            kind: 'signature',
            id: 'dispatch',
            label: 'dispatch',
            parameters: ['request: Request', 'context: Context', 'options: Options'],
            returns: 'Outcome',
          },
        ]),
      ],
      sections: [
        section('modules', [], {
          appearances: [{ object: 'Callable', placement: { x: 0, y: 0, width: 160 } }],
        }),
      ],
    });
    const wrapped = node(value((await fixture()).presentation.project(callable)), 'Callable');
    const signatureRuns = wrapped.content.primitives
      .filter((item) => item.kind === 'text')
      .slice(1);
    expect(signatureRuns.map((run) => run.text)).toEqual([
      'dispatch(request: Request,',
      'context: Context,',
      'options: Options): Outcome',
    ]);
    const [opening, middle, closing] = signatureRuns;
    assert(opening && middle && closing);
    expect(middle.y - opening.y).toBe(24);
    expect(closing.y - middle.y).toBe(24);
    expect(wrapped.content.anchors[0]?.label).toBe(
      'dispatch(request: Request, context: Context, options: Options): Outcome',
    );
    expect(wrapped.width).toBeGreaterThan(160);
    const matrix = collection({
      objects: [
        object('Matrix', 'module', [
          {
            kind: 'table',
            id: 'table',
            columns: ['ID', 'Description'],
            rows: [
              {
                id: 'row',
                cells: ['VeryLongUnbrokenIdentifierThatMustStayWhole', 'Short description'],
              },
            ],
          },
        ]),
      ],
      sections: [
        section('modules', [], {
          appearances: [{ object: 'Matrix', placement: { x: 0, y: 0, width: 80 } }],
        }),
      ],
    });
    const tableNode = node(value((await fixture()).presentation.project(matrix)), 'Matrix');
    const cells = tableNode.content.primitives.filter((item) => item.kind === 'text');
    const longCell = cells.find(
      (run) => run.text === 'VeryLongUnbrokenIdentifierThatMustStayWhole',
    );
    const description = cells.find((run) => run.text === 'Description');
    assert(longCell && description);
    expect(description.x).toBeGreaterThan(longCell.x + longCell.width);
    expect(tableNode.content.anchors.find((anchor) => anchor.member === 'row')?.label).toBe(
      'VeryLongUnbrokenIdentifierThatMustStayWhole | Short description',
    );
  });
  it('6 measures admitted media with alt text and rejects missing or unsafe resources', async () => {
    const pinned = fonts();
    const asset: VisualAsset = {
      digest: 'b'.repeat(64),
      mediaType: 'image/png',
      base64: 'aGVsbG8=',
      width: 200,
      height: 100,
    };
    const source = collection({
      objects: [
        object('Photo', 'concept', [{ kind: 'image', id: 'photo', asset: 'photo', size: 'small' }]),
      ],
      assets: [
        {
          id: 'photo',
          digest: `sha256:${asset.digest}`,
          mediaType: asset.mediaType,
          alt: 'A sample image',
        },
      ],
      sections: [section('grid', ['Photo'])],
    });
    const app = value(await composePresentation(owners(style(pinned), asset), pinned)).presentation;
    const image = node(value(app.project(source)), 'Photo').content.primitives.find(
      (item) => item.kind === 'media',
    );
    assert(image?.kind === 'media');
    expect([image.width, image.height, image.alt]).toEqual([180, 90, 'A sample image']);
    expect(image.x).toBe(42);
    expect((await fixture()).presentation.project(source)).toMatchObject({
      ok: false,
      error: { code: 'missing-resource' },
    });

    const portrait = value(
      await composePresentation(
        owners(style(pinned), { ...asset, width: 100, height: 400 }),
        pinned,
      ),
    ).presentation;
    const mediaSource = collection({
      assets: [
        {
          id: 'photo',
          digest: `sha256:${asset.digest}`,
          mediaType: asset.mediaType,
          alt: 'A sample image',
        },
      ],
      objects: [
        object('Photo', 'concept', [
          { kind: 'image', id: 'photo', asset: 'photo', size: 'large', fit: 'cover' },
          { kind: 'icon', id: 'icon', asset: 'photo', size: 'small', fit: 'contain' },
        ]),
      ],
      sections: [
        section('grid', [], {
          appearances: [{ object: 'Photo', placement: { x: 0, y: 0, width: 100 } }],
        }),
      ],
    });
    const mediaNode = node(value(portrait.project(mediaSource)), 'Photo');
    const slots = mediaNode.content.primitives.filter((item) => item.kind === 'media');
    expect(slots.map((slot) => [slot.x, slot.width, slot.height])).toEqual([
      [12, 76, 76],
      [38, 24, 24],
    ]);
    const markup = value(portrait.renderContent(mediaNode));
    expect(markup).toContain('overflow="hidden"');
    expect(markup).toContain('xMidYMid slice');
    expect(markup).toContain('xMidYMid meet');
    expect(markup).toContain('<title>A sample image</title>');
    const unsafe = {
      ...owners(style(pinned)),
      assets: {
        read: () => ({
          ok: true as const,
          value: { ...asset, base64: 'https://evil.invalid/image' },
        }),
      },
    };
    expect(
      value(await composePresentation(unsafe, pinned)).presentation.project(source),
    ).toMatchObject({
      ok: false,
      error: { code: 'invalid-input' },
    });
  });
  it('7 keeps shared group representations, compact outlines, links and sequence labels', async () => {
    const source = collection({
      objects: [
        object('Shared', 'concept', [
          { kind: 'text', id: 'body', text: 'Full explanation' },
          {
            kind: 'link',
            id: 'ref',
            label: 'Read source',
            target: { kind: 'uri', uri: 'https://example.org' },
          },
        ]),
        object('A', 'participant'),
        object('B', 'participant'),
      ],
      sections: [
        section('grid', [], {
          groups: [{ id: 'group', title: 'Shared', represents: 'Shared', layout }],
          appearances: [],
        }),
        {
          id: 'other',
          title: 'Other',
          mode: 'grid',
          layout,
          appearances: [{ object: 'Shared', detail: 'summary' }],
        },
        {
          id: 'seq',
          title: 'Sequence',
          mode: 'sequence',
          layout: { algorithm: 'sequence' },
          appearances: [{ object: 'A' }, { object: 'B' }],
          sequence: [
            {
              id: 'message',
              kind: 'event',
              order: 0,
              source: 'A',
              target: 'B',
              label: 'Sends request',
              message: 'call',
            },
          ],
        },
      ],
    });
    const projected = value((await fixture()).presentation.project(source));
    expect(projected.sections[0]?.nodes).toHaveLength(1);
    expect(projected.sections[0]?.nodes[0]?.groupId).toBe('group');
    expect(projected.sections[1]?.nodes[0]?.content.outline).toContain('Read source');
    expect(projected.sections[1]?.nodes[0]?.navigation[0]?.target).toEqual({
      kind: 'uri',
      uri: 'https://example.org',
    });
    expect(projected.sections[2]?.sequence[0]?.label.outline).toEqual(['Sends request']);
    expect(projected.sections[2]?.sequence[0]?.marker).toBe('arrow');
    const represented = projected.sections[0]?.nodes[0];
    assert(represented);
    expect(represented.headerHeight).toBe(represented.height);
    expect(represented.headerHeight).toBe(118);
    expect(projected.sections[2]?.title.primitives[0]).toMatchObject({ kind: 'text', size: 24 });
    expect(projected.sections[2]?.sequence[0]?.label.primitives[0]).toMatchObject({
      kind: 'text',
      size: 14,
    });
    const fragments = collection({
      objects: [object('A', 'participant'), object('B', 'participant')],
      sections: [
        section('sequence', ['A', 'B'], {
          layout: { algorithm: 'sequence' },
          sequence: [
            { id: 'retry', kind: 'fragment', order: 0, operator: 'loop', label: 'Retry request' },
            { id: 'optional', kind: 'fragment', order: 1, operator: 'opt', label: 'Cached result' },
            {
              id: 'choice',
              kind: 'fragment',
              order: 2,
              operator: 'alt',
              label: 'Outcome',
              branches: [
                { id: 'yes', label: 'Success' },
                { id: 'no', label: 'Failure' },
              ],
            },
          ],
        }),
      ],
    });
    const sequenceApp = (await fixture()).presentation;
    const fragmentScene = value(sequenceApp.project(fragments));
    expect(fragmentScene.sections[0]?.sequence.map((item) => item.label.outline[0])).toEqual([
      'loop Retry request',
      'opt Cached result',
      'alt Outcome',
    ]);
    expect(
      value(sequenceApp.supplement(fragments)).branchHeadings[0]?.content.primitives[0],
    ).toMatchObject({ kind: 'text', size: 14 });

    const table = collection({
      objects: [
        object('Table', 'concept', [
          {
            kind: 'table',
            id: 'table',
            columns: ['Name'],
            rows: [
              { id: 'first', cells: ['First'] },
              { id: 'second', cells: ['Second'] },
            ],
          },
          { kind: 'text', id: 'extra', text: 'Hidden body' },
        ]),
      ],
      sections: [section('grid', [], { appearances: [{ object: 'Table', detail: 'summary' }] })],
    });
    const summary = node(value((await fixture()).presentation.project(table)), 'Table');
    expect(text(summary)).toContain('First');
    expect(text(summary)).toContain('Second');
    expect(text(summary)).not.toContain('Hidden body');
    expect(summary.content.outline).toContain('Hidden body');
    expect(summary.content.anchors.every((anchor) => !anchor.collapsed)).toBe(true);
  });
  it('8 keys content and resolved style and freezes detached output', async () => {
    const pinned = fonts();
    const tokens = style(pinned);
    const source = collection({ objects: [object('A')], sections: [section('flow', ['A'])] });
    const app = value(await composePresentation(owners(tokens), pinned)).presentation;
    const first = value(app.project(source));
    const second = value(app.project(structuredClone(source)));
    expect(first.inputKey).toBe(second.inputKey);
    const inverse = {
      ...tokens,
      roles: { neutral: { fill: '#000000', stroke: '#ffffff', text: '#ffffff' } },
    };
    const themed = value(await composePresentation(owners(inverse), pinned)).presentation;
    const themedNode = node(value(themed.project(source)), 'A');
    expect(
      themedNode.content.primitives
        .filter((item) => item.kind === 'text')
        .every((item) => item.fill === '#ffffff'),
    ).toBe(true);
    const resized = collection({
      objects: [object('A')],
      sections: [
        section('flow', [], {
          appearances: [{ object: 'A', placement: { x: 0, y: 0, width: 480 } }],
        }),
      ],
    });
    expect(node(value(app.project(resized)), 'A').width).toBe(480);

    const changed = value(
      await composePresentation(
        owners({
          ...tokens,
          typography: { ...tokens.typography, body: { ...tokens.typography.body, size: 18 } },
        }),
        pinned,
      ),
    ).presentation;
    expect(value(changed.project(source)).inputKey).not.toBe(first.inputKey);

    expect(Object.isFrozen(first.sections[0]?.nodes[0]?.content.primitives)).toBe(true);
    expect(Object.isFrozen(source)).toBe(false);
    const renamed = collection({
      objects: [object('A')],
      sections: [section('flow', ['A'])],
      title: 'Changed',
    });
    expect(value(app.project(renamed)).inputKey).not.toBe(first.inputKey);
  });
  it('10 rejects invalid providers and nonfinite or oversized public inputs without a partial scene', async () => {
    const pinned = fonts();
    const metrics = value(createFontMetrics(pinned));
    const app = createPresentation({
      ...owners(style(pinned)),
      measurement: metrics,
      renderer: {
        version: 'test',
        render: () => ({ ok: true, value: '' }),
        marker: () => ({ ok: true, value: '' }),
      },
    });
    expect(app.project({})).toMatchObject({ ok: false, error: { code: 'invalid-input' } });
    expect(app.renderContent({ width: Infinity })).toMatchObject({
      ok: false,
      error: { code: 'invalid-input' },
    });
    expect(
      app.measureText({
        text: 'a'.repeat(100001),
        width: 80,
        font: style(pinned).bodyFont,
        size: 16,
        lineHeight: 24,
        fill: '#000000',
      }),
    ).toMatchObject({ ok: false, error: { code: 'limit' } });
    const throwing = createPresentation({
      ...owners(style(pinned)),
      measurement: {
        version: 'broken',
        measure: () => {
          throw new Error('private');
        },
      },
      renderer: {
        version: 'test',
        render: () => ({ ok: true, value: '' }),
        marker: () => ({ ok: true, value: '' }),
      },
    });
    const result = throwing.project(
      collection({ objects: [object('A')], sections: [section('flow', ['A'])] }),
    );
    expect(result).toMatchObject({ ok: false, error: { code: 'provider-failed' } });
    expect(result).not.toHaveProperty('value');
  });
});
