import { it, expect, assert } from 'vitest';
import { validate, plan, descendantId, objectId } from '@novakai/canvas-model';
import { snapshotSchema } from '@novakai/canvas-authoring';
import {
  createWireSession,
  editedWire,
  failure,
  functionTarget,
  moduleFunctions,
  newFunctionId,
  newFunctionProblem,
  plainWireProblem,
  wireApplyBlock,
  wireChanges,
} from '../contract/index.js';
import { readWireDrafts } from '../adapters/wire-reader.js';
import type { WireDraft, WireEdit, WireSelection } from '../contract/records/wire-editor.js';
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
          { kind: 'member', id: 'store', label: 'store', type: 'Store' },
          { kind: 'signature', id: 'close', label: 'close', parameters: [], returns: 'void' },
        ],
      },
      {
        id: 'port',
        label: 'Issue port',
        kind: 'interface',
        content: [
          { kind: 'signature', id: 'open', label: 'open', parameters: [], returns: 'void' },
        ],
      },
      {
        id: 'fn',
        label: 'validate',
        kind: 'function',
        content: [
          { kind: 'signature', id: 'call', label: 'validate', parameters: [], returns: 'void' },
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
        appearances: [
          { object: 'cli' },
          { object: 'service' },
          { object: 'port' },
          { object: 'fn' },
        ],
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
    preview: async () => failure('unused', 'not previewed in this test'),
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
/** The gate exactly as composition binds it: the Model's own planner. */
function block(selection: WireSelection, draft: WireDraft): string | null {
  return wireApplyBlock(draft, selection.collection, plan);
}
/** The Model accepts the change list and, for a module wire, the target is one of its functions. */
function acceptedAndNamed(
  selection: WireSelection,
  draft: WireDraft,
  member: string | undefined,
): boolean {
  const owner = functionTarget(selection.collection, editedWire(draft).relationship);
  const named = owner === null || moduleFunctions(owner).some((item) => item.id === member);
  return named && plan(selection.collection, wireChanges(draft)).ok;
}
function retarget(object: string, member?: string): WireEdit {
  const value =
    member === undefined
      ? { object: objectId.parse(object) }
      : { object: objectId.parse(object), member: descendantId.parse(member) };
  return { kind: 'endpoint', side: 'target', value };
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

it('offers the target functions only for imports and calls wires into a module or interface', () => {
  const selection = moduleWire();
  const target = functionTarget(selection.collection, selection.relationship);
  assert(target);
  expect(moduleFunctions(target)).toEqual([
    { id: 'submit', label: 'submit' },
    { id: 'store', label: 'store' },
    { id: 'close', label: 'close' },
  ]);
  const port = editedWire(draftAfter(selection, [retarget('port')])).relationship;
  expect(functionTarget(selection.collection, port)?.id).toBe('port');
  const fn = editedWire(draftAfter(selection, [retarget('fn')])).relationship;
  expect(functionTarget(selection.collection, fn)).toBeNull();
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

it('picking the function the wire already names changes nothing and keeps Apply off', () => {
  const start = moduleWire();
  const relationship = {
    ...start.relationship,
    label: 'submit',
    target: { object: objectId.parse('service'), member: descendantId.parse('submit') },
  };
  const selection = { ...start, relationship };
  const draft = draftAfter(selection, [
    choice('close', 'close', false),
    choice('submit', 'submit', false),
  ]);
  expect(wireChanges(draft)).toEqual([]);
  expect(block(selection, draft)).toBe('Nothing changed. The wire already looks like this.');
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
  expect(service?.content.map((block) => block.id)).toEqual([
    'submit',
    'store',
    'close',
    'createIssue',
  ]);
  expect(result.value.candidate.relationships[0]?.target).toEqual({
    object: 'service',
    member: 'createIssue',
  });
});

it('retargeting keeps a staged function only when the target is that function', () => {
  const selection = moduleWire();
  const staged = choice('createIssue', 'createIssue', true);
  const kept = draftAfter(selection, [staged, retarget('service', 'createIssue')]);
  expect(editedWire(kept).created).toEqual({
    object: 'service',
    id: 'createIssue',
    label: 'createIssue',
  });
  expect(block(selection, kept)).toBeNull();
  const moved = draftAfter(selection, [staged, retarget('service', 'submit')]);
  expect(editedWire(moved).created).toBeNull();
  expect(editedWire(moved).relationship.label).toBe('submit');
  const picked = draftAfter(selection, [staged, choice('submit', 'submit', false)]);
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

it('says why Apply is off: blank label, unusable new name, calls without a function', () => {
  const plain = moduleWire('flow');
  expect(block(plain, draftAfter(plain, [{ kind: 'label', value: '  ' }]))).toBe(
    'The wire label is empty. Type a label.',
  );
  const selection = moduleWire();
  const target = functionTarget(selection.collection, selection.relationship);
  assert(target);
  const naming = (name: string) =>
    block(selection, draftAfter(selection, [{ kind: 'function-name', name }]));
  expect(naming('')).toBe('Type a name for the new function.');
  const identifier =
    'Use letters, digits and _ only, starting with a letter. No spaces. Example: submitIssue';
  for (const name of ['!!!', '日本語', 'submit issue', '2fast'])
    expect(naming(name)).toBe(identifier);
  expect(naming('Submit')).toBe(
    "Issue service already has function 'submit'. Pick it from the list instead.",
  );
  expect(naming('store')).toBe(
    "Issue service already has function 'store'. Pick it from the list instead.",
  );
  expect(newFunctionProblem('createIssue', target, null)).toBeNull();
  const calls = draftAfter(selection, [{ kind: 'relationship-kind', value: 'calls' }]);
  expect(block(selection, calls)).toBe('Pick a function in Wire label.');
  const picked = draftAfter(selection, [
    { kind: 'relationship-kind', value: 'calls' },
    choice('submit', 'submit', false),
  ]);
  expect(block(selection, picked)).toBeNull();
  const missing = draftAfter(selection, [choice('gone', 'gone', false)]);
  expect(block(selection, missing)).toBe('Pick a function in Wire label.');
});

it('turns Apply off before sending when the collection moved on since the draft', () => {
  const selection = moduleWire();
  const draft = draftAfter(selection, [choice('submit', 'submit', false)]);
  const current = { ...selection.collection, revision: selection.collection.revision + 1 };
  expect(wireApplyBlock(draft, current, plan)).toBe(
    'This collection changed since the draft started. Discard the draft and redo it.',
  );
});

it('Apply is on only when the Model accepts the draft and a module wire names a function', () => {
  const selection = moduleWire();
  const kinds = ['flow', 'association', 'imports', 'calls', 'implements', 'reference'] as const;
  const targets = [
    retarget('service'),
    retarget('service', 'submit'),
    retarget('service', 'store'),
    retarget('port'),
    retarget('port', 'open'),
    retarget('fn'),
    retarget('fn', 'call'),
  ];
  kinds.forEach((value) =>
    targets.forEach((target) => {
      const draft = draftAfter(selection, [target, { kind: 'relationship-kind', value }]);
      const reason = block(selection, draft);
      const member = target.kind === 'endpoint' ? target.value.member : undefined;
      const expected = acceptedAndNamed(selection, draft, member);
      expect(reason === null, `${value} ${JSON.stringify(target)}`).toBe(expected);
      expect(reason ?? 'accepted').not.toMatch(/^The wire cannot be saved/);
    }),
  );
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
  expect(editedWire(flow).relationship).toMatchObject({
    label: 'creates issue',
    target: { object: 'service' },
  });
  expect(editedWire(flow).relationship.target.member).toBeUndefined();
  expect(editedWire(renamed).relationship.target.member).toBeUndefined();
  const back = draftAfter(selection, [
    choice('createIssue', 'createIssue', true),
    { kind: 'relationship-kind', value: 'flow' },
    { kind: 'relationship-kind', value: 'imports' },
  ]);
  expect(block(selection, back)).toBe('Pick a function in Wire label.');
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
  const flow = { kind: 'flow', picker: false } as const;
  const calls = { kind: 'calls', picker: true } as const;
  expect(plainWireProblem(rejected('shape', '0.value.label'), flow)).toBe(
    'The wire label is empty. Type a label.',
  );
  expect(plainWireProblem(rejected('shape', '0.value.label'), calls)).toBe(
    'The wire label is empty. Pick a function in Wire label.',
  );
  expect(plainWireProblem(rejected('shape', 'objects.service.label'), flow)).toMatch(
    /^The wire was not saved/,
  );
  expect(plainWireProblem(rejected('endpoint', 'relationships.x.target'), calls)).toBe(
    "A 'calls' wire must point at one function. Pick one in Wire label.",
  );
  expect(plainWireProblem(rejected('endpoint', 'relationships.x'), flow)).toBe(
    "Only association wires have cardinalities. Set both to 'Not specified'.",
  );
  expect(plainWireProblem(rejected('mode', 'sections.s.wires.x'), flow)).toBe(
    "This section does not allow 'flow' wires. Choose another relationship kind.",
  );
  expect(plainWireProblem(rejected('reference', 'sections.s.wires.x.target'), flow)).toBe(
    'The target is not shown in this section. Choose a target endpoint that appears here.',
  );
  const stale = failure('revision-conflict', 'The observed record version has changed', {
    code: 'revision-conflict',
    path: 'collection:demo',
    message: 'The observed record version has changed',
    recovery: 'Reload',
  }).error;
  expect(plainWireProblem(stale, flow)).toBe(
    'This collection changed since the draft started. Discard the draft and redo it.',
  );
});

it('the label of a module wire is the name of its target function', () => {
  const selection = moduleWire();
  const moved = draftAfter(selection, [
    choice('submit', 'submit', false),
    retarget('service', 'close'),
  ]);
  expect(editedWire(moved).relationship).toMatchObject({
    label: 'close',
    target: { object: 'service', member: 'close' },
  });
  expect(block(selection, moved)).toBeNull();
  const only = draftAfter(selection, [retarget('service', 'submit')]);
  expect(editedWire(only).relationship.label).toBe('submit');
  const other = draftAfter(selection, [retarget('port', 'open')]);
  expect(editedWire(other).relationship.label).toBe('open');
  const saved = plan(selection.collection, wireChanges(moved));
  assert(saved.ok, JSON.stringify(saved));
  expect(saved.value.candidate.relationships[0]).toMatchObject({
    label: 'close',
    target: { member: 'close' },
  });
});

it('a module wire never keeps a hand-typed label', () => {
  const plain = moduleWire('flow');
  const typed = draftAfter(plain, [
    { kind: 'label', value: 'hand typed label' },
    { kind: 'relationship-kind', value: 'imports' },
  ]);
  expect(editedWire(typed).relationship.label).toBeUndefined();
  expect(block(plain, typed)).toBe('Pick a function in Wire label.');
  const selection = moduleWire();
  const relabelled = draftAfter(selection, [
    choice('submit', 'submit', false),
    { kind: 'label', value: 'hand typed label' },
  ]);
  expect(editedWire(relabelled).relationship.label).toBe('submit');
  const legacy = draftAfter(selection, [{ kind: 'style', value: 'dashed' }]);
  expect(block(selection, legacy)).toBe('Pick a function in Wire label.');
  const back = draftAfter(plain, [
    { kind: 'label', value: 'hand typed label' },
    { kind: 'relationship-kind', value: 'imports' },
    { kind: 'relationship-kind', value: 'flow' },
  ]);
  expect(editedWire(back).relationship.label).toBe('hand typed label');
});

it('a new target starts from the automatic route; an unchanged target keeps its route', () => {
  const plain = moduleWire();
  const wire = {
    ...plain.wire,
    sourceSide: 'bottom',
    targetSide: 'top',
    manual: [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
    ],
    locked: true,
  } as const;
  const selection = { ...plain, wire, section: { ...plain.section, wires: [wire] } };
  const picked = draftAfter(selection, [choice('submit', 'submit', false)]);
  expect(editedWire(picked).wire).toMatchObject({ sourceSide: 'auto', targetSide: 'auto' });
  expect(editedWire(picked).wire.manual).toBeUndefined();
  expect(editedWire(picked).wire.locked).toBe(false);
  expect(wireChanges(picked).map((change) => change.op)).toEqual([
    'replace',
    'reset-route',
    'replace',
  ]);
  const moved = draftAfter(selection, [retarget('port', 'open')]);
  expect(editedWire(moved).wire.targetSide).toBe('auto');
  const same = draftAfter(selection, [retarget('service'), { kind: 'style', value: 'dashed' }]);
  expect(editedWire(same).wire).toBe(wire);
  const sided = draftAfter(selection, [
    choice('submit', 'submit', false),
    { kind: 'side', side: 'targetSide', value: 'left' },
  ]);
  expect(editedWire(sided).wire.targetSide).toBe('left');
});

it('a layout rejection reads as a plain step, never as raw JSON', () => {
  const layout = failure('constraint-conflict', 'A rendering owner rejected the input', {
    code: 'invalid-input',
    path: 'render',
    message: 'A rendering owner rejected the input',
    recovery: 'Retry',
    source: {
      code: 'constraint-conflict',
      path: 'modules',
      message: '{"code":"unroutable-leg","wireId":"w01","ownerId":"frozen-scene"}',
      recovery: 'Retry',
    },
  }).error;
  const context = { kind: 'imports', picker: true } as const;
  expect(plainWireProblem(layout, context)).toMatch(/^The layout cannot route this wire\./);
  const unknown = failure('surprise', '{"code":"x"}').error;
  expect(plainWireProblem(unknown, context)).toBe('The wire was not saved (surprise).');
});

it('the dry run sends exactly the change list Apply would send, and writes nothing', async () => {
  const selection = moduleWire();
  const sent: unknown[] = [];
  const editor = createWireSession({
    retention: memoryRetention(),
    read: readWireDrafts,
    report: () => undefined,
    apply: async () => failure('unused', 'not submitted in this test'),
    preview: async (_draft, changes) => {
      sent.push(changes);
      return failure('constraint-conflict', 'Candidate route violates a port');
    },
  });
  editor.restore(selection.base.workspace);
  editor.edit(selection, { kind: 'relationship-kind', value: 'calls' });
  const draft = editor.getSnapshot().drafts[0];
  assert(draft);
  const verdict = await editor.preview(draft, new AbortController().signal);
  expect(sent).toEqual([wireChanges(draft)]);
  expect(verdict.ok).toBe(false);
  expect(editor.getSnapshot().drafts).toEqual([draft]);
});
