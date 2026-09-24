import { assert, expect } from 'vitest';
import {
  plan,
  validate,
  type Collection,
  type DiagnosticCode,
  type Mode,
  type Result,
} from '../contract/index.js';

/** A well-formed content digest (`sha256:` then `a` × 64), for themes and assets. */
export const digest = `sha256:${'a'.repeat(64)}`;

/** The `paper` theme pin every test collection uses, with six role names. */
export const theme = {
  id: 'paper',
  version: '1.0.0',
  digest,
  roles: ['neutral', 'primary', 'supporting', 'decision', 'success', 'warning'],
};

/** Two manual route points, used by the placed fixture and the route-preservation tests. */
export const manual = [
  { x: 10, y: 10 },
  { x: 100, y: 100 },
];

/**
 * Builds layout intent.
 *
 * @param algorithm - The layout algorithm (default `flow`).
 * @param constraints - The layout constraints (default none).
 * @returns `{ algorithm, constraints }`.
 */
export function layout(algorithm = 'flow', constraints: readonly unknown[] = []) {
  return { algorithm, constraints };
}

/**
 * Builds an object whose label is its ID.
 *
 * @param id - The object ID.
 * @param kind - The object kind (default `step`).
 * @param extra - Fields to add or override, spread last.
 * @returns `{ id, kind, label: id, ...extra }`.
 */
export function node(id: string, kind = 'step', extra: Readonly<Record<string, unknown>> = {}) {
  return { id, kind, label: id, ...extra };
}

/**
 * Builds a `field` content block of type `Id` whose label is its ID.
 *
 * @param id - The block ID.
 * @param extra - Fields to add or override, spread last.
 * @returns `{ id, kind: 'field', label: id, type: 'Id', ...extra }`.
 */
export function field(id: string, extra: Readonly<Record<string, unknown>> = {}) {
  return { id, kind: 'field', label: id, type: 'Id', ...extra };
}

/**
 * Builds a `flow` relationship labelled "continues".
 *
 * @param id - The relationship ID (default `ab`).
 * @param source - The source object (default `a`).
 * @param target - The target object (default `b`).
 * @param extra - Fields to add or override, spread last.
 * @returns The relationship record.
 */
export function relation(
  id = 'ab',
  source = 'a',
  target = 'b',
  extra: Readonly<Record<string, unknown>> = {},
) {
  return {
    id,
    kind: 'flow',
    label: 'continues',
    source: { object: source },
    target: { object: target },
    ...extra,
  };
}

/**
 * Builds a section whose title is its ID and whose layout uses the algorithm the mode allows.
 *
 * @param id - The section ID (default `view`).
 * @param mode - The section mode (default `flow`).
 * @param extra - Fields to add or override, spread last.
 * @returns The section record.
 */
export function section(
  id = 'view',
  mode: Mode = 'flow',
  extra: Readonly<Record<string, unknown>> = {},
) {
  return { id, title: id, mode, layout: layout(algorithms[mode]), ...extra };
}

/**
 * Builds an empty collection `demo` at revision 0 with the paper theme and a grid arrangement.
 *
 * @param extra - Fields to add or override, spread last (for example `objects`).
 * @returns The collection data (unvalidated).
 */
export function base(extra: Readonly<Record<string, unknown>> = {}) {
  return {
    schemaVersion: 1,
    id: 'demo',
    revision: 0,
    title: 'Demo',
    theme,
    arrangement: layout('grid'),
    ...extra,
  };
}

/**
 * Builds the smallest flow diagram: objects `a` and `b`, relationship `ab`, and a `view`
 * section showing both with the wire.
 *
 * @param extra - Collection fields to add or override, spread last.
 * @returns The collection data (unvalidated).
 */
export function graph(extra: Readonly<Record<string, unknown>> = {}) {
  return base({
    objects: [node('a'), node('b')],
    relationships: [relation()],
    sections: [
      section('view', 'flow', {
        appearances: [{ object: 'a' }, { object: 'b' }],
        wires: [{ relationship: 'ab' }],
      }),
    ],
    ...extra,
  });
}

/**
 * Returns a successful result's value; fails the test (showing the result) otherwise.
 *
 * @param result - A public Model result.
 * @returns Its value.
 */
