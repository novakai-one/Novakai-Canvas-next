import { it, expect, assert, vi } from 'vitest';
import { validate, plan, stage } from '@novakai/canvas-model';
import { validate as validateLibrary } from '@novakai/canvas-library';
import { createLanguage, type ValidationError as LanguageError } from '@novakai/canvas-language';
import { requestSchema, snapshotSchema, proposalSchema } from '@novakai/canvas-authoring';
import { responseEnvelope, projectCollection } from '../contract/index.js';
import { createDiagramPlanners } from '../adapters/diagram-planners.js';
import { createSourceReadout } from '../adapters/language-readout.js';

/** A forbidden downstream call fails this test instead of manufacturing a successful proposal. */
function unexpected(): never {
  throw new Error('Rejected input must not reach this collaborator');
}
const theme = {
  id: 'paper',
  version: '1.0.0',
  digest: `sha256:${'a'.repeat(64)}`,
  roles: ['neutral'],
};

it('preserves two different Model codes and paths through planning and JSON transport', async () => {
  const checked = validate({
    schemaVersion: 1,
    id: 'probe',
    revision: 0,
    title: 'Probe',
    theme,
    arrangement: { algorithm: 'grid' },
  });
  assert(checked.ok);
  const original = checked.value;
  const changes = [
    {
      op: 'replace-document',
      value: {
        ...original,
        objects: [
          { id: 'a', kind: 'note', label: 'A' },
          { id: 'a', kind: 'note', label: 'Again' },
        ],
        sections: [
          {
            id: 'flow',
            title: 'Flow',
            mode: 'flow',
            layout: { algorithm: 'flow' },
            appearances: [{ object: 'missing' }],
          },
        ],
      },
    },
  ];
  const expected = plan(original, changes);
  assert(!expected.ok);
  expect(expected.error.diagnostics.map(({ code, path }) => ({ code, path }))).toEqual([
    { code: 'duplicate', path: 'objects.a' },
    { code: 'reference', path: 'sections.flow.appearances.missing' },
  ]);
  const library = validateLibrary({
    catalog: {
      schemaVersion: 1,
      id: 'catalog',
      revision: 0,
      folders: [],
      entries: [{ collection: 'probe', order: 0 }],
    },
    collections: [projectCollection(original)],
    recent: [],
  });
  assert(library.ok);
  const propose = vi.fn(unexpected);
  const planners = createDiagramPlanners({
    language: createLanguage({ reader: { validate }, planner: { plan }, stage: { stage } }),
    workspace: {
      project: projectCollection,
      read: () => ({
        ok: true,
        value: { collections: [original], library: library.value, presets: [] },
      }),
    },
    resources: { select: unexpected, forCollection: unexpected },
    collections: { propose },
  });
  const planner = planners.find((item) => item.id === 'model');
  assert(planner);
  const request = requestSchema.parse({
    version: 1,
    workspace: 'probe',
    request: 'edit',
    actor: { id: 'human', kind: 'human' },
    expected: [],
    scope: [],
    assets: [],
    intent: { kind: 'change', planner: 'model', payload: { collection: 'probe', changes } },
  });
  const result = await planner.plan(
    request,
    snapshotSchema.parse({ workspace: 'probe', sequence: 0, records: [] }),
    {},
  );
  assert(!result.ok);
  expect(result.error.code).toBe('invariant-violation');
  expect(result.error.source).toEqual(expected.error);
  expect(result).not.toHaveProperty('diagnostics');
  expect(result).not.toHaveProperty('value');
  expect(propose).not.toHaveBeenCalled();
  const wire = responseEnvelope.parse(
    JSON.parse(JSON.stringify({ version: 1, generation: 'probe', outcome: result })),
  );
  expect(wire.outcome).toEqual(result);
  const admitted = proposalSchema.parse({
    writes: [],
    reads: [],
    diff: {},
    warnings: [result.error],
  });
  expect(admitted.warnings[0]).toEqual(result.error);
});

it('preserves all compiler evidence through readout and rejects empty diagnostic failures', () => {
  const first = {
    code: 'domain' as const,
    span: { start: { offset: 10, line: 2, column: 1 }, end: { offset: 20, line: 2, column: 11 } },
    target: 'objects.a',
    expected: 'unique identity',
    message: 'Duplicate object',
    recovery: 'Choose another ID',
    source: { code: 'duplicate', path: 'objects.a', message: 'Identity must be unique' },
  };
  const second = {
    ...first,
    code: 'unknown-target' as const,
    target: 'missing',
    expected: 'declared object',
    span: { start: { offset: 30, line: 3, column: 2 }, end: { offset: 38, line: 3, column: 10 } },
    message: 'Missing endpoint',
    recovery: 'Declare the endpoint',
  };
  const source: LanguageError = { code: 'validation-failed', diagnostics: [first, second] };
  const readout = createSourceReadout({
    describe: unexpected,
    print: () => ({ ok: false, error: source }),
  });
  const result = readout.print({});
  assert(!result.ok);
  expect(result.error.source).toEqual(source);
  const wire = responseEnvelope.parse(
    JSON.parse(JSON.stringify({ version: 1, generation: 'probe', outcome: result })),
  );
  expect(wire.outcome).toEqual(result);
  const empty = {
    ...result,
    error: { ...result.error, source: { code: 'validation-failed', diagnostics: [] } },
  };
  expect(
    responseEnvelope.safeParse({ version: 1, generation: 'probe', outcome: empty }).success,
  ).toBe(false);
  expect(
    proposalSchema.safeParse({
      writes: [],
      reads: [],
      diff: {},
      warnings: [
        {
          code: 'invalid-input',
          path: 'source',
          targets: [],
          message: 'Invalid',
          recovery: 'Correct source',
          traceId: null,
          source: empty.error.source,
        },
      ],
    }).success,
  ).toBe(false);
});
