import { it, expect, assert } from 'vitest';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createLanguage } from '@novakai/canvas-language';
import { validate, plan, stage } from '@novakai/canvas-model';
import { snapshotSchema, requestSchema, receiptSchema } from '@novakai/canvas-authoring';
import type { Request } from '@novakai/canvas-authoring';
import { readArguments } from '../adapters/arguments.js';
import { createRequestFiles } from '../adapters/files.js';
import { createSemanticInputs } from '../adapters/semantic-inputs.js';
import { executeCommand, runCli } from '../contract/index.js';
import type { CliDependencies, Result } from '../contract/index.js';
import type { TransportResponse } from '@novakai/canvas-service';
/** The CLI case uses real source/retention files and Language; only transport timing/results are controlled. */
it('host 8 maps readable arguments and files to exact requests, rejects invalid input and verifies receipt identity', async () => {
  const root = await mkdtemp(join(tmpdir(), 'canvas-cli-contract-'));
  const file = join(root, 'diagram.canvas');
  const source =
    'canvas 1 collection @cli "CLI" theme=paper { node @step step "Read the specification" {} section @flow "Process" { show @step } }';
  try {
    await writeFile(file, source);
    const help = await runCli(['--help'], join(root, 'no-workspace'));
    expect(help).toMatchObject({ ok: true, value: expect.stringContaining('canvas create FILE') });
    expect(readArguments(['create', file, '--unknown'], root)).toMatchObject({ ok: false });
    expect(readArguments(['read', 'one', 'ignored'], root)).toMatchObject({ ok: false });
    for (const revision of ['', ' ', '-1', '1.5', '9007199254740992']) {
      expect(readArguments(['patch', file, '--revision', revision], root)).toMatchObject({
        ok: false,
      });
    }
    const args = readArguments(
      ['create', file, '--mode', 'replace', '--request', 'cli-create'],
      root,
    );
    assert(args.ok);
    expect(args.value.command.mode).toBe('create');
    const snapshot = snapshotSchema.parse({
      workspace: 'cli-workspace',
      sequence: 1,
      records: [
        {
          key: { kind: 'catalog', id: 'catalog' },
          version: 0,
          deleted: false,
          resources: [],
          value: { schemaVersion: 1, id: 'catalog', revision: 0, folders: [], entries: [] },
        },
      ],
    });
    const semantic = createSemanticInputs(
      createLanguage({ reader: { validate }, planner: { plan }, stage: { stage } }),
    );
    const files = createRequestFiles(join(root, 'requests'));
    const sent: Request[] = [];
    let knownReceipt: unknown = null;
    let getCount = 0;
    const deps: CliDependencies = {
      files,
      semantic,
      nextRequestId: () => 'generated-request',
      transport: {
        get: async (path) => {
          getCount++;
          return envelope(path.startsWith('/api/v1/receipt') ? knownReceipt : snapshot);
        },
        post: async (_path, input) => {
          assert(typeof input === 'object' && input !== null && 'request' in input);
          const request = requestSchema.parse(input.request);
          const retained = await files.read(request.request);
          assert(retained.ok); // journal exists before transmission
          expect(retained.value.request).toEqual(request);
          sent.push(request);
          return {
            ok: false,
            error: {
              code: 'connection-uncertain',
              message: 'Lost response',
              recovery: 'Reconcile receipt',
            },
          };
        },
      },
    };
    const uncertain = await executeCommand(args.value.command, deps);
    expect(uncertain).toMatchObject({
      ok: false,
      error: { recovery: expect.stringContaining('canvas receipt cli-create') },
    });
    const submitted = sent[0];
    assert(submitted);
    expect(submitted.intent).toMatchObject({
      kind: 'change',
      planner: 'dsl',
      payload: { source, mode: 'create' },
    });
    expect(submitted.expected).toEqual([
      { key: { kind: 'collection', id: 'cli' }, version: 'absent' },
      { key: { kind: 'catalog', id: 'catalog' }, version: 0 },
    ]);
    const receipt = receiptSchema.parse({
      request: 'cli-create',
      fingerprint: 'a'.repeat(64),
      sequence: 2,
      versions: [{ key: { kind: 'collection', id: 'cli' }, version: 0 }],
      outcome: { status: 'committed', transaction: 'cli-create', pins: {}, diff: {}, warnings: [] },
    });
    const retry = readArguments(['retry', 'cli-create'], root);
    assert(retry.ok);
    knownReceipt = { ...receipt, request: 'unrelated' };
    expect(await executeCommand(retry.value.command, deps)).toMatchObject({
      ok: false,
      error: { code: 'invalid-response' },
    });
    expect(sent).toHaveLength(1);
    knownReceipt = receipt;
    expect(await executeCommand(retry.value.command, deps)).toMatchObject({
      ok: true,
      value: expect.stringContaining('committed: cli-create'),
    });
    expect(sent).toHaveLength(1);
    expect(semantic.receipt(null, { kind: 'committed', request: 'cli-create' })).toMatchObject({
      ok: false,
    });
    const missing = await executeCommand(
      { ...args.value.command, target: join(root, 'missing.canvas') },
      deps,
    );
    expect(missing).toMatchObject({ ok: false, error: { code: 'source-unavailable' } });
    const readsBefore = getCount;
    await writeFile(file, Uint8Array.from([0xc3, 0x28]));
    expect(await executeCommand(args.value.command, deps)).toMatchObject({
      ok: false,
      error: { code: 'source-unavailable' },
    });
    expect(getCount).toBe(readsBefore);
    expect(
      await files.save({
        generation: 'new',
        request: requestSchema.parse({
          ...submitted,
          actor: { kind: 'agent', id: 'another-agent' },
        }),
      }),
    ).toMatchObject({ ok: false, error: { code: 'request-reused' } });
    await files.output(join(root, 'readout.canvas'), source);
    expect(await readFile(join(root, 'readout.canvas'), 'utf8')).toBe(source);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
/** Versioned service envelopes retain an unknown owner payload until the CLI's semantic reader accepts it. */
function envelope(value: unknown): Result<TransportResponse> {
  return {
    ok: true,
    value: { version: 1, generation: 'generation-one', outcome: { ok: true, value } },
  };
}
