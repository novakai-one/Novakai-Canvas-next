import { expect, test, vi } from 'vitest';
import { validate } from '../contract/index.js';
import {
  base,
  digest,
  er,
  field,
  graph,
  layout,
  node,
  rejects,
  section,
  theme,
  value,
} from './fixtures.js';
test('accept empty and mixed collection', () => {
  expect(value(validate(base()))).toMatchObject({
    objects: [],
    sections: [],
    relationships: [],
    assets: [],
    sources: [],
  });
  const mixed = base({
    objects: [
      node('m', 'module', {
        content: [
          {
            id: 'signature',
            kind: 'signature',
            label: 'apply',
            parameters: ['input: Change'],
            returns: 'Result',
          },
          { id: 'member', kind: 'member', label: 'planner', type: 'Planner' },
        ],
        ports: [{ id: 'in', direction: 'in', label: 'apply', type: 'Change' }],
      }),
      node('explain', 'note', {
        step: 7,
        content: [
          { kind: 'text', id: 'text', text: '' },
          { kind: 'code', id: 'code', text: 'const x = 1', language: 'ts' },
          { kind: 'list', id: 'list', items: ['One', 'Two'] },
          { kind: 'image', id: 'image', asset: 'diagram' },
          { kind: 'icon', id: 'icon', asset: 'diagram' },
          {
            kind: 'link',
            id: 'link',
            label: 'Source',
            target: { kind: 'uri', uri: 'https://example.com' },
          },
          {
            kind: 'table',
            id: 'table',
            columns: ['Name'],
            rows: [{ id: 'row', cells: ['Model'] }],
          },
        ],
      }),
    ],
    assets: [{ id: 'diagram', digest, mediaType: 'image/svg+xml', alt: 'Model diagram' }],
    sections: [
      section('story', 'story', { appearances: [{ object: 'explain' }] }),
      section('modules', 'modules', { appearances: [{ object: 'm' }] }),
    ],
  });
  expect(value(validate(mixed)).objects.map((object) => object.id)).toEqual(['m', 'explain']);
  expect(value(validate(er())).relationships[0]).toMatchObject({
    from: '1',
    to: '0..many',
    source: { member: 'id' },
    target: { member: 'customer' },
  });
});
function excessiveDepth(): unknown {
  return Array.from({ length: 66 }).reduce<unknown>((value) => [value], 0);
}
function cyclic() {
  const object: { self?: unknown } = {};
  object.self = object;
  return object;
}
test('reject malformed and excessive inputs', () => {
  [
    base({ schemaVersion: 2 }),
    base({ unexpected: 1 }),
    base({ revision: -1 }),
    base({ title: '  ' }),
    base({ id: 'not an id' }),
    base({ revision: Number.MAX_SAFE_INTEGER + 1 }),
    new Date(),
    cyclic(),
    Object.assign(Object.create(Array.prototype), base()),
    Object.defineProperty(base(), 'unsupported', { value: 'must not disappear' }),
    base({ title: undefined }),
    base({ objects: [node('a', 'alien')] }),
  ].forEach((input) => rejects(input, 'shape', ''));
  const getter = vi.fn(() => 'demo');
  rejects(Object.defineProperty({}, 'id', { get: getter }), 'shape', '$');
  expect(getter).not.toHaveBeenCalled();
  rejects(excessiveDepth(), 'limit', '$');
  rejects(
    Array.from({ length: 100001 }, () => 1),
    'limit',
    '$',
  );
  rejects(base({ arrangement: { ...layout(), direction: 'sideways' } }), 'shape', 'arrangement');
  rejects(
    graph({ sections: [section('view', 'flow', { placement: { x: Infinity, y: 0 } })] }),
    'shape',
    'sections',
  );
});
test('enforce scoped identities', () => {
  rejects(graph({ objects: [node('a'), node('a')] }), 'duplicate', 'objects.a');
  rejects(
    base({
      objects: [
        node('a', 'note', {
          ports: [{ id: 'row', direction: 'in', label: 'In', type: 'T' }],
          content: [
            { id: 'table', kind: 'table', columns: ['A'], rows: [{ id: 'row', cells: ['B'] }] },
          ],
        }),
      ],
    }),
    'duplicate',
    'descendants.row',
  );
  expect(
    value(
      validate(
        base({
          objects: [node('same')],
          sources: [{ id: 'same', uri: 'spec.md', status: 'asserted' }],
        }),
      ),
    ).objects[0]?.id,
  ).toBe('same');
  rejects(base({ sections: [section(), section()] }), 'duplicate', 'sections.view');
  rejects(
    base({ objects: [node('a', 'entity', { content: [field('id'), field('id')] })] }),
    'duplicate',
    'descendants.id',
  );
});
test('resolve references and roles', () => {
  rejects(
    base({ objects: [node('a', 'note', { role: 'unknown' })] }),
    'reference',
    'objects.a.role',
  );
  rejects(base({ theme: { ...theme, roles: ['neutral', 'neutral'] } }), 'duplicate', 'theme.roles');
  rejects(
    base({ objects: [node('a', 'note', { sources: ['missing'] })] }),
    'reference',
    'objects.a.sources',
  );
  rejects(
    base({
      objects: [node('a', 'note', { content: [{ kind: 'image', id: 'pic', asset: 'missing' }] })],
    }),
    'reference',
    'objects.a.content.pic',
  );
  rejects(
    base({
      objects: [
        node('a', 'note', {
          content: [
            {
              kind: 'link',
              id: 'link',
              label: 'A',
              target: { kind: 'object', id: 'a', section: 'missing' },
            },
          ],
        }),
      ],
    }),
    'reference',
    'objects.a.content.link.section',
  );
  const sources = [{ id: 'spec', uri: 'spec.md', status: 'source-backed', revision: 'v1' }];
  rejects(
    base({ sources, objects: [node('a', 'note', { sources: ['spec', 'spec'] })] }),
    'duplicate',
    'objects.a.sources',
  );
  expect(
    value(validate(base({ sources, objects: [node('a', 'note', { sources: ['spec'] })] })))
      .sources[0]?.revision,
  ).toBe('v1');
});
