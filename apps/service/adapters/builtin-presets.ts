import { validate } from '@novakai/canvas-model';
import type { Catalog, Preset, RecipePayload } from '@novakai/canvas-templates';
import type { ResolvedResources } from '@novakai/canvas-language';
import type {
  BuiltinSources,
  BuiltinResources,
  BuiltinPresetOwners,
} from '../contract/records/builtins.js';
import { failure, type Result } from '../contract/errors.js';
/** Boot admission stops at an owner rejection; service retains the original workspace. */
class PresetFault extends Error {}
type OwnerFailure =
  | { readonly ok: false; readonly error: { readonly path: string; readonly message: string } }
  | { readonly ok: false; readonly diagnostics: readonly { readonly message: string }[] };
/** Preserve actionable owner diagnostics while adapting two explicit public failure shapes. */
function ownerMessage(result: OwnerFailure): string {
  if ('error' in result) return `${result.error.path}: ${result.error.message}`;
  return result.diagnostics.map((item) => item.message).join('; ');
}
/** Immutable owner output is required before selecting the next built-in admission. */
function accepted<T>(result: { readonly ok: true; readonly value: T } | OwnerFailure): T {
  if (!result.ok) throw new PresetFault(ownerMessage(result));
  return result.value;
}
/** Admission uses the actual font families verified by Assets; missing shipped fonts cannot fall back to the OS. */
function fontPins(sources: BuiltinSources): unknown {
  const [body, mono] = sources.fonts;
  if (!body || !mono) throw new PresetFault('Both shipped fonts are required');
  return {
    body: { family: body.family, digest: body.digest, approved: true },
    mono: { family: mono.family, digest: mono.digest, approved: true },
  };
}
/** System theme selection yields exact release pins; personal preferences do not become diagram dependencies. */
function themeInput(
  sources: BuiltinSources,
  scheme: 'light' | 'dark',
  owners: BuiltinPresetOwners,
): unknown {
  const ui = accepted(
    owners.context.system.resolve({
      scope: 'ui',
      sources: sources.tokens,
      preferences: {
        schemaVersion: 1,
        theme: { mode: 'system' },
        textSize: 14,
        density: 'comfortable',
        motion: 'system',
      },
      environment: { scheme, pointer: 'fine', reducedMotion: false, forcedColors: false },
    }),
  );
  return { base: { kind: 'ui', pin: ui.provenance.ui }, fonts: fontPins(sources), overrides: {} };
}
/** Shipped theme headers are stable identities; Templates computes the complete immutable content hash. */
function addTheme(
  catalog: Catalog,
  scheme: 'light' | 'dark',
  sources: BuiltinSources,
  owners: BuiltinPresetOwners,
): Catalog {
  const id = scheme === 'light' ? 'paper' : 'ink';
  const templates = owners.templates(owners.context);
  return accepted(
    templates.planAdmission(catalog, {
      schemaVersion: 1,
      kind: 'theme',
      id,
      version: '1.0.0',
      title: id === 'paper' ? 'Paper' : 'Ink',
      description: 'Bundled diagram theme with pinned fonts.',
      raw: themeInput(sources, scheme, owners),
    }),
  ).candidate;
}
/** Model mints the diagram theme binding from the checked preset; the host owns alias selection only. */
function themeBinding(preset: Preset): ResolvedResources['themes'][string] {
  if (preset.kind !== 'theme') throw new PresetFault('Recipe is not a theme');
  return accepted(
    validate({
      schemaVersion: 1,
      id: 'resource-binding',
      revision: 0,
      title: 'Resource binding',
      theme: {
        id: preset.id,
        version: preset.version,
        digest: `sha256:${preset.digest}`,
        roles: preset.payload.roles,
      },
      arrangement: { algorithm: 'grid' },
    }),
  ).theme;
}
/** Recipe inspection uses the exact just-admitted themes and no invented asset defaults. */
function addRecipe(
  catalog: Catalog,
  recipe: { readonly family: RecipePayload['family']; readonly source: string },
  owners: BuiltinPresetOwners,
): Catalog {
  const resources = {
    themes: Object.fromEntries(
      catalog.filter((item) => item.kind === 'theme').map((item) => [item.id, themeBinding(item)]),
    ),
    assets: {},
  };
  const templates = owners.templates({ ...owners.context, resources });
  return accepted(
    templates.planAdmission(catalog, {
      schemaVersion: 1,
      kind: 'recipe',
      id: recipe.family,
      version: '1.0.0',
      title: recipe.family,
      description: 'Editable diagram starter.',
      source: recipe.source,
      family: recipe.family,
    }),
  ).candidate;
}
/** Prepare the complete installation preset set without writing it; startup Authoring admission owns commit/recovery. */
export function prepareBuiltinPresets(
  sources: BuiltinSources,
  owners: BuiltinPresetOwners,
): Result<BuiltinResources> {
  try {
    const themes = (['light', 'dark'] as const).reduce<Catalog>(
      (catalog, scheme) => addTheme(catalog, scheme, sources, owners),
      [],
    );
    const presets = sources.recipes.reduce(
      (catalog, recipe) => addRecipe(catalog, recipe, owners),
      themes,
    );
    return { ok: true, value: { ...sources, presets } };
  } catch (error) {
    return preparationFailure(error);
  }
}

/** Known owner rejection explains correction; unexpected provider faults do not leak native exception details. */
function preparationFailure(error: unknown): Result<never> {
  if (error instanceof PresetFault) return failure('invalid-input', 'builtins', error.message);
  return failure('unavailable', 'builtins', 'Built-in preparation provider failed');
}
