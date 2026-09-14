import { admission, preset, recipePayload, themePayload } from '../../contract/records/preset.js';
import type { Admission, Catalog, Preset, ThemePreset } from '../../contract/records/preset.js';
import type { PresetPlan } from '../../contract/types.js';
import type { RecipePort, ThemePort } from '../../contract/ports/codecs.js';
import type { IdentityPort } from '../../contract/ports/identity.js';
/** Admission needs inspection only; expansion is a different operation and is not required by this flow. */
interface AdmissionDependencies {
  readonly recipe: Pick<RecipePort<unknown>, 'inspect'>;
  readonly theme: ThemePort;
  readonly identity: IdentityPort;
}
import type { Result } from '../../contract/errors.js';
import { fail } from '../../contract/errors.js';
import { parse, clone, success } from '../validation/outcomes.js';
import { hashContent, validateCatalog, checkPayload, key, pinOf } from '../validation/catalog.js';
/** Resolve source or token delta through the owning semantic codec before computing an immutable pin. */
export function admit(
  records: Catalog,
  input: unknown,
  deps: AdmissionDependencies,
): Result<Preset> {
  const parsed = parse(admission, clone(input));
  if (!parsed.ok) return parsed;
  return resolveAdmission(records, parsed.value, deps);
}
/** Recipe and theme are the two owned payload families, each bound to a required semantic owner. */
function resolveAdmission(
  records: Catalog,
  input: Admission,
  deps: AdmissionDependencies,
): Result<Preset> {
  if (input.kind === 'recipe') return admitRecipe(input, deps);
  return admitTheme(records, input, deps);
}
/** Canonical source/manifest comes from inspection, never a caller-authored dependency list. */
function admitRecipe(
  input: Extract<Admission, { kind: 'recipe' }>,
  deps: Pick<AdmissionDependencies, 'recipe' | 'identity'>,
): Result<Preset> {
  const result = deps.recipe.inspect(input.source, input.family);
  if (!result.ok) return result;
  const checked = parse(recipePayload, clone(result.value));
  if (!checked.ok) return checked;
  return finish({ ...header(input), payload: checked.value }, deps);
}
/** Theme input may be a delta; returned payload must already contain exact resolved values and font pins. */
function admitTheme(
  records: Catalog,
  input: Extract<Admission, { kind: 'theme' }>,
  deps: Pick<AdmissionDependencies, 'theme' | 'identity'>,
): Result<Preset> {
  const themes = records.filter((value): value is ThemePreset => value.kind === 'theme');
  const result = deps.theme.resolve(input.raw, themes);
  if (!result.ok) return result;
  const checked = parse(themePayload, clone(result.value));
  if (!checked.ok) return checked;
  return finish({ ...header(input), payload: checked.value }, deps);
}
/** Independently validate codec output correspondence and hash the complete normalized record. */
function finish(
  content: Omit<Preset, 'digest'>,
  deps: Pick<AdmissionDependencies, 'identity'>,
): Result<Preset> {
  const hashed = hashContent(content, deps.identity);
  if (!hashed.ok) return hashed;
  return finishRecord(content, hashed.value);
}
/** Build the envelope from a checked plain record; schema parsing owns the final discriminated type. */
function finishRecord(content: Omit<Preset, 'digest'>, digest: string): Result<Preset> {
  const parsed = parse(preset, { ...content, digest });
  if (!parsed.ok) return parsed;
  const checked = checkPayload(parsed.value);
  if (!checked.ok) return checked;
  return success(parsed.value);
}
/** Same identity may be replayed only with the same normalized content; Authoring commits the returned plan. */
export function plan(
  records: Catalog,
  value: Preset,
  deps: Pick<AdmissionDependencies, 'identity'>,
): Result<PresetPlan> {
  const previous = records.find((item) => key(item) === key(value));
  if (previous) return existing(records, previous, value);
  const candidate = validateCatalog([...records, value], deps.identity);
  if (!candidate.ok) return candidate;
  return success({ candidate: candidate.value, pin: pinOf(value), changed: true });
}
/** Existing pinned versions never acquire new content through title/source/theme edits. */
function existing(records: Catalog, previous: Preset, value: Preset): Result<PresetPlan> {
  if (previous.digest !== value.digest)
    return fail(
      'version-exists',
      key(value),
      'Create a new version instead of overwriting this one',
    );
  return success({ candidate: records, pin: pinOf(previous), changed: false });
}

/** Shared immutable header excludes submitted source/delta fields before content hashing. */
function header(
  input: Admission,
): Pick<Preset, 'schemaVersion' | 'id' | 'version' | 'title' | 'description' | 'kind'> {
  return {
    schemaVersion: input.schemaVersion,
    id: input.id,
    version: input.version,
    title: input.title,
    description: input.description,
    kind: input.kind,
  };
}
