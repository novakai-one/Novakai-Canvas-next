import { it, expect, assert } from 'vitest';
import { validate, plan, descendantId, objectId } from '@novakai/canvas-model';
import { snapshotSchema } from '@novakai/canvas-authoring';
import {
  createWireSession,
  editedWire,
  failure,
  functionTarget,
  hasBlankLabel,
  moduleFunctions,
  newFunctionId,
  newFunctionProblem,
  plainWireProblem,
  wireApplyBlock,
  wireChanges,
} from '../contract/index.js';
import { readWireDrafts } from '../adapters/wire-reader.js';
import type { WireEdit, WireSelection } from '../contract/records/wire-editor.js';
import { memoryRetention, snapshot } from './recovery-fixtures.js';

/** Two modules joined by an imports wire whose label names no function yet. */
function moduleWire(kind: 'imports' | 'flow' = 'imports'): WireSelection {
  const original = snapshot(0);
  const stored = original.records[0];
  assert(stored);
  const checked = validate({
    ...(stored.value as Record<string, unknown>),
    objects: [
      { id: 'cli', label: 'CLI', kind: 'module' },
      {
        id: 'service',
        label: 'Issue service',
        kind: 'module',
        content: [
          { kind: 'signature', id: 'submit', label: 'submit', parameters: [], returns: 'void' },
        ],
      },
    ],
    relationships: [
      {
        id: 'create',
        kind,
        label: 'creates issue',
        source: { object: 'cli' },
        target: { object: 'service' },
      },
    ],
    sections: [
      {
        id: 'modules',
        title: 'Modules',
        mode: kind === 'imports' ? 'modules' : 'flow',
        layout: { algorithm: 'layered' },
        appearances: [{ object: 'cli' }, { object: 'service' }],
        wires: [{ relationship: 'create' }],
      },
    ],
  });
  assert(checked.ok, JSON.stringify(checked));
  const collection = checked.value;
  const section = collection.sections[0];
  const relationship = collection.relationships[0];
  assert(section && relationship && section.wires[0]);
  const base = snapshotSchema.parse({ ...original, records: [{ ...stored, value: collection }] });
  return { base, collection, section, relationship, wire: section.wires[0], generation: 'g1' };
}
function session() {
  return createWireSession({
    retention: memoryRetention(),
    read: readWireDrafts,
    report: () => undefined,
    apply: async () => failure('unused', 'not submitted in this test'),
  });
}
function draftAfter(selection: WireSelection, edits: readonly WireEdit[]) {
  const editor = session();
  editor.restore(selection.base.workspace);
  edits.forEach((edit) => editor.edit(selection, edit));
  const draft = editor.getSnapshot().drafts[0];
  assert(draft);
  return draft;
}
function choice(member: string, label: string, create: boolean): WireEdit {
  return {
    kind: 'function',
    object: objectId.parse('service'),
    member: descendantId.parse(member),
    label,
    create,
  };
}

it('offers the target module functions only for imports and calls wires into a module', () => {
  const selection = moduleWire();
  const target = functionTarget(selection.collection, selection.relationship);
  assert(target);
  expect(moduleFunctions(target)).toEqual([{ id: 'submit', label: 'submit' }]);
  const plain = moduleWire('flow');
  expect(functionTarget(plain.collection, plain.relationship)).toBeNull();
});

it('points the wire at an existing function without changing the module', () => {
  const selection = moduleWire();
  const changes = wireChanges(draftAfter(selection, [choice('submit', 'submit', false)]));
  expect(
    changes.map((change) => change.op + ':' + ('target' in change ? change.target : '')),
  ).toEqual(['replace:relationships']);
  const result = plan(selection.collection, changes);
  assert(result.ok, JSON.stringify(result));
  expect(result.value.candidate.relationships[0]).toMatchObject({
    label: 'submit',
    target: { object: 'service', member: 'submit' },
  });
});

it('adds a new function to the module and names the wire after it in one change list', () => {
  const selection = moduleWire();
  const draft = draftAfter(selection, [choice('createIssue', 'createIssue', true)]);
  expect(editedWire(draft).created).toEqual({
    object: 'service',
    id: 'createIssue',
    label: 'createIssue',
  });
  const result = plan(selection.collection, wireChanges(draft));
  assert(result.ok, JSON.stringify(result));
  const service = result.value.candidate.objects.find((object) => object.id === 'service');
  expect(service?.content.map((block) => block.id)).toEqual(['submit', 'createIssue']);
  expect(result.value.candidate.relationships[0]?.target).toEqual({
    object: 'service',
    member: 'createIssue',
  });
});

