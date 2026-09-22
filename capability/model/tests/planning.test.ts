import { expect, test } from 'vitest';
import { plan, validate, type Section } from '../contract/index.js';
import {
  base,
  er,
  graph,
  layout,
  manual,
  node,
  objectAt,
  placed,
  rejectsPlan,
  relation,
  section,
  sectionAt,
  value,
} from './fixtures.js';
test('plan ordered atomic changes', () => {
  const changes = [
    { op: 'create', target: 'relationships', value: relation() },
    { op: 'create', target: 'objects', value: node('a') },
    { op: 'create', target: 'objects', value: node('b') },
  ];
  const result = value(plan(base(), changes));
  expect(result.candidate.objects.map((object) => object.id)).toEqual(['a', 'b']);
  expect(result.impact).toEqual([
    { target: 'objects', id: 'a', action: 'added' },
    { target: 'objects', id: 'b', action: 'added' },
    { target: 'relationships', id: 'ab', action: 'added' },
  ]);
  const before = graph();
  const copy = structuredClone(before);
  rejectsPlan(
    before,
    [
      { op: 'replace', target: 'objects', value: node('a', 'step', { label: 'Changed' }) },
      { op: 'remove', target: 'objects', id: 'b' },
    ],
    'reference',
    '',
  );
  expect(before).toEqual(copy);
  rejectsPlan(base({ schemaVersion: 2 }), [], 'shape', 'schemaVersion');
});
test('enforce operation identity', () => {
  rejectsPlan(
    graph(),
    [{ op: 'create', target: 'objects', value: node('a') }],
    'already-exists',
    'objects.a',
  );
  rejectsPlan(
    graph(),
    [{ op: 'replace', target: 'objects', value: node('missing') }],
    'not-found',
    'objects.missing',
  );
  rejectsPlan(
    graph(),
    [{ op: 'remove', target: 'sources', id: 'missing' }],
    'not-found',
    'sources.missing',
  );
  rejectsPlan(
    graph(),
    [{ op: 'replace-document', value: graph({ id: 'other' }) }],
    'identity',
    'collection',
  );
  rejectsPlan(
    graph(),
    [{ op: 'replace-document', value: graph({ revision: 1 }) }],
    'identity',
    'collection',
  );
  rejectsPlan(graph(), [{ op: 'whatever' }], 'shape', '');
  rejectsPlan(
    base(),
    Array.from({ length: 1001 }, () => ({ op: 'replace-document', value: base() })),
    'shape',
    '',
  );
  const result = value(
    plan(graph(), [
      { op: 'replace', target: 'objects', value: node('a', 'step', { label: 'Edited' }) },
    ]),
  );
  expect(result.candidate.revision).toBe(0);
  expect(objectAt(result.candidate, 'a').label).toBe('Edited');
  expect(result.impact).toEqual([{ target: 'objects', id: 'a', action: 'updated' }]);
});
const semanticSection = () =>
  section('view', 'flow', {
    appearances: [{ object: 'a' }, { object: 'b' }],
    groups: [{ id: 'g', title: 'G', layout: layout() }],
    wires: [{ relationship: 'ab' }],
  });
