import { assert, expect } from 'vitest';
import {
  plan,
  validate,
  type Collection,
  type DiagnosticCode,
  type Mode,
  type Result,
} from '../contract/index.js';
export const digest = `sha256:${'a'.repeat(64)}`;
export const theme = {
  id: 'paper',
  version: '1.0.0',
  digest,
  roles: ['neutral', 'primary', 'supporting', 'decision', 'success', 'warning'],
};
export const layout = (algorithm = 'flow', constraints: readonly unknown[] = []) => ({
  algorithm,
  constraints,
});
export const node = (id: string, kind = 'step', extra: Readonly<Record<string, unknown>> = {}) => ({
  id,
  kind,
  label: id,
  ...extra,
});
export const field = (id: string, extra: Readonly<Record<string, unknown>> = {}) => ({
  id,
  kind: 'field',
  label: id,
  type: 'Id',
  ...extra,
});
export const relation = (
  id = 'ab',
  source = 'a',
  target = 'b',
  extra: Readonly<Record<string, unknown>> = {},
) => ({
  id,
  kind: 'flow',
  label: 'continues',
  source: { object: source },
  target: { object: target },
  ...extra,
});
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
export const section = (
  id = 'view',
  mode: Mode = 'flow',
  extra: Readonly<Record<string, unknown>> = {},
) => ({ id, title: id, mode, layout: layout(algorithms[mode]), ...extra });
export const base = (extra: Readonly<Record<string, unknown>> = {}) => ({
  schemaVersion: 1,
  id: 'demo',
  revision: 0,
  title: 'Demo',
  theme,
  arrangement: layout('grid'),
  ...extra,
});
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
export function value<T>(result: Result<T>): T {
  assert(result.ok, JSON.stringify(result));
  return result.value;
}
export function invalid(result: Result<unknown>, code: DiagnosticCode, path: string) {
  assert(!result.ok, 'Expected rejected public result');
  expect(result).not.toHaveProperty('value');
  expect(result.diagnostics).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code, path: expect.stringContaining(path) }),
    ]),
  );
}
export function rejects(input: unknown, code: DiagnosticCode, path: string) {
  invalid(validate(input), code, path);
}
export function rejectsPlan(input: unknown, changes: unknown, code: DiagnosticCode, path: string) {
  invalid(plan(input, changes), code, path);
}
export function objectAt(collection: Collection, id: string) {
  const result = collection.objects.find((object) => object.id === id);
  assert(result);
  return result;
}
export function sectionAt(collection: Collection, id = 'view') {
  const result = collection.sections.find((section) => section.id === id);
  assert(result);
  return result;
}
export function er() {
  return base({
    objects: [
      node('customer', 'entity', { content: [field('id', { key: 'primary' })] }),
      node('order', 'entity', {
        content: [
          field('customer', { key: 'foreign', references: { object: 'customer', member: 'id' } }),
        ],
      }),
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
export const manual = [
  { x: 10, y: 10 },
  { x: 100, y: 100 },
];
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
