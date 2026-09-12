import { it, expect, assert, vi } from 'vitest';
import { createHttpAdmission, readCommand, httpBodyLimit } from '../contract/index.js';
import type { HttpMetadata, HttpSecurity, HttpAdmission, Caller } from '../contract/index.js';
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
