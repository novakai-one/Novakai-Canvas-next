import { randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { cp, symlink } from 'node:fs/promises';
import { openAssets, digest as assetDigest } from '../../../capability/assets/contract/index.js';
import { serveWorkspace } from '@novakai/canvas-service';
import { openWorkspace } from '@novakai/canvas-service';
import { inspectionReport } from '@novakai/canvas-service';
import { it, expect, assert } from 'vitest';
import { mkdtemp, writeFile, rm, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createLanguage } from '@novakai/canvas-language';
import { validate, plan, stage } from '@novakai/canvas-model';
import { snapshotSchema, requestSchema, receiptSchema } from '@novakai/canvas-authoring';
import type { Request } from '@novakai/canvas-authoring';
import { readArguments } from '../adapters/arguments.js';
import { createPresetInputs } from '../adapters/preset-inputs.js';
import { readThemeConfig } from '../adapters/theme-config.js';
import { createResourceFiles } from '../adapters/resource-inputs.js';
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
    expect(readArguments(['read', 'one', '--section', 'modules'], root)).toMatchObject({
      ok: true,
      value: { command: { scope: { kind: 'section', id: 'modules' } } },
    });
    expect(readArguments(['read', 'one', '--object', 'shell'], root)).toMatchObject({
      ok: true,
      value: { command: { scope: { kind: 'object', id: 'shell' } } },
    });
    expect(
      readArguments(['read', 'one', '--section', 'modules', '--object', 'shell'], root),
    ).toMatchObject({ ok: false });
    expect(readArguments(['read', 'one', '--section', ''], root)).toMatchObject({ ok: false });
    expect(readArguments(['create', file, '--section', 'modules'], root)).toMatchObject({
      ok: false,
    });
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
    expect(
      semantic.readout({
        source: 'canvas 1',
        collection: 'demo',
        revision: 2,
        manual: [{ target: '@flow/@build', kind: 'placement', locked: false }],
      }),
    ).toMatchObject({ ok: true, value: expect.stringContaining('# manual geometry: 1 target(s)') });
    expect(semantic.readout({ source: 'canvas 1', collection: 'demo', revision: 0 })).toMatchObject(
      { ok: true, value: expect.not.stringContaining('manual geometry') },
    );
    expect(
      semantic.readout({
        source: 'view 1 @demo revision=2 scope=section:modules {}',
        collection: 'demo',
        revision: 2,
        scope: { kind: 'section', id: 'modules' },
      }),
    ).toMatchObject({ ok: true, value: expect.stringContaining('Read-only partial context') });
    const files = createRequestFiles(join(root, 'requests'));
    const sent: Request[] = [];
    let knownReceipt: unknown = null;
    let getCount = 0;
    const deps: CliDependencies = {
      files,
      resourceFiles: createResourceFiles(),
      semantic,
      presets: createPresetInputs(semantic, readThemeConfig),
      nextRequestId: () => 'generated-request',
      transport: {
        get: async (path) => {
          getCount++;
          return envelope(path.startsWith('/api/v1/receipt') ? knownReceipt : snapshot);
        },
        post: async (_path, input) => {
          if (_path === '/api/v1/resources/freeze') return envelope(input);
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

it('PR3 CLI retains exact pins and normalized bytes across alias advance, source deletion, GC and reopen', async () => {
  const fixture = await resourceWorkspace();
  const root = await mkdtemp(join(tmpdir(), 'canvas-cli-resources-'));
  const port = randomInt(45000, 55000);
  const serverOptions = {
    port,
    webRoot: root,
    credentialFile: join(root, 'agent-credential.json'),
  };
  let service = fixture.session;
  let server = await serveWorkspace(service, serverOptions);
  assert(server.ok);
  const base = fileURLToPath(
    new URL('../../../resources/examples/agent-diagrams/pr3/', import.meta.url),
  );
  const cli = (args: readonly string[]) =>
    runCli([...args, '--server', `http://127.0.0.1:${port}`, '--workspace', root], root);
  try {
    await cp(base, root, { recursive: true });
    const originalTheme = await readFile(join(root, 'harbor.theme'), 'utf8');
    expect(readThemeConfig(`${originalTheme}\nset color surface.base="#ffffff"`)).toMatchObject({
      ok: false,
      error: { code: 'duplicate-token', message: expect.stringContaining('surface.base') },
    });
    const readableTheme = `${originalTheme}\nset number ratio.caption=1\nset number lineHeight.body=1.25`;
    expect(readThemeConfig(readableTheme)).toMatchObject({
      ok: true,
      value: { admission: { raw: { overrides: { 'ratio.caption': 1, 'lineHeight.body': 1.25 } } } },
    });
    expect(readThemeConfig(`${readableTheme}\nset number ratio.caption=2`)).toMatchObject({
      ok: false,
      error: { code: 'duplicate-token' },
    });
    expect(
      readThemeConfig(`${originalTheme}\nset number ratio.caption=${'9'.repeat(400)}`),
    ).toMatchObject({
      ok: false,
      error: { code: 'invalid-theme' },
    });
    await writeFile(join(root, 'harbor.theme'), readableTheme);
    const admitted = await cli([
      'theme',
      'admit',
      join(root, 'harbor.theme'),
      '--request',
      'cli-harbor',
    ]);
    assert(admitted.ok, JSON.stringify(admitted));
    await writeFile(
      join(root, 'invalid-number.theme'),
      originalTheme.replace('@harbor', '@invalid-number') + '\nset number action.accent=1',
    );
    const wrongTokenType = await cli([
      'theme',
      'admit',
      join(root, 'invalid-number.theme'),
      '--request',
      'invalid-number-theme',
    ]);
    expect(wrongTokenType).toMatchObject({ ok: false, error: { code: 'invalid-input' } });
    const preview = await cli([
      'preview',
      join(root, 'wetland.canvas'),
      '--request',
      'retained-wetland',
    ]);
    assert(preview.ok, JSON.stringify(preview));
    const files = createRequestFiles(join(root, 'requests'));
    const retained = await files.read('retained-wetland');
    assert(retained.ok);
    expect(retained.value.backups).toHaveLength(1);
    const original = retained.value.request;
    await writeFile(
      join(root, 'harbor.theme'),
      (await readFile(join(root, 'harbor.theme'), 'utf8')).replace(
        'version=1.0.0',
        'version=2.0.0',
      ),
    );
    const advanced = await cli([
      'theme',
      'admit',
      join(root, 'harbor.theme'),
      '--request',
      'cli-harbor-two',
    ]);
    assert(advanced.ok, JSON.stringify(advanced));
    const snapshot = await service.read();
    assert(snapshot.ok);
    await server.value.close();
    await service.close();
    const assets = openAssets(join(fixture.directory, 'assets'));
    assert(assets.ok);
    const collected = assets.value.collectUnreferenced(() => ({
      ok: true,
      value: snapshot.value.records
        .flatMap((item) => item.resources)
        .map((item) => assetDigest.parse(item)),
    }));
    assert(collected.ok);
    expect(collected.value.removed).toContain(retained.value.backups?.[0]?.digest);
    assets.value.close();
    await rm(join(root, 'wetland.canvas'));
    await rm(join(root, 'wetland.png'));
    service = await fixture.reopen();
    server = await serveWorkspace(service, serverOptions);
    assert(server.ok);
    const applied = await cli(['apply', 'retained-wetland']);
    assert(applied.ok, JSON.stringify(applied));
    expect(await files.read('retained-wetland')).toMatchObject({
      ok: true,
      value: { request: original },
    });
    const readout = await cli(['read', 'wetland']);
    assert(readout.ok);
    expect(readout.value).toContain('harbor@1.0.0#sha256:');
    const renderedTheme = await service.render('wetland', new AbortController().signal);
    assert(renderedTheme.ok, JSON.stringify(renderedTheme));
    expect(renderedTheme.value.style.typography.annotation.size).toBe(16);
    expect(renderedTheme.value.style.typography.annotation.lineHeight).toBe(20);
    expect(renderedTheme.value.style.typography.body.lineHeight).toBe(20);

    const recipePath = fileURLToPath(
      new URL('../../../resources/recipes/infographic.canvas', import.meta.url),
    );
    const recipe = await cli([
      'recipe',
      'admit',
      recipePath,
      '--id',
      'cli-guide',
      '--version',
      '1.0.0',
      '--family',
      'infographic',
      '--title',
      'CLI guide',
      '--request',
      'cli-recipe',
    ]);
    assert(recipe.ok, JSON.stringify(recipe));
    const latest = await service.read();
    assert(latest.ok);
    const preset = latest.value.records.find(
      (item) =>
        item.key.kind === 'preset' &&
        typeof item.value === 'object' &&
        item.value !== null &&
        'id' in item.value &&
        item.value.id === 'cli-guide',
    );
    assert(
      preset &&
        typeof preset.value === 'object' &&
        preset.value !== null &&
        'digest' in preset.value,
    );
    const out = join(root, 'fresh.canvas');
    const expanded = await cli([
      'recipe',
      'instantiate',
      `cli-guide@1.0.0#sha256:${preset.value.digest}`,
      '--namespace',
      'fresh-cli',
      '--out',
      out,
    ]);
    assert(expanded.ok, JSON.stringify(expanded));
    expect(await readFile(out, 'utf8')).toContain('fresh-cli');
    const created = await cli(['create', out, '--request', 'fresh-cli-create']);
    assert(created.ok, JSON.stringify(created));
    const inspected = await cli(['inspect', 'fresh-cli']);
    assert(inspected.ok, JSON.stringify(inspected));
    const report = inspectionReport.parse(JSON.parse(inspected.value));
    expect(report).toMatchObject({ valid: true, diagnostics: [] });
    expect(report.sections).toBeGreaterThan(0);
    expect(report.engineVersions.join(' ')).toContain('layout-policy');
    expect(await cli(['inspect', 'missing-collection'])).toMatchObject({
      ok: false,
      error: { code: 'not-found' },
    });
    const pinned = await createResourceFiles().read(join(root, 'missing.canvas'), {
      kind: 'image',
      alias: 'known',
      source: `sha256:${'a'.repeat(64)}`,
      span: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 2, offset: 1 } },
    });
    expect(pinned).toMatchObject({ ok: true, value: { digest: 'a'.repeat(64) } });
    await mkdir(join(root, '..media'));
    await cp(join(base, 'wetland.png'), join(root, '..media', 'icon.png'));
    const dotted = await createResourceFiles().read(join(root, 'input.canvas'), {
      kind: 'image',
      alias: 'dotted',
      source: './..media/icon.png',
      span: { start: { line: 2, column: 1, offset: 0 }, end: { line: 2, column: 2, offset: 1 } },
    });
    expect(dotted).toMatchObject({ ok: true, value: { alias: 'dotted' } });
    const completeBytes = Buffer.alloc(8 * 1024 * 1024, 37);
    await writeFile(join(root, 'complete.png'), completeBytes);
    const complete = await createResourceFiles().read(join(root, 'input.canvas'), {
      kind: 'image',
      alias: 'complete',
      source: './complete.png',
      span: { start: { line: 3, column: 1, offset: 0 }, end: { line: 3, column: 2, offset: 1 } },
    });
    assert(complete.ok);
    const completeStage = complete.value.stage;
    assert(
      typeof completeStage === 'object' && completeStage !== null && 'base64' in completeStage,
    );
    assert(typeof completeStage.base64 === 'string');
    expect(Buffer.from(completeStage.base64, 'base64')).toEqual(completeBytes);
    await writeFile(join(root, 'oversized.png'), Buffer.alloc(16 * 1024 * 1024 + 1));
    const oversized = await createResourceFiles().read(join(root, 'input.canvas'), {
      kind: 'image',
      alias: 'oversized',
      source: './oversized.png',
      span: { start: { line: 4, column: 1, offset: 0 }, end: { line: 4, column: 2, offset: 1 } },
    });
    expect(oversized).toMatchObject({ ok: false, error: { code: 'resource-too-large' } });
    await symlink(join(base, 'wetland.png'), join(root, 'escape.png'));
    await expectInvalidResources(root, base);
  } finally {
    await closeResourceServer(server);
    await fixture.close();
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

/** Each resource contract owns a private native workspace, closed and removed after the case. */
async function resourceWorkspace() {
  const directory = await mkdtemp(join(tmpdir(), 'pr3-resource-workspace-'));
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const options = {
    directory,
    workspace: 'pr3',
    title: 'PR3',
    createdAt: 1,
    resourceRoot: join(root, 'resources'),
    tokenRoot: join(root, 'capability/design-system'),
  };
  const opened = await openWorkspace(options);
  assert(opened.ok, JSON.stringify(opened));
  let active = opened.value;
  return {
    directory,
    session: active,
    reopen: async () => {
      await active.close();
      const next = await openWorkspace(options);
      assert(next.ok, JSON.stringify(next));
      active = next.value;
      return active;
    },
    close: async () => {
      await active.close();
      await rm(directory, { recursive: true, force: true });
    },
  };
}

/** Distinct filesystem/media failures retain one code while sharing precise source context. */
async function expectInvalidResources(root: string, base: string): Promise<void> {
  const invalidSources: readonly { readonly source: string; readonly code: string }[] = [
    { source: join(base, 'wetland.png'), code: 'absolute-path' },
    { source: './escape.png', code: 'path-escape' },
    { source: './missing.png', code: 'source-unavailable' },
    { source: './harbor.theme', code: 'unsupported-media' },
    { source: './inter-latin-400-normal.woff2', code: 'resource-mismatch' },
  ];
  for (const { source, code } of invalidSources) {
    const result = await createResourceFiles().read(join(root, 'input.canvas'), {
      kind: 'image',
      alias: 'bad',
      source,
      span: {
        start: { line: 4, column: 18, offset: 0 },
        end: { line: 4, column: 19, offset: 1 },
      },
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code, message: expect.stringContaining('4:18 asset @bad') },
    });
  }
}

/** A failed restart has no live transport to close; native workspace cleanup remains independent. */
async function closeResourceServer(
  server: Awaited<ReturnType<typeof serveWorkspace>>,
): Promise<void> {
  if (server.ok) await server.value.close();
}