it('drops a staged function when the wire is retargeted or an existing function is picked', () => {
  const selection = moduleWire();
  const retarget: WireEdit = {
    kind: 'endpoint',
    side: 'target',
    value: { object: objectId.parse('service') },
  };
  const retargeted = draftAfter(selection, [choice('createIssue', 'createIssue', true), retarget]);
  expect(editedWire(retargeted).created).toBeNull();
  const picked = draftAfter(selection, [
    choice('createIssue', 'createIssue', true),
    choice('submit', 'submit', false),
  ]);
  expect(
    wireChanges(picked).some((change) => 'target' in change && change.target === 'objects'),
  ).toBe(false);
});

it('derives a readable, unique function identity from the typed name', () => {
  const target = functionTarget(moduleWire().collection, moduleWire().relationship);
  assert(target);
  expect(newFunctionId('create issue', target, null)).toBe('create-issue');
  expect(newFunctionId('submit', target, null)).toBe('submit-2');
  expect(newFunctionId('1st', target, null)).toBe('fn-1st');
  expect(newFunctionId('   ', target, null)).toBe('');
});

it('says why Apply is off: blank label, unusable new name, or a calls wire with no function', () => {
  const plain = moduleWire('flow');
  const blank = editedWire(draftAfter(plain, [{ kind: 'label', value: '  ' }]));
  expect(hasBlankLabel(blank)).toBe(true);
  expect(wireApplyBlock(plain.collection, blank)).toBe('The wire label is empty. Type a label.');
  const selection = moduleWire();
  const target = functionTarget(selection.collection, selection.relationship);
  assert(target);
  const naming = (name: string) =>
    wireApplyBlock(
      selection.collection,
      editedWire(draftAfter(selection, [{ kind: 'function-name', name }])),
    );
  expect(naming('')).toBe('Type a name for the new function.');
  expect(naming('!!!')).toBe('Name needs a letter or digit.');
  expect(naming('Submit')).toBe(
    "Issue service already has 'submit'. Pick it from the list instead.",
  );
  expect(newFunctionProblem('createIssue', target, null)).toBeNull();
  const calls = editedWire(draftAfter(selection, [{ kind: 'relationship-kind', value: 'calls' }]));
  expect(wireApplyBlock(selection.collection, calls)).toBe(
    "A 'calls' wire must point at one function. Pick one in Wire label.",
  );
  const picked = editedWire(
    draftAfter(selection, [
      { kind: 'relationship-kind', value: 'calls' },
      choice('submit', 'submit', false),
    ]),
  );
  expect(wireApplyBlock(selection.collection, picked)).toBeNull();
});

it('an unusable name or a non-function kind drops the staged function', () => {
  const selection = moduleWire();
  const renamed = draftAfter(selection, [
    choice('createIssue', 'createIssue', true),
    { kind: 'function-name', name: 'submit' },
  ]);
  expect(editedWire(renamed).created).toBeNull();
  expect(editedWire(renamed).naming).toBe('submit');
  const flow = draftAfter(selection, [
    choice('createIssue', 'createIssue', true),
    { kind: 'relationship-kind', value: 'flow' },
  ]);
  expect(editedWire(flow).created).toBeNull();
  expect(
    wireChanges(flow).some((change) => 'target' in change && change.target === 'objects'),
  ).toBe(false);
});

it('explains owner rejections by code and path, not by their wording', () => {
  const rejected = (code: string, path: string) =>
    failure('invariant-violation', 'The owning capability rejected this input', {
      code: 'validation-failed',
      diagnostics: [{ code, path, message: 'owner wording that is never parsed' }],
    }).error;
  const flow = { kind: 'flow', moduleWire: false } as const;
  const calls = { kind: 'calls', moduleWire: true } as const;
  expect(plainWireProblem(rejected('shape', '0.value.label'), flow)).toBe(
    'The wire label is empty. Type a label.',
  );
  expect(plainWireProblem(rejected('shape', '0.value.label'), calls)).toBe(
    'The wire label is empty. Pick a function in Wire label.',
  );
  expect(plainWireProblem(rejected('endpoint', 'relationships.x.target'), calls)).toBe(
    "A 'calls' wire must point at one function. Pick one in Wire label.",
  );
  expect(plainWireProblem(rejected('endpoint', 'relationships.x'), flow)).toBe(
    "Only association wires have cardinalities. Set both to 'Not specified'.",
  );
  const stale = failure('revision-conflict', 'The observed record version has changed', {
    code: 'revision-conflict',
    path: 'collection:demo',
    message: 'The observed record version has changed',
    recovery: 'Reload',
  }).error;
  expect(plainWireProblem(stale, flow)).toBe(
    'Someone changed this collection. Discard the draft and redo it.',
  );
});
