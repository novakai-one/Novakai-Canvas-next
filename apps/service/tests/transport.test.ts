import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomInt } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { openWorkspace } from '@novakai/canvas-service';
import { startHttpServer } from '../adapters/http-server.js';
import { createHttpIo } from '../adapters/http-io.js';
import { it, expect, assert, vi } from 'vitest';
import { createHttpAdmission, readCommand, httpBodyLimit } from '../contract/index.js';
import type {
  HttpMetadata,
  HttpSecurity,
  HttpAdmission,
  Caller,
  BodyStream,
} from '../contract/index.js';
import { readAuthoringRequest } from '../adapters/request-reader.js';
import { createHttpRouter } from '../adapters/http-router.js';

/** Test-only credential values are explicit; production supplies random secrets and timing-safe equality. */
const security: HttpSecurity = {
  host: '127.0.0.1:5174',
  origin: 'http://127.0.0.1:5174',
  agentToken: 'test-agent',
  browserSession: 'test-browser',
  generation: 'first-generation',
  equal: (left, right) => left === right,
};
const metadata: HttpMetadata = {
  method: 'POST',
  host: security.host,
  origin: '',
  site: '',
  mode: '',
  destination: '',
  authorization: 'Bearer test-agent',
  cookie: '',
  contentType: 'application/json',
};
/** An admissible envelope still has to pass Authoring; this case isolates transport rejection before those handlers. */
const request = {
  workspace: 'local',
  request: 'edit-one',
  actor: { id: 'agent:cli', kind: 'agent' },
  version: 1,
  expected: [],
  scope: [],
  assets: [],
  intent: { kind: 'change', planner: 'dsl', payload: { source: 'canvas 1', mode: 'create' } },
};
const body = JSON.stringify({ version: 1, generation: security.generation, request });

/** One frozen contract case covers ingress classes. It does not claim to simulate browser networking or socket attacks. */
function authentication(admission: HttpAdmission): Caller {
  const agent = admission.authenticate(metadata);
  assert(agent.ok);
  expect(agent.value).toEqual({ id: 'agent:cli', kind: 'agent' });
  for (const changed of [
    { host: 'attacker.example:5174' },
    { authorization: 'Bearer wrong' },
    { origin: 'https://attacker.example' },
    { site: 'cross-site' },
  ])
    expect(admission.authenticate({ ...metadata, ...changed }).ok).toBe(false);
  const navigation = {
    ...metadata,
    method: 'GET',
    authorization: '',
    site: 'none',
    mode: 'navigate',
    destination: 'document',
  };
  expect(admission.bootstrap(navigation).ok).toBe(true);
  expect(admission.bootstrap({ ...navigation, site: 'cross-site' }).ok).toBe(false);
  expect(admission.bootstrap({ ...navigation, mode: 'cors' }).ok).toBe(false);
  const browser = {
    ...metadata,
    authorization: '',
    origin: security.origin,
    site: 'same-origin',
    cookie: 'novakai_canvas_session=test-browser',
  };
  expect(admission.authenticate(browser)).toEqual({
    ok: true,
    value: { id: 'human:browser', kind: 'human' },
  });
  expect(
    admission.authenticate({ ...browser, cookie: `${browser.cookie}; ${browser.cookie}` }).ok,
  ).toBe(false);
  expect(
    admission.authenticate({ ...browser, cookie: 'novakai_canvas_session=old-session' }).ok,
  ).toBe(false);
  return agent.value;
}
/** Decode rejection uses byte limits and owner schemas, independent of network timing. */
function payloads(admission: HttpAdmission, caller: Caller): void {
  const context = { caller, metadata, generation: security.generation, ingress: admission };
  expect(readCommand(body, context).ok).toBe(true);
  for (const malformed of [
    '{',
    'null',
    JSON.stringify({ version: 2 }),
    'x'.repeat(httpBodyLimit + 1),
  ])
    expect(readCommand(malformed, context).ok).toBe(false);
  expect(
    readCommand(body, { ...context, metadata: { ...metadata, contentType: 'text/plain' } }).ok,
  ).toBe(false);
  expect(readCommand(body, { ...context, generation: 'second-generation' })).toMatchObject({
    ok: false,
    error: { code: 'conflict', path: 'generation' },
  });
}
/** One frozen case exercises both admission and actual router rejection; no mutation owner is allowed to run. */
it('host 4 rejects malformed identity, origin, generation and bounded payloads before mutation handlers', async () => {
  const admission = createHttpAdmission(security, { read: readAuthoringRequest });
  const caller = authentication(admission);
  payloads(admission, caller);
  const rejected = vi.fn(async () => {
    throw new Error('This owner is not part of a mutation route');
  });
  const router = createHttpRouter({
    generation: security.generation,
    admission,
    decoder: { read: readCommand },
    session: {
      workspace: 'local',
      get resources(): never {
        throw new Error('Resource owner is outside this mutation case');
      },
      get installation(): never {
        throw new Error('Installation read is outside the mutation contract');
      },
      apply: rejected,
      prepare: rejected,
      read: rejected,
      receipt: rejected,
      render: rejected,
    },
    source: { describe: rejected, print: () => ({ ok: true, value: null }) },
  });
  for (const changed of [
    { actor: { id: 'human:browser', kind: 'human' } },
    { intent: { ...request.intent, planner: 'model' } },
    { intent: { ...request.intent, planner: 'bootstrap' } },
  ]) {
    const outcome = await router.invoke({
      path: '/api/v1/authoring/apply',
      query: {},
      caller,
      signal: new AbortController().signal,
      metadata,
      body: JSON.stringify({
        version: 1,
        generation: security.generation,
        request: { ...request, ...changed },
      }),
    });
    expect(outcome).toMatchObject({ ok: false, error: { code: 'unauthorized' } });
  }
  expect(rejected).not.toHaveBeenCalled();
});

