import { assert, expect, test } from 'vitest';
import { definitionDisplay, definitionId, definitionUsages, validate } from '../contract/index.js';
import { base, field, node, rejects, value } from './fixtures.js';

const actor = {
  id: 'actor',
  label: 'Actor',
  expression: {
    kind: 'union' as const,
    items: [
      { kind: 'literal' as const, value: 'Human' },
      { kind: 'literal' as const, value: 'Agent' },
    ],
  },
};

test('validates nested unknown refs and cycles without path explosion', () => {
  rejects(
    base({
      definitions: [
        {
          id: 'alias',
          label: 'Alias',
          expression: {
            kind: 'union',
            items: [
              { kind: 'literal', value: 'X' },
              {
                kind: 'union',
                items: [
                  { kind: 'reference', id: 'missing' },
                  { kind: 'literal', value: 'Y' },
                ],
              },
            ],
          },
        },
      ],
    }),
    'reference',
    'definitions.alias.expression.items.1.items.0',
  );
  rejects(
    base({
      definitions: [
        { id: 'a', label: 'A', expression: { kind: 'reference', id: 'b' } },
        {
          id: 'b',
          label: 'B',
          expression: {
            kind: 'union',
            items: [
              { kind: 'literal', value: 'x' },
              { kind: 'reference', id: 'a' },
            ],
          },
        },
      ],
    }),
    'reference',
    'definitions.a.expression',
  );
});

test('counts every expression node and reports typed missing display lookups', () => {
  const items = Array.from({ length: 300 }, (_, index) => ({
    kind: 'literal' as const,
    value: index,
  }));
  rejects(
    base({ definitions: [{ id: 'large', label: 'Large', expression: { kind: 'union', items } }] }),
    'limit',
    'definitions.large.expression',
  );
  const missing = definitionDisplay(value(validate(base())), definitionId.parse('missing'));
  assert(!missing.ok);
  expect(missing.error.diagnostics[0]?.code).toBe('not-found');
});

test('retains exact definition usages for linked fields and nested aliases', () => {
  const collection = value(
    validate(
      base({
        definitions: [
          actor,
          {
            id: 'alias',
            label: 'Alias',
            expression: {
              kind: 'union',
              items: [
                { kind: 'literal', value: 'X' },
                { kind: 'reference', id: 'actor' },
              ],
            },
          },
        ],
        objects: [
          node('people', 'entity', {
            content: [field('kind', { type: { kind: 'definition', id: 'alias' } })],
          }),
        ],
      }),
    ),
  );
  const usages = definitionUsages(collection, definitionId.parse('actor'));
  assert(usages.ok);
  expect(usages.value).toEqual([
    { kind: 'definition', definition: 'actor', path: 'definitions.alias.expression.items.1' },
  ]);
});

test('stops display expansion at the shared budget with one truncation marker', () => {
  const definitions = Array.from({ length: 40 }, (_, index) => ({
    id: `d${index}`,
    label: `Definition ${index}`,
    expression: {
      kind: 'union' as const,
      items: [
        ...(index < 39 ? [{ kind: 'reference' as const, id: `d${index + 1}` }] : []),
        ...Array.from({ length: 100 }, (__, literal) => ({
          kind: 'literal' as const,
          value: literal,
        })),
      ],
    },
  }));
  const collection = value(validate(base({ definitions })));
  const display = definitionDisplay(collection, definitionId.parse('d0'));
  assert(display.ok);
  expect(display.value.match(/…/gu)?.length ?? 0).toBe(1);
  expect(display.value.length).toBeLessThan(2_000);
});