export function value<T>(result: Result<T>): T {
  assert(result.ok, JSON.stringify(result));
  return result.value;
}

/**
 * Checks that a result was rejected, has no value, and has a diagnostic with `code` whose path
 * contains `path`.
 *
 * @param result - A public Model result.
 * @param code - The expected diagnostic code.
 * @param path - Text the diagnostic's path must contain.
 */
export function invalid(result: Result<unknown>, code: DiagnosticCode, path: string) {
  assert(!result.ok, 'Expected rejected public result');
  expect(result).not.toHaveProperty('value');
  const expectedDiagnostic = expect.objectContaining({ code, path: expect.stringContaining(path) });
  expect(result.error.diagnostics).toEqual(expect.arrayContaining([expectedDiagnostic]));
}

/**
 * Checks that `validate` rejects the input (see {@link invalid}).
 *
 * @param input - Collection data.
 * @param code - The expected diagnostic code.
 * @param path - Text the diagnostic's path must contain.
 */
export function rejects(input: unknown, code: DiagnosticCode, path: string) {
  invalid(validate(input), code, path);
}

/**
 * Checks that `plan` rejects the changes (see {@link invalid}).
 *
 * @param input - The snapshot data.
 * @param changes - The change batch.
 * @param code - The expected diagnostic code.
 * @param path - Text the diagnostic's path must contain.
 */
export function rejectsPlan(input: unknown, changes: unknown, code: DiagnosticCode, path: string) {
  invalid(plan(input, changes), code, path);
}

/**
 * Returns the object with this ID; fails the test when there is none.
 *
 * @param collection - A validated collection.
 * @param id - The object ID.
 * @returns The object.
 */
export function objectAt(collection: Collection, id: string) {
  const result = collection.objects.find(
    /** Tells whether this is the object. */
    (object) => object.id === id,
  );
  assert(result);
  return result;
}

/**
 * Returns the section with this ID; fails the test when there is none.
 *
 * @param collection - A validated collection.
 * @param id - The section ID (default `view`).
 * @returns The section.
 */
export function sectionAt(collection: Collection, id = 'view') {
  const result = collection.sections.find(
    /** Tells whether this is the section. */
    (section) => section.id === id,
  );
  assert(result);
  return result;
}

/**
 * Builds an ER diagram: `customer` with primary key `id`, `order` with foreign key `customer`
 * referencing it, a one-to-many association `places` between those fields, and a `data` section.
 *
 * @returns The collection data (unvalidated).
 */
export function er() {
  const customerKey = field('id', { key: 'primary' });
  const orderKey = field('customer', {
    key: 'foreign',
    references: { object: 'customer', member: 'id' },
  });
  return base({
    objects: [
      node('customer', 'entity', { content: [customerKey] }),
      node('order', 'entity', { content: [orderKey] }),
    ],
    relationships: [
      relation('places', 'customer', 'order', {
        kind: 'association',
        from: '1',
        to: '0..many',
        source: { object: 'customer', member: 'id' },
        target: { object: 'order', member: 'customer' },
      }),
    ],
    sections: [
      section('data', 'er', {
        appearances: [{ object: 'customer' }, { object: 'order' }],
        wires: [{ relationship: 'places' }],
      }),
    ],
  });
}

/**
 * Builds {@link graph} with hand-made geometry in `view`: a locked section placement, a
 * placement on `a` (none on `b`), a placed group `g`, and a locked manual route on `ab`.
 *
 * @returns The collection data (unvalidated).
 */
export function placed() {
  return graph({
    sections: [
      section('view', 'flow', {
        placement: { x: 5, y: 7, locked: true },
        appearances: [{ object: 'a', placement: { x: 10, y: 20 } }, { object: 'b' }],
        groups: [{ id: 'g', title: 'G', layout: layout(), placement: { x: 0, y: 0 } }],
        wires: [{ relationship: 'ab', manual, locked: true }],
      }),
    ],
  });
}

/** The layout algorithm each mode's test section uses. */
const algorithms: Readonly<Record<Mode, string>> = {
  flow: 'flow',
  er: 'layered',
  modules: 'layered',
  tree: 'tree',
  sequence: 'sequence',
  state: 'flow',
  story: 'grid',
  grid: 'grid',
};
