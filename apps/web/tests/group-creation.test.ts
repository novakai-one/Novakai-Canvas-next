import { assert, expect, it } from 'vitest';
import { plan, validate } from '@novakai/canvas-model';
import { groupCreationChanges, groupDraftProblem } from '../contract/index.js';

function fixture() {
  const result = validate({
    schemaVersion: 1,
    id: 'creation',
    revision: 0,
    title: 'Creation',
    theme: {
      id: 'paper',
      version: '1.0.0',
      digest: `sha256:${'a'.repeat(64)}`,
      roles: ['neutral'],
    },
    arrangement: { algorithm: 'grid' },
    objects: [
      { id: 'one', kind: 'step', label: 'One' },
      { id: 'two', kind: 'step', label: 'Two' },
    ],
    relationships: [
      {
        id: 'next',
        kind: 'flow',
        label: 'next',
        source: { object: 'one' },
        target: { object: 'two' },
      },
    ],
    sections: [
      {
        id: 'flow',
        title: 'Flow',
        mode: 'flow',
        layout: { algorithm: 'flow' },
        placement: { x: 100, y: 100, locked: false },
        groups: [
          {
            id: 'existing',
            title: 'Existing',
            layout: { algorithm: 'flow' },
            placement: { x: 500, y: 0, locked: true },
          },
        ],
        appearances: [
          { object: 'one', placement: { x: 0, y: 0, locked: true } },
          { object: 'two', placement: { x: 250, y: 0, locked: true } },
        ],
        wires: [
          {
            relationship: 'next',
            manual: [
              { x: 100, y: 50 },
              { x: 200, y: 50 },
            ],
            locked: true,
          },
        ],
      },
    ],
  });
  assert(result.ok, JSON.stringify(result));
  return result.value;
}

it('explicit room-making releases section placement but preserves child geometry through Model preservation', () => {
  const original = fixture();
  const section = original.sections[0];
  assert(section);
  const existing = section.groups[0];
  assert(existing);
  const added = { ...existing, id: 'new' as typeof existing.id, title: 'New' };
  delete added.placement;
  const edited = {
    ...section,
    groups: [...section.groups, added],
  };
  const result = plan(original, groupCreationChanges(edited, true));
  assert(result.ok, JSON.stringify(result));
  const placed = result.value.candidate.sections[0];
  assert(placed);
  expect(placed.placement).toBeUndefined();
  expect(placed.appearances).toEqual(section.appearances);
  expect(placed.wires).toEqual(section.wires);
  expect(placed.groups[0]).toEqual(section.groups[0]);
  expect(placed.groups).toHaveLength(2);
  expect(section.placement).toEqual({ x: 100, y: 100, locked: false });
});

it('default creation preserves placement, and room-making refuses locked diagrams', () => {
  const original = fixture();
  const section = original.sections[0];
  assert(section);
  const result = plan(original, groupCreationChanges(section, false));
  assert(result.ok, JSON.stringify(result));
  expect(result.value.candidate.sections[0]?.placement).toEqual(section.placement);
  const locked = { ...section, placement: { x: 100, y: 100, locked: true } };
  expect(groupDraftProblem({ title: 'New', section: 'flow', findRoom: true }, locked)).toContain(
    'Unlock',
  );
  expect(groupDraftProblem({ title: 'New', section: 'flow' }, locked)).toBeNull();
});
