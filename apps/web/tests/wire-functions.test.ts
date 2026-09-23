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
  plainRelationshipProblem,
  plainWireProblem,
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

it('blocks a blank label and explains owner rejections in plain words', () => {
  const selection = moduleWire('flow');
  const draft = draftAfter(selection, [{ kind: 'label', value: '  ' }]);
  expect(hasBlankLabel(editedWire(draft))).toBe(true);
  const rejected = failure('invariant-violation', 'The owning capability rejected this input', {
    code: 'validation-failed',
    diagnostics: [{ code: 'shape', path: '0.value.label', message: 'Must be nonblank' }],
  });
  expect(plainWireProblem(rejected.error)).toBe(
    'The wire label is empty. Type a label or pick a function.',
  );
  const calls = failure('invariant-violation', 'The owning capability rejected this input', {
    code: 'validation-failed',
    diagnostics: [
      {
        code: 'endpoint',
        path: 'relationships.x.target',
        message: 'Calls target must address a signature or whole function',
      },
    ],
  });
  expect(plainRelationshipProblem(calls.error)).toBe(
    "A 'calls' wire must point at one function. Pick a function in Wire label.",
  );
  expect(plainRelationshipProblem(rejected.error)).not.toContain('wire label');
});
