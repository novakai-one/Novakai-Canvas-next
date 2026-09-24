import { selection, query, expansionRequest } from './records/preset.js';
import type { Catalog, Preset } from './records/preset.js';
import type { Dependencies, Templates, PresetPlan, Expansion, Summary } from './types.js';
import type { Result } from './errors.js';
import { protect, clone, parse, success } from '../core/validation/outcomes.js';
import { validateCatalog } from '../core/validation/catalog.js';
import { admit, plan } from '../core/admission/plan.js';
import { select, list } from '../core/discovery/select.js';
import { instantiate } from '../core/expansion/instantiate.js';

/**
 * Creates the Templates facade over the given providers. It keeps no state and saves nothing;
 * Authoring owns commits and recovery.
 *
 * Every method:
 * 1. Checks the whole `catalog` input first (schemas, digests, pins, duplicates, cycles).
 * 2. Parses its own input from a copy, so later changes by the caller have no effect.
 * 3. Runs inside `protect`: the result is a frozen copy, and any throw becomes a failure
 *    (`InputFault` keeps its code and path; anything else becomes `provider-failed` at `$`).
 *
 * @param deps - The recipe codec, theme codec and hashing provider.
 * @returns A frozen {@link Templates} object.
 * @throws Never.
 */
export function createTemplates<T>(deps: Dependencies<T>): Templates<T> {
  return Object.freeze({
    /** Read a complete immutable catalog once; callers retain the prior snapshot on malformed hashes/dependencies. */
    readCatalog: (input) => withCatalog(input, deps, (records) => success(records)),
    validatePreset: (catalog, input) =>
      withCatalog(catalog, deps, (records) => validate(records, input, deps)),
    planAdmission: (catalog, input) =>
      withCatalog(catalog, deps, (records) => planInput(records, input, deps)),
    read: (catalog, input) => withCatalog(catalog, deps, (records) => readInput(records, input)),
    list: (catalog, input) => withCatalog(catalog, deps, (records) => listInput(records, input)),
    instantiate: (catalog, input) =>
      withCatalog(catalog, deps, (records) => expandInput(records, input, deps)),
  } satisfies Templates<T>);
}

/** Checks the catalog, then runs `operation` on it, all inside `protect`. */
function withCatalog<T, U>(
  input: unknown,
  deps: Pick<Dependencies<T>, 'identity'>,
  operation: (records: Catalog) => Result<U>,
): Result<U> {
  return protect(() => {
    const records = validateCatalog(input, deps.identity);
    if (!records.ok) {
      return records;
    }
    return operation(records.value);
  });
}

/** Admits the input and plans it (so pins and cycles are checked too), then returns the admitted preset. Saves nothing. */
function validate<T>(records: Catalog, input: unknown, deps: Dependencies<T>): Result<Preset> {
  const result = admit(records, input, deps);
  if (!result.ok) {
    return result;
  }
  const planned = plan(records, result.value, deps);
  if (!planned.ok) {
    return planned;
  }
  return result;
}

/** Admits the input in full, then plans it; a failed admission exposes no partial record. */
function planInput<T>(records: Catalog, input: unknown, deps: Dependencies<T>): Result<PresetPlan> {
  const result = admit(records, input, deps);
  if (!result.ok) {
    return result;
  }
  return plan(records, result.value, deps);
}

/** Parses a strict selection (a digest needs an exact version), then selects the preset. */
function readInput(records: Catalog, input: unknown): Result<Preset> {
  const request = parse(selection, clone(input));
  if (!request.ok) {
    return request;
  }
  return select(records, request.value);
}

/** Parses the query (applying its defaults once), then lists matching summaries. */
function listInput(records: Catalog, input: unknown): Result<readonly Summary[]> {
  const request = parse(query, clone(input));
  if (!request.ok) {
    return request;
  }
  return success(list(records, request.value));
}

/** Parses the request (checking the namespace format) before the recipe codec remaps anything. */
function expandInput<T>(
  records: Catalog,
  input: unknown,
  deps: Dependencies<T>,
): Result<Expansion<T>> {
  const request = parse(expansionRequest, clone(input));
  if (!request.ok) {
    return request;
  }
  return instantiate(records, request.value, deps.recipe);
}
