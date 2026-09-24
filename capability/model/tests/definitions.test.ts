import { assert, expect, test } from 'vitest';
import { definitionDisplay, definitionId, definitionUsages, validate } from '../contract/index.js';
import { base, field, node, rejects, value } from './fixtures.js';

/**
 * A missing reference nested two unions deep is reported at its exact path, and a two-definition
 * cycle through a union is reported at the first definition's expression.
 */
test('validates nested unknown refs and cycles without path explosion', () => {
  // Check: `alias` = "X" | ("missing" ref | "Y").
  const alias = {
    id: 'alias',
    label: 'Alias',
    expression: union(literal('X'), union(reference('missing'), literal('Y'))),
  };
  rejects(
    base({ definitions: [alias] }),
    'reference',
    'definitions.alias.expression.items.1.items.0',
  );

  // Check: `a` → `b` → ("x" | `a`).
  const cycle = [
    { id: 'a', label: 'A', expression: reference('b') },
    { id: 'b', label: 'B', expression: union(literal('x'), reference('a')) },
  ];
  rejects(base({ definitions: cycle }), 'reference', 'definitions.a.expression');
});

/**
 * A union of 300 literals (301 nodes) breaks the 256-node limit, and showing a missing
 * definition returns a typed `not-found` failure.
 */
test('counts every expression node and reports typed missing display lookups', () => {
  // Check: 301 nodes.
  const items = Array.from(
    { length: 300 },
    /** Literal number `index`. */
    (_, index) => ({ kind: 'literal' as const, value: index }),
  );
  rejects(
    base({ definitions: [{ id: 'large', label: 'Large', expression: { kind: 'union', items } }] }),
    'limit',
    'definitions.large.expression',
  );

  // Check: a missing definition.
  const missing = definitionDisplay(value(validate(base())), definitionId.parse('missing'));
  assert(!missing.ok);
  expect(missing.error.diagnostics[0]?.code).toBe('not-found');
});

/**
 * `actor` is used once directly: inside `alias`. The field typed with `alias` is a use of
 * `alias`, not of `actor`.
 */
test('retains exact definition usages for linked fields and nested aliases', () => {
  // Arrange: `alias` = "X" | `actor`; field `people.kind` has type `alias`.
  const alias = {
    id: 'alias',
    label: 'Alias',
    expression: union(literal('X'), reference('actor')),
  };
  const people = node('people', 'entity', {
    content: [field('kind', { type: { kind: 'definition', id: 'alias' } })],
  });
  const collection = value(validate(base({ definitions: [actor, alias], objects: [people] })));

  // Act
  const usages = definitionUsages(collection, definitionId.parse('actor'));

  // Check: one definition use, with only kind, definition and path.
  assert(usages.ok);
  expect(usages.value).toEqual([
    { kind: 'definition', definition: 'actor', path: 'definitions.alias.expression.items.1' },
  ]);
});

/**
 * A chain of 40 definitions, each a reference to the next plus 100 literals, is far more than
 * 256 nodes: the display stops at the shared budget, shows one ` …` marker and stays short.
 */
test('stops display expansion at the shared budget with one truncation marker', () => {
  // Arrange: d0 → d1 → … → d39, each with 100 literals.
  const definitions = Array.from(
    { length: 40 },
    /** Definition `d<index>`: a reference to the next one (except the last) and 100 literals. */
    (_, index) => ({
      id: `d${index}`,
      label: `Definition ${index}`,
      expression: {
        kind: 'union' as const,
        items: [
          ...(index < 39 ? [{ kind: 'reference' as const, id: `d${index + 1}` }] : []),
          ...Array.from(
            { length: 100 },
            /** Literal number `literal`. */
            (__, literal) => ({ kind: 'literal' as const, value: literal }),
          ),
        ],
      },
    }),
  );
  const collection = value(validate(base({ definitions })));

  // Act
  const display = definitionDisplay(collection, definitionId.parse('d0'));

  // Check: one marker, bounded length.
  assert(display.ok);
  expect(display.value.match(/…/gu)?.length ?? 0).toBe(1);
  expect(display.value.length).toBeLessThan(2_000);
});

/** Definition `actor` = "Human" | "Agent". */
const actor = {
  id: 'actor',
  label: 'Actor',
  expression: union(literal('Human'), literal('Agent')),
};

/**
 * Builds a union expression.
 *
 * @param items - The union's items.
 * @returns `{ kind: 'union', items }`.
 */
function union(...items: readonly object[]) {
  return { kind: 'union' as const, items };
}

/**
 * Builds a literal expression.
 *
 * @param literalValue - The literal's value.
 * @returns `{ kind: 'literal', value }`.
 */
function literal(literalValue: string) {
  return { kind: 'literal' as const, value: literalValue };
}

/**
 * Builds a reference expression.
 *
 * @param id - The referenced definition's ID.
 * @returns `{ kind: 'reference', id }`.
 */
function reference(id: string) {
  return { kind: 'reference' as const, id };
}