it('PR3 authenticated resource upload consumes chunks within the 24 MiB encoded ceiling', async () => {
  const fixture = await resourceWorkspace();
  const port = randomInt(45000, 55000);
  const host = `127.0.0.1:${port}`;
  const secured = { ...security, host, origin: `http://${host}` };
  const admission = createHttpAdmission(secured, { read: readAuthoringRequest });
  const router = createHttpRouter({
    session: fixture.session,
    generation: security.generation,
    admission,
    decoder: { read: readCommand },
    source: { describe: () => ({}), print: () => ({ ok: true, value: null }) },
  });
  const server = await startHttpServer(
    { port, credentialFile: '', webRoot: '' },
    {
      security: secured,
      admission,
      router,
      changes: fixture.session,
      io: createHttpIo(),
      files: {
        read: async () => ({
          ok: false,
          error: { code: 'not-found', path: '', message: '', recovery: '' },
        }),
      },
    },
  );
  assert(server.ok);
  try {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAYAAAC56t6BAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWMwTpv5H4QZMBgAqdcNJ8E3/6kAAAAASUVORK5CYII=',
      'base64',
    );
    const stage = (bytes: Buffer) =>
      JSON.stringify({
        base64: bytes.toString('base64'),
        mediaType: 'image/png',
        alt: 'Wetland',
        provenance: { source: 'wetland.png' },
      });
    const before = await fixture.session.read();
    const denied = await upload(port, stage(png), 'wrong');
    expect(denied.status).toBe(401);
    const success = await upload(port, stage(png), 'test-agent');
    expect(success.status).toBe(200);
    expect(success.body).toMatchObject({
      outcome: { ok: true, value: { descriptor: { kind: 'image', mediaType: 'image/png' } } },
    });
    const full = Buffer.alloc(16 * 1024 * 1024);
    png.copy(full);
    const large = await upload(port, stage(full), 'test-agent');
    expect.soft(large.status, JSON.stringify(large.body)).toBe(200);
    expect(await fixture.session.read()).toEqual(before); // staging never binds canonically
    const validOverflow = JSON.stringify({
      base64: 'A'.repeat(httpBodyLimit + 65536),
      mediaType: 'image/png',
      alt: 'Oversized but valid JSON',
      provenance: { source: 'oversized.png' },
    });
    const counted = countedBody(validOverflow, 65536);
    expect(await createHttpIo().body(counted.stream)).toMatchObject({ ok: false });
    expect(counted.consumed()).toBe(Math.floor(httpBodyLimit / 65536) + 1);
    expect(counted.consumed()).toBeLessThan(Math.ceil(validOverflow.length / 65536));
    const overflow = await upload(port, validOverflow, 'test-agent');
    expect(overflow.status).toBe(422);
    const wrongMime = await upload(
      port,
      JSON.stringify({
        base64: png.toString('base64'),
        mediaType: 'font/woff2',
        alt: '',
        provenance: { source: 'wrong.woff2' },
      }),
      'test-agent',
    );
    expect(wrongMime.body).toMatchObject({ outcome: { ok: false } });
  } finally {
    await server.value.close();
    await fixture.close();
  }
}, 30000);

/** Native chunk writes exercise streaming accumulation rather than calling the decoder with a prebuilt string. */
function upload(
  port: number,
  body: string,
  token: string,
): Promise<{ readonly status: number; readonly body: unknown }> {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/v1/resources/stage',
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () =>
          resolve({
            status: response.statusCode ?? 0,
            body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
          }),
        );
      },
    );
    request.on('error', reject);
    for (let offset = 0; offset < body.length; offset += 65536)
      request.write(body.slice(offset, offset + 65536));
    request.end();
  });
}

/** A deterministic iterator proves the reader stops on the first chunk crossing its fixed ceiling. */
function countedBody(
  input: string,
  size: number,
): {
  readonly stream: BodyStream;
  consumed(): number;
} {
  let consumed = 0;
  return {
    stream: { iterator: () => bodyChunks(input, size, () => consumed++) },
    consumed: () => consumed,
  };
}

/** Chunks describe one valid JSON document; yielding stops when the consumer returns or rejects. */
async function* bodyChunks(
  input: string,
  size: number,
  consumed: () => void,
): AsyncIterableIterator<Buffer> {
  for (let offset = 0; offset < input.length; offset += size) {
    consumed();
    yield Buffer.from(input.slice(offset, offset + size));
  }
}

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