function expectNestedOverridesCleared(view: Section) {
  view.appearances.forEach((appearance) => expect(appearance).not.toHaveProperty('placement'));
  view.groups.forEach((group) => expect(group).not.toHaveProperty('placement'));
  view.wires.forEach((wire) => {
    expect(wire).not.toHaveProperty('manual');
    expect(wire.locked).toBe(false);
  });
}
test('preserve and reset manual overrides', () => {
  const replacement = { op: 'replace', target: 'sections', value: semanticSection() };
  const retained = sectionAt(value(plan(placed(), [replacement])).candidate);
  expect(retained.placement).toEqual({ x: 5, y: 7, locked: true });
  expect(retained.appearances[0]?.placement).toEqual({ x: 10, y: 20, locked: false });
  expect(retained.groups[0]?.placement).toEqual({ x: 0, y: 0, locked: false });
  expect(retained.wires[0]).toMatchObject({ manual, locked: true });
  const reset = { op: 'reset-layout', section: 'view' };
  const resetThenReplace = sectionAt(value(plan(placed(), [reset, replacement])).candidate);
  expect(resetThenReplace.placement).toBeUndefined();
  expectNestedOverridesCleared(resetThenReplace);
  const explicit = { ...replacement, value: { ...semanticSection(), placement: { x: 70, y: 80 } } };
  const resetThenExplicit = sectionAt(value(plan(placed(), [reset, explicit])).candidate);
  expect(resetThenExplicit.placement).toMatchObject({
    x: 70,
    y: 80,
  });
  expectNestedOverridesCleared(resetThenExplicit);
  const explicitThenReset = sectionAt(value(plan(placed(), [explicit, reset])).candidate);
  expect(explicitThenReset.placement).toBeUndefined();
  expectNestedOverridesCleared(explicitThenReset);
  const route = sectionAt(
    value(plan(placed(), [{ op: 'reset-route', section: 'view', relationship: 'ab' }])).candidate,
  );
  expect(route.wires[0]).not.toHaveProperty('manual');
  expect(route.wires[0]?.locked).toBe(false);
  expect(route.placement).toMatchObject({ x: 5, y: 7 });
  expect(
    sectionAt(value(plan(placed(), [{ op: 'replace-document', value: graph() }])).candidate)
      .wires[0],
  ).toMatchObject({ manual, locked: true });
  const represented = section('view', 'flow', {
    groups: [{ id: 'container', title: 'Container', represents: 'a', layout: layout() }],
    appearances: [{ object: 'b' }],
    wires: [{ relationship: 'ab' }],
  });
  expect(
    sectionAt(
      value(plan(placed(), [{ op: 'replace', target: 'sections', value: represented }])).candidate,
    ).groups[0]?.placement,
  ).toMatchObject({ x: 10, y: 20 });
});
test('delete and hide with explicit impact', () => {
  rejectsPlan(graph(), [{ op: 'delete-object', id: 'a' }], 'delete-referenced', 'objects.a');
  const deleted = value(plan(graph(), [{ op: 'delete-object', id: 'a', cascade: true }]));
  expect(deleted.candidate.objects.map((object) => object.id)).toEqual(['b']);
  expect(deleted.candidate.relationships).toEqual([]);
  expect(sectionAt(deleted.candidate).wires).toEqual([]);
  expect(deleted.impact).toEqual([
    { target: 'objects', id: 'a', action: 'removed' },
    { target: 'relationships', id: 'ab', action: 'removed' },
    { target: 'sections', id: 'view', action: 'updated' },
  ]);
  const hidden = value(plan(graph(), [{ op: 'hide', section: 'view', object: 'a' }]));
  expect(hidden.candidate.objects).toHaveLength(2);
  expect(hidden.candidate.relationships).toHaveLength(1);
  expect(sectionAt(hidden.candidate).appearances.map((appearance) => appearance.object)).toEqual([
    'b',
  ]);
  expect(sectionAt(hidden.candidate).wires).toEqual([]);
  const foreign = value(plan(er(), [{ op: 'delete-object', id: 'customer', cascade: true }]));
  expect(objectAt(foreign.candidate, 'order').content).toEqual([
    { id: 'customer', kind: 'field', label: 'customer', type: 'Id', nullable: false },
  ]);
  expect(value(validate(foreign.candidate)).objects).toHaveLength(1);
  rejectsPlan(
    base(),
    [{ op: 'hide', section: 'missing', object: 'a' }],
    'not-found',
    'sections.missing',
  );
});
test('cascade drops change entries for removed targets', () => {
  const entry = (status: string, target: Readonly<Record<string, unknown>>) => ({ status, target });
  const changed = graph({
    changes: [
      {
        id: 'c1',
        title: 'C1',
        entries: [
          entry('new', { kind: 'object', object: 'a' }),
          entry('changed', { kind: 'object', object: 'b' }),
        ],
      },
      {
        id: 'c2',
        title: 'C2',
        entries: [entry('locked', { kind: 'relationship', relationship: 'ab' })],
      },
    ],
  });
  const deleted = value(plan(changed, [{ op: 'delete-object', id: 'a', cascade: true }]));
  expect(deleted.candidate.changes).toEqual([
    { id: 'c1', title: 'C1', entries: [entry('changed', { kind: 'object', object: 'b' })] },
  ]);
  const lone = base({
    objects: [node('a')],
    changes: [{ id: 'c1', title: 'C1', entries: [entry('new', { kind: 'object', object: 'a' })] }],
  });
  rejectsPlan(lone, [{ op: 'delete-object', id: 'a' }], 'delete-referenced', 'objects.a');
  rejectsPlan(lone, [{ op: 'remove', target: 'objects', id: 'a' }], 'reference', 'changes.c1');
  expect(
    value(plan(lone, [{ op: 'delete-object', id: 'a', cascade: true }])).candidate.changes,
  ).toEqual([]);
});
