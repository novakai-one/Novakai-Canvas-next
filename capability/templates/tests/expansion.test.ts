import { it, expect } from 'vitest';
import { createTemplates } from '../contract/index.js';
import {
  dependencies,
  recipe,
  input,
  themeInput,
  value,
  rejects,
  theme,
  font,
  media,
} from './fixtures.js';

it('expands deterministic independent instances with complete theme font reachability', () => {
  const base = createTemplates(dependencies());
  const paper = value(base.planAdmission([], themeInput()));
  const templates = createTemplates(dependencies({ recipe: recipe([paper.pin], [media]) }));
  const catalog = value(templates.planAdmission(paper.candidate, input()));
  const first = value(
    templates.instantiate(catalog.candidate, { pin: catalog.pin, namespace: 'first' }),
  );
  const second = value(
    templates.instantiate(catalog.candidate, { pin: catalog.pin, namespace: 'second' }),
  );
  expect(first.intent.nodes.map((node) => node.id)).toEqual(['first_start']);
  expect(second.intent.nodes.map((node) => node.id)).toEqual(['second_start']);
  expect(
    value(templates.instantiate(catalog.candidate, { pin: catalog.pin, namespace: 'first' })),
  ).toEqual(first);
  expect(first.assets).toEqual([font, media]);
  expect(first.themes).toEqual([paper.pin]);
  expect(Object.isFrozen(first.intent.nodes)).toBe(true);
  expect(first.intent).not.toBe(second.intent);
  const altered = createTemplates(
    dependencies({
      theme: {
        resolve: () => ({
          ok: true,
          value: { ...theme, roles: ['neutral', 'primary', 'warning'] },
        }),
      },
    }),
  );
  const upgraded = value(altered.planAdmission(catalog.candidate, themeInput('paper', '2.0.0')));
  expect(
    value(templates.instantiate(upgraded.candidate, { pin: catalog.pin, namespace: 'first' })),
  ).toEqual(first);
});
it('rejects wrong kind, changed pin, invalid namespace and unsafe expansion output', () => {
  const templates = createTemplates(dependencies());
  const paper = value(templates.planAdmission([], themeInput()));
  rejects(
    templates.instantiate(paper.candidate, { pin: paper.pin, namespace: 'one' }),
    'invalid-input',
  );
  const catalog = value(templates.planAdmission(paper.candidate, input()));
  rejects(
    templates.instantiate(catalog.candidate, {
      pin: { ...catalog.pin, digest: 'f'.repeat(64) },
      namespace: 'one',
    }),
    'digest-mismatch',
  );
  rejects(
    templates.instantiate(catalog.candidate, { pin: catalog.pin, namespace: 'bad namespace' }),
    'invalid-input',
  );
  const unsafe = createTemplates({
    ...dependencies(),
    recipe: { inspect: recipe().inspect, expand: () => ({ ok: true, value: () => 0 }) },
  });
  rejects(
    unsafe.instantiate(catalog.candidate, { pin: catalog.pin, namespace: 'one' }),
    'invalid-input',
  );
  const drift = createTemplates(dependencies({ recipe: recipe([], [media]) }));
  rejects(
    drift.instantiate(catalog.candidate, { pin: catalog.pin, namespace: 'one' }),
    'digest-mismatch',
  );
});
