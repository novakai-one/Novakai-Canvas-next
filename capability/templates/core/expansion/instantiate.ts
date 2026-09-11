import type {
  Catalog,
  ExpansionRequest,
  Preset,
  RecipePayload,
} from '../../contract/records/preset.js';
import type { RecipePort } from '../../contract/ports/codecs.js';
import type { Expansion } from '../../contract/types.js';
import type { Result } from '../../contract/errors.js';
import { fail } from '../../contract/errors.js';
import { success, canonical, clone } from '../validation/outcomes.js';
import { exact, pinOf, reachableThemes } from '../validation/catalog.js';
/** Exact pin and syntax owner are both checked before expansion; Authoring owns merge validity and commit recovery. */
export function instantiate<T>(
  records: Catalog,
  request: ExpansionRequest,
  recipe: RecipePort<T>,
): Result<Expansion<T>> {
  const selected = exact(records, request.pin);
  if (!selected.ok) return selected;
  return expandRecipe(records, selected.value, request, recipe);
}
/** A theme cannot be instantiated as a diagram; source must still match its canonical semantic manifest. */
function expandRecipe<T>(
  records: Catalog,
  value: Preset,
  request: ExpansionRequest,
  recipe: RecipePort<T>,
): Result<Expansion<T>> {
  if (value.kind !== 'recipe')
    return fail('invalid-input', 'pin.kind', 'Select a recipe to instantiate');
  const inspected = recipe.inspect(value.payload.source, value.payload.family);
  if (!inspected.ok) return inspected;
  return expandChecked(records, value.payload, inspected.value, request, recipe);
}
/** Re-inspection prevents imported structural records from bypassing the syntax owner's semantic admission. */
function expandChecked<T>(
  records: Catalog,
  payload: RecipePayload,
  inspected: RecipePayload,
  request: ExpansionRequest,
  recipe: RecipePort<T>,
): Result<Expansion<T>> {
  if (canonical(payload) !== canonical(inspected))
    return fail(
      'digest-mismatch',
      'payload',
      'Recipe inspection differs from admitted canonical payload',
    );
  const expanded = recipe.expand(payload.source, request.namespace);
  if (!expanded.ok) return expanded;
  return success(assemble(records, payload, request, clone(expanded.value)));
}
/** Closure includes inherited-theme fonts; deduplication is deterministic and never depends on object identity. */
function assemble<T>(
  records: Catalog,
  payload: RecipePayload,
  request: ExpansionRequest,
  intent: T,
): Expansion<T> {
  const themes = reachableThemes(records, payload.themes);
  const fonts = themes.flatMap((value) => (value.kind === 'theme' ? value.payload.fonts : []));
  return {
    pin: request.pin,
    namespace: request.namespace,
    intent,
    assets: [...new Set([...payload.assets, ...fonts])].sort(),
    themes: themes.map(pinOf),
  };
}
