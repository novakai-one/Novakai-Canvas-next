import { catalog, themePayload, recipePayload } from '../../contract/records/preset.js';
import type {
  Catalog,
  Pin,
  Preset,
  ThemePayload,
  RecipePayload,
} from '../../contract/records/preset.js';
import { digest } from '../../contract/brands.js';
import type { Digest } from '../../contract/brands.js';
import type { IdentityPort } from '../../contract/ports/identity.js';
import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import { canonical, clone, parse, success, firstFailure } from './outcomes.js';
/** Immutable identity key is separate from payload hash; no ambiguous concatenation grammar. */
export function key(value: Pick<Pin, 'kind' | 'id' | 'version'>): string {
  return `${value.kind}/${value.id}/${value.version}`;
}
/** Exact public pin projection never exposes the implementation's payload shape. */
export function pinOf(value: Preset): Pin {
  return { kind: value.kind, id: value.id, version: value.version, digest: value.digest };
}
/** Recompute the hash from every semantic header and payload field, excluding only the hash itself. */
function verifyHash(value: Preset, identity: IdentityPort): Result<void> {
  const { digest: expected, ...content } = value;
  const result = identity.hash(canonical(content));
  if (!result.ok) return result;
  if (result.value !== expected)
    return fail('digest-mismatch', key(value), 'Preset content differs from pin');
  return success(undefined);
}
/** Validate provider hash shape before constructing immutable records, even for JavaScript callers. */
export function hashContent(value: unknown, identity: IdentityPort): Result<Digest> {
  const result = identity.hash(canonical(value));
  if (!result.ok) return result;
  return parse(digest, result.value);
}
/** One exact reference either resolves or reports absence/digest mismatch; never falls back to latest. */
export function exact(records: Catalog, pin: Pin): Result<Preset> {
  const found = records.find((item) => key(item) === key(pin));
  if (!found) return fail('missing-preset', key(pin), 'Pinned preset is absent');
  if (found.digest !== pin.digest)
    return fail('digest-mismatch', key(pin), 'Pinned digest differs');
  return success(found);
}
/** Base is provenance with retained closure; recipe dependencies are exact theme pins. */
export function dependencies(value: Preset): readonly Pin[] {
  if (value.kind === 'recipe') return value.payload.themes;
  return baseDependency(value.payload);
}
/** A resolved theme has at most one base pin; null is intentional absence, not unresolved inheritance. */
function baseDependency(value: ThemePayload): readonly Pin[] {
  if (value.base === null) return [];
  return [value.base];
}
interface AncestryProgress {
  readonly pending: Catalog;
  readonly resolved: ReadonlySet<string>;
}
/** Each successful round removes at least one record; at most catalog.length rounds prove acyclicity without recursion. */
function validateAncestry(records: Catalog): Result<void> {
  const initial: Result<AncestryProgress> = success({
    pending: records,
    resolved: new Set<string>(),
  });
  const result = records.reduce<Result<AncestryProgress>>(advanceAncestry, initial);
  if (!result.ok) return result;
  return success(undefined);
}
/** Completed or failed traversal is stable; no global visited cache or caller-owned record is mutated. */
function advanceAncestry(progress: Result<AncestryProgress>): Result<AncestryProgress> {
  if (!progress.ok) return progress;
  if (progress.value.pending.length === 0) return progress;
  return resolveAncestryRound(progress.value);
}
/** Remove nodes whose dependencies are already resolved; no removable node means the remaining graph is cyclic. */
function resolveAncestryRound(progress: AncestryProgress): Result<AncestryProgress> {
  const ready = progress.pending.filter((value) =>
    dependencies(value).every((pin) => progress.resolved.has(key(pin))),
  );
  if (ready.length === 0)
    return fail('dependency-cycle', progress.pending[0]?.id ?? '$', 'Preset ancestry is cyclic');
  const resolved = new Set([...progress.resolved, ...ready.map(key)]);
  return success({
    pending: progress.pending.filter((value) => !resolved.has(key(value))),
    resolved,
  });
}
/** Index once before edge checks; repeated linear record lookup must not amplify long supported chains. */
function validateReferences(records: Catalog): Result<void> {
  const index: ReadonlyMap<string, Preset> = new Map(records.map((value) => [key(value), value]));
  return firstFailure(records.flatMap(dependencies).map((pin) => indexedReference(index, pin)));
}
/** A pinned edge must match both immutable identity and digest before ancestry resolution runs. */
function indexedReference(index: ReadonlyMap<string, Preset>, pin: Pin): Result<Preset> {
  const found = index.get(key(pin));
  if (!found) return fail('missing-preset', key(pin), 'Pinned preset is absent');
  if (found.digest !== pin.digest)
    return fail('digest-mismatch', key(pin), 'Pinned digest differs');
  return success(found);
}
/** Duplicate immutable identities cannot be hidden by a later array entry. */
function uniqueRecords(records: Catalog): Result<void> {
  const keys = records.map(key);
  if (new Set(keys).size !== keys.length)
    return fail('duplicate-preset', '$', 'Duplicate preset identity');
  return success(undefined);
}
/** Admission-derived payload fields remain checked when records return from storage/import. */
export function checkPayload(value: Preset): Result<void> {
  if (value.kind === 'theme') return checkTheme(value.payload);
  return checkRecipe(value.payload);
}
/** Font correspondence is structural pin policy, not token contrast/layout semantics. */
export function checkTheme(input: unknown): Result<void> {
  const parsed = parse(themePayload, input);
  if (!parsed.ok) return parsed;
  return themeCorrespondence(parsed.value);
}
/** Sorted exact manifests prohibit unpinned font aliases and stale independently-maintained font arrays. */
function themeCorrespondence(value: ThemePayload): Result<void> {
  const fonts = Object.values(value.tokens).flatMap((token) =>
    token.type === 'font' ? [token.digest] : [],
  );
  const expected = [...new Set(fonts)].sort();
  if (canonical(expected) !== canonical(value.fonts))
    return fail('invalid-input', 'fonts', 'Font manifest must equal sorted unique token digests');
  if (new Set(value.roles).size !== value.roles.length)
    return fail('invalid-input', 'roles', 'Duplicate role name');
  return success(undefined);
}
/** Source length is UTF8 bytes, not JavaScript code units; duplicate references do not enter a manifest. */
function checkRecipe(input: unknown): Result<void> {
  const parsed = parse(recipePayload, input);
  if (!parsed.ok) return parsed;
  return recipeCorrespondence(parsed.value);
}
/** Canonical recipe manifests retain first-class exact pin identities and bounded source bytes. */
function recipeCorrespondence(value: RecipePayload): Result<void> {
  if (new TextEncoder().encode(value.source).byteLength > 1024 * 1024)
    return fail('invalid-input', 'source', 'Recipe source exceeds1MiB');
  return uniqueManifest(value);
}
/** Direct assets/themes are sets with deterministic sorted order established by the syntax codec. */
function uniqueManifest(value: RecipePayload): Result<void> {
  if (new Set(value.assets).size !== value.assets.length)
    return fail('invalid-input', 'assets', 'Duplicate asset dependency');
  if (new Set(value.themes.map(key)).size !== value.themes.length)
    return fail('invalid-input', 'themes', 'Duplicate theme dependency');
  return success(undefined);
}
/** Full supplied catalog is validated before use. Authoring owns semantic re-admission and commit recovery. */
export function validateCatalog(input: unknown, identity: IdentityPort): Result<Catalog> {
  const parsed = parse(catalog, clone(input));
  if (!parsed.ok) return parsed;
  return validateRecords(parsed.value, identity);
}
/** Validation returns the complete original parsed catalog only after every independent invariant passes. */
function validateRecords(records: Catalog, identity: IdentityPort): Result<Catalog> {
  const checks = [
    uniqueRecords(records),
    ...records.map((value) => verifyHash(value, identity)),
    ...records.map(checkPayload),
    validateReferences(records),
    validateAncestry(records),
  ];
  const checked = firstFailure(checks);
  if (!checked.ok) return checked;
  return success(records);
}
/** Closure used for expansion includes each exact theme only once, after catalog cycle validation. */
export function reachableThemes(records: Catalog, pins: readonly Pin[]): readonly Preset[] {
  const values = pins.flatMap((pin) => {
    const result = exact(records, pin);
    if (!result.ok) return [];
    return [result.value, ...reachableThemes(records, dependencies(result.value))];
  });
  return [...new Map(values.map((value) => [key(value), value])).values()].sort((a, b) =>
    key(a).localeCompare(key(b), 'en'),
  );
}
