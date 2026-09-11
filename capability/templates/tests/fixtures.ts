import type { Catalog, Preset, IdentityPort } from '../contract/index.js';
import { expect } from 'vitest';
import { composeTemplates, digest, presetId, version } from '../contract/index.js';
import type {
  Result,
  Dependencies,
  RecipePort,
  ThemePayload,
  Pin,
  Admission,
  Templates,
} from '../contract/index.js';
import { createIdentity } from '../adapters/identity.js';
export interface Intent {
  readonly nodes: readonly { readonly id: string; readonly label: string }[];
}
export const font = digest.parse('a'.repeat(64));
export const media = digest.parse('b'.repeat(64));
export const theme: ThemePayload = {
  tokens: {
    'font.body': { type: 'font', family: 'Inter', digest: font },
    'color.text': { type: 'color', value: '#111111' },
  },
  roles: ['neutral', 'primary'],
  fonts: [font],
  base: null,
};
/** Pure test codec; not a production DSL parser. Fixtures isolate Templates' exact-pin/remapping orchestration. */
export function recipe(
  themes: readonly Pin[] = [],
  assets: readonly (typeof font)[] = [],
): RecipePort<Intent> {
  return {
    inspect: (source, family) => ({
      ok: true,
      value: { languageVersion: 1, source: source.trim(), family, themes, assets },
    }),
    expand: (source, namespace) => ({
      ok: true,
      value: { nodes: [{ id: `${namespace}_start`, label: source }] },
    }),
  };
}
/** Required semantic providers are explicit; no fake production defaults are introduced. */
export function dependencies(overrides: Partial<Dependencies<Intent>> = {}): Dependencies<Intent> {
  return {
    recipe: recipe(),
    theme: { resolve: () => ({ ok: true, value: theme }) },
    identity: createIdentity(),
    ...overrides,
  };
}
/** Native-hash composition is the same public constructor used by the eventual service and CLI hosts. */
export function service(): Templates<Intent> {
  const defaults = dependencies();
  return composeTemplates({ recipe: defaults.recipe, theme: defaults.theme });
}
/** Independently authored source submission has no storage metadata, coordinates or executable content. */
export function input(release = '1.0.0', source = 'fixture:hello'): Admission {
  return {
    schemaVersion: 1,
    id: presetId.parse('demo'),
    version: version.parse(release),
    title: 'Demo',
    description: 'A recipe',
    kind: 'recipe',
    source,
    family: 'er',
  };
}
/** Theme delta content is opaque to Templates; this test resolver returns the explicitly injected resolved fixture. */
export function themeInput(id = 'paper', release = '1.0.0'): Admission {
  return {
    schemaVersion: 1,
    id: presetId.parse(id),
    version: version.parse(release),
    title: 'Paper',
    description: 'Pinned theme',
    kind: 'theme',
    raw: {},
  };
}
/** Vitest owns assertion exceptions; failed results never unwrap as fabricated fixture successes. */
export function value<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}
/** Assert documented error vocabulary; localized prose is intentionally not part of these assertions. */
export function rejects(result: Result<unknown>, code: string): void {
  expect(result).toMatchObject({ ok: false, error: { code } });
}
/** Typed provider fault for deterministic failure-boundary scenarios. */
export function failed<T>(): Result<T> {
  return {
    ok: false,
    error: {
      code: 'provider-failed',
      path: 'fixture',
      message: 'Unavailable',
      recovery: 'Repair fixture',
    },
  };
}

/** Independently serialize the known fixture shape in canonical key order; this is not the production canonicalizer. */
function appendTheme(records: Catalog, identity: Pick<IdentityPort, 'hash'>): Catalog {
  const previous = records.at(-1);
  const base = fixtureBase(previous);
  const content = {
    description: '',
    id: presetId.parse(`theme${records.length}`),
    kind: 'theme',
    payload: { base, fonts: [], roles: ['neutral'], tokens: {} },
    schemaVersion: 1,
    title: `Theme ${records.length}`,
    version: version.parse('1.0.0'),
  } as const;
  const result: Preset = { ...content, digest: value(identity.hash(JSON.stringify(content))) };
  return [...records, result];
}
/** Explicit null root and ordered pin fields keep this independent hash fixture reproducible. */
function fixtureBase(previous: Preset | undefined): Pin | null {
  if (!previous) return null;
  return {
    digest: previous.digest,
    id: previous.id,
    kind: previous.kind,
    version: previous.version,
  };
}
/** Maximum supported ancestry fixture exercises the observed slow path without a fragile wall-clock assertion. */
export function chainedThemes(size: number, identity: Pick<IdentityPort, 'hash'>): Catalog {
  return Array.from({ length: size }).reduce<Catalog>(
    (records) => appendTheme(records, identity),
    [],
  );
}
