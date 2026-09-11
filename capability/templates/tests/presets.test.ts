import { it, expect } from 'vitest';
import { chainedThemes } from './fixtures.js';
import { createTemplates, digest, presetId } from '../contract/index.js';
import type { Preset, ThemePayload } from '../contract/index.js';
import {
  service,
  input,
  themeInput,
  value,
  rejects,
  dependencies,
  theme,
  failed,
  font,
} from './fixtures.js';

it('pins canonical content with independently expected SHA256 and detached immutable plans', () => {
  const templates = service();
  const submitted = input();
  const result = value(templates.planAdmission([], submitted));
  expect(result.pin.digest).toBe(
    '7ded66daaa94db5699077cbdc91639c129df7e687e3ba4d846f7f61a0ea2a2ae',
  );
  expect(result.changed).toBe(true);
  expect(result.candidate).toHaveLength(1);
  expect(Object.isFrozen(result.candidate[0])).toBe(true);
  expect(Object.isFrozen(submitted)).toBe(false);
  expect(value(templates.planAdmission([], input('1.0.0', '  fixture:hello  '))).pin).toEqual(
    result.pin,
  );
});
it('replays identical versions, refuses overwrite and retains old versions on upgrade', () => {
  const templates = service();
  const first = value(templates.planAdmission([], input()));
  expect(value(templates.planAdmission(first.candidate, input())).changed).toBe(false);
  rejects(templates.planAdmission(first.candidate, input('1.0.0', 'different')), 'version-exists');
  const second = value(templates.planAdmission(first.candidate, input('2.0.0', 'new')));
  expect(second.candidate).toHaveLength(2);
  expect(value(templates.read(second.candidate, first.pin))).toEqual(first.candidate[0]);
});
it('rejects duplicate altered missing and cyclic pin dependencies', () => {
  const templates = service();
  const first = value(templates.planAdmission([], input()));
  const record = first.candidate[0];
  expect(record).toBeDefined();
  rejects(templates.list([...first.candidate, ...first.candidate], {}), 'duplicate-preset');
  rejects(
    templates.list(
      first.candidate.map((item) => ({ ...item, title: 'Tampered' })),
      {},
    ),
    'digest-mismatch',
  );
  const missing = {
    kind: 'theme',
    id: presetId.parse('absent'),
    version: first.pin.version,
    digest: first.pin.digest,
  } as const;
  const missingService = createTemplates(
    dependencies({ theme: { resolve: () => ({ ok: true, value: { ...theme, base: missing } }) } }),
  );
  rejects(missingService.planAdmission([], themeInput()), 'missing-preset');
  const constant = digest.parse('c'.repeat(64));
  const cyclic = createTemplates(
    dependencies({ identity: { hash: () => ({ ok: true, value: constant }) } }),
  );
  const a: Preset = {
    schemaVersion: 1,
    kind: 'theme',
    id: presetId.parse('a'),
    version: first.pin.version,
    title: 'A',
    description: '',
    digest: constant,
    payload: {
      ...theme,
      base: {
        kind: 'theme',
        id: presetId.parse('b'),
        version: first.pin.version,
        digest: constant,
      },
    },
  };
  const b: Preset = {
    ...a,
    id: presetId.parse('b'),
    payload: { ...theme, base: { kind: 'theme', id: a.id, version: a.version, digest: constant } },
  };
  rejects(cyclic.list([a, b], {}), 'dependency-cycle');
  expect(value(templates.list(chainedThemes(1000, dependencies().identity), {}))).toHaveLength(
    1000,
  );
});
it('selects numeric latest releases and deterministic readable search summaries', () => {
  const templates = service();
  const first = value(templates.planAdmission([], input('2.9.0')));
  const second = value(templates.planAdmission(first.candidate, input('2.10.0')));
  expect(value(templates.read(second.candidate, { kind: 'recipe', id: 'demo' })).version).toBe(
    '2.10.0',
  );
  expect(
    value(templates.list(second.candidate, { search: 'ER' })).map((entry) => entry.pin.version),
  ).toEqual(['2.9.0', '2.10.0']);
  expect(value(templates.list(second.candidate, { kind: 'theme' }))).toEqual([]);
  rejects(
    templates.read(second.candidate, {
      kind: 'recipe',
      id: 'demo',
      version: '2.9.0',
      digest: 'd'.repeat(64),
    }),
    'digest-mismatch',
  );
  rejects(
    templates.read(second.candidate, { kind: 'recipe', id: 'demo', digest: 'd'.repeat(64) }),
    'invalid-input',
  );
});
it('pins resolved theme fonts and rejects malformed delta outputs and version shapes', () => {
  const templates = service();
  const first = value(templates.planAdmission([], themeInput()));
  expect(first.candidate[0]).toMatchObject({
    kind: 'theme',
    payload: { fonts: [font], tokens: { 'font.body': { digest: font } } },
  });
  const bad: ThemePayload = { ...theme, fonts: [] };
  const invalid = createTemplates(
    dependencies({ theme: { resolve: () => ({ ok: true, value: bad }) } }),
  );
  rejects(invalid.planAdmission([], themeInput()), 'invalid-input');
  rejects(templates.planAdmission([], { ...themeInput(), version: '01.0.0' }), 'invalid-input');
  rejects(templates.planAdmission([], { ...themeInput(), surprise: true }), 'invalid-input');
  const unsafe = createTemplates(
    dependencies({
      theme: {
        resolve: () => ({
          ok: true,
          value: { ...theme, tokens: { bad: { type: 'color', value: 'url(secret)' } } },
        }),
      },
    }),
  );
  rejects(unsafe.planAdmission([], themeInput()), 'invalid-input');
});
it('settles codec and hashing faults and rejects oversized or non-JSON input', () => {
  const templates = createTemplates(
    dependencies({
      recipe: {
        ...dependencies().recipe,
        inspect: () => {
          throw new Error('Parser unavailable');
        },
      },
    }),
  );
  rejects(templates.planAdmission([], input()), 'provider-failed');
  const hashFailure = createTemplates(dependencies({ identity: { hash: failed } }));
  rejects(hashFailure.planAdmission([], input()), 'provider-failed');
  rejects(
    service().planAdmission([], { ...input(), source: 'a'.repeat(1024 * 1024 + 1) }),
    'invalid-input',
  );
  rejects(service().planAdmission([], { ...input(), schemaVersion: 2 }), 'invalid-input');
  rejects(service().planAdmission([], { ...input(), extra: () => 0 }), 'invalid-input');
});
