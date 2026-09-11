import { expect, test } from 'vitest';
import { validate } from '../contract/index.js';
import { base, er, field, graph, node, rejects, relation, value } from './fixtures.js';
test('validate endpoint types', () => {
  rejects(
    graph({ relationships: [relation('ab', 'a', 'missing')] }),
    'reference',
    'relationships.ab.target',
  );
  rejects(
    graph({
      relationships: [relation('ab', 'a', 'b', { source: { object: 'a', member: 'missing' } })],
    }),
    'endpoint',
    'source.member',
  );
  rejects(
    graph({ relationships: [relation('ab', 'a', 'b', { from: '1' })] }),
    'endpoint',
    'relationships.ab',
  );
  rejects(
    graph({ relationships: [relation('ab', 'a', 'b', { kind: 'calls' })] }),
    'endpoint',
    'target',
  );
  const objects = [
    node('module', 'module', {
      content: [{ kind: 'member', id: 'member', label: 'plan', type: 'Planner' }],
    }),
    node('interface', 'interface'),
  ];
  expect(
    value(
      validate(
        base({
          objects,
          relationships: [
            relation('impl', 'module', 'interface', {
              kind: 'implements',
              source: { object: 'module', member: 'member' },
            }),
          ],
        }),
      ),
    ).relationships[0]?.kind,
  ).toBe('implements');
  rejects(
    base({
      objects: [
        node('a', 'note', { content: [{ kind: 'text', id: 'text', text: 'Hi' }] }),
        node('b'),
      ],
      relationships: [relation('ab', 'a', 'b', { source: { object: 'a', member: 'text' } })],
    }),
    'endpoint',
    'source.member',
  );
});
function composite(extra: Readonly<Record<string, unknown>> = {}) {
  return base({
    objects: [
      node('parent', 'entity', {
        content: [
          field('tenant'),
          field('id'),
          { kind: 'keygroup', id: 'pk', key: 'primary', fields: ['tenant', 'id'] },
        ],
      }),
      node('child', 'entity', {
        content: [
          field('tenant'),
          field('parent'),
          {
            kind: 'keygroup',
            id: 'fk',
            key: 'foreign',
            fields: ['tenant', 'parent'],
            references: [
              { object: 'parent', member: 'tenant' },
              { object: 'parent', member: 'id' },
            ],
            ...extra,
          },
        ],
      }),
    ],
  });
}
test('validate ER keys', () => {
  expect(value(validate(composite())).objects).toHaveLength(2);
  rejects(
    composite({
      references: [
        { object: 'parent', member: 'id' },
        { object: 'parent', member: 'tenant' },
      ],
    }),
    'key',
    'objects.child.content.fk',
  );
  rejects(
    composite({ references: [{ object: 'parent', member: 'tenant' }] }),
    'key',
    'objects.child.content.fk',
  );
  rejects(composite({ fields: ['tenant', 'tenant'] }), 'duplicate', 'objects.child.content.fk');
  rejects(
    composite({
      references: [
        { object: 'parent', member: 'tenant' },
        { object: 'missing', member: 'id' },
      ],
    }),
    'reference',
    'objects.child.content.fk',
  );
  rejects(
    base({ objects: [node('a', 'entity', { content: [field('id', { key: 'foreign' })] })] }),
    'key',
    'objects.a.content.id',
  );
  rejects(
    base({
      objects: [
        node('a', 'entity', {
          content: [
            field('id'),
            { kind: 'keygroup', id: 'pk', key: 'primary', fields: ['id'], references: [] },
          ],
        }),
      ],
    }),
    'key',
    'objects.a.content.pk',
  );
  rejects(
    base({
      objects: [
        node('a', 'entity', {
          content: [field('id', { key: 'primary' }), field('other', { key: 'primary' })],
        }),
      ],
    }),
    'key',
    'objects.a.content',
  );
  const valid = value(validate(er()));
  rejects(
    {
      ...valid,
      objects: valid.objects.map((object) => ({
        ...object,
        content: object.content.map((block) => alteredType(block)),
      })),
    },
    'key',
    'objects.order',
  );
});
function alteredType(block: import('../contract/index.js').ContentBlock) {
  if ('id' in block && block.id === 'customer') return { ...block, type: 'Different' };
  return block;
}
test('validate content payloads', () => {
  rejects(
    base({ objects: [node('a', 'note', { content: [field('id')] })] }),
    'content',
    'objects.a.content.id',
  );
  rejects(
    base({
      objects: [
        node('a', 'note', {
          content: [
            {
              kind: 'table',
              id: 'table',
              columns: ['A', 'B'],
              rows: [{ id: 'row', cells: ['one'] }],
            },
          ],
        }),
      ],
    }),
    'content',
    'objects.a.content.table.row',
  );
  rejects(
    base({
      objects: [
        node('a', 'note', {
          content: [{ kind: 'member', id: 'member', label: 'x', type: 'string' }],
        }),
      ],
    }),
    'content',
    'objects.a.content.member',
  );
  rejects(base({ objects: [node('a', 'step', { step: 0 })] }), 'shape', 'objects');
  expect(
    value(
      validate(base({ objects: [node('a', 'step', { step: 1 }), node('b', 'step', { step: 1 })] })),
    ).objects.map((object) => object.step),
  ).toEqual([1, 1]);
});
