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
  it('2 preserves newlines and graphemes while wrapping long content', () => {
    const app = fixture().presentation;
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
  it('3 renders ER types, keys, nullability and addressable field rows', () => {
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
    const projected = value(fixture().presentation.project(source));
    const customer = node(projected, 'Customer');
    expect(customer.shape).toBe('entity');
    expect(text(customer)).toContain('PK id: UUID');
    expect(text(customer)).toContain('UQ email: string');
    expect(customer.content.outline.join(' ')).toContain('nullable');
    expect(customer.content.anchors.map((anchor) => anchor.member)).toEqual(['id', 'email']);
    expect(customer.content.anchors[0]?.y).toBeLessThan(customer.content.anchors[1]?.y ?? 0);
  });
  it('4 preserves typed ports, members, callable signatures and table row anchors', () => {
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
    const service = node(value(fixture().presentation.project(source)), 'Service');
    expect(service.content.outline.join(' ')).toContain('run(input: Request): Outcome');
    expect(service.content.outline.join(' ')).toContain('private state: State');
    expect(service.content.anchors.map((item) => item.member)).toEqual([
      'state',
      'run',
      'row',
      'input',
    ]);
    expect(service.width).toBeGreaterThan(360);
    expect(service.content.anchors.find((item) => item.member === 'input')?.direction).toBe('in');
  });
  it('6 measures admitted media with alt text and rejects missing or unsafe resources', () => {
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
    const app = value(composePresentation(owners(style(pinned), asset), pinned)).presentation;
    const image = node(value(app.project(source)), 'Photo').content.primitives.find(
      (item) => item.kind === 'media',
    );
    assert(image?.kind === 'media');
    expect([image.width, image.height, image.alt]).toEqual([180, 90, 'A sample image']);
    expect(fixture().presentation.project(source)).toMatchObject({
      ok: false,
      error: { code: 'missing-resource' },
    });
    const unsafe = {
      ...owners(style(pinned)),
      assets: {
        read: () => ({
          ok: true as const,
          value: { ...asset, base64: 'https://evil.invalid/image' },
        }),
      },
    };
    expect(value(composePresentation(unsafe, pinned)).presentation.project(source)).toMatchObject({
      ok: false,
      error: { code: 'invalid-input' },
    });
  });
  it('7 keeps shared group representations, compact outlines, links and sequence labels', () => {
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
    const projected = value(fixture().presentation.project(source));
    expect(projected.sections[0]?.nodes).toHaveLength(1);
    expect(projected.sections[0]?.nodes[0]?.groupId).toBe('group');
    expect(projected.sections[1]?.nodes[0]?.content.outline).toContain('Read source');
    expect(projected.sections[1]?.nodes[0]?.navigation[0]?.target).toEqual({
      kind: 'uri',
      uri: 'https://example.org',
    });
    expect(projected.sections[2]?.sequence[0]?.label.outline).toEqual(['Sends request']);
    expect(projected.sections[2]?.sequence[0]?.marker).toBe('arrow');
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
    const summary = node(value(fixture().presentation.project(table)), 'Table');
    expect(text(summary)).toContain('First');
    expect(text(summary)).toContain('Second');
    expect(text(summary)).not.toContain('Hidden body');
    expect(summary.content.outline).toContain('Hidden body');
    expect(summary.content.anchors.every((anchor) => !anchor.collapsed)).toBe(true);
  });
  it('8 keys content and resolved style and freezes detached output', () => {
    const pinned = fonts();
    const tokens = style(pinned);
    const source = collection({ objects: [object('A')], sections: [section('flow', ['A'])] });
    const app = value(composePresentation(owners(tokens), pinned)).presentation;
    const first = value(app.project(source));
    const second = value(app.project(structuredClone(source)));
    expect(first.inputKey).toBe(second.inputKey);
    const inverse = {
      ...tokens,
      roles: { neutral: { fill: '#000000', stroke: '#ffffff', text: '#ffffff' } },
    };
    const themed = value(composePresentation(owners(inverse), pinned)).presentation;
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
      composePresentation(owners({ ...tokens, fontSize: 18 }), pinned),
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
  it('10 rejects invalid providers and nonfinite or oversized public inputs without a partial scene', () => {
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
