import { selection, query, expansionRequest } from './records/preset.js';
import type { Catalog, Preset } from './records/preset.js';
import type { Dependencies, Templates, PresetPlan, Expansion, Summary } from './types.js';
import type { Result } from './errors.js';
import { protect, clone, parse, success } from '../core/validation/outcomes.js';
import { validateCatalog } from '../core/validation/catalog.js';
import { admit, plan } from '../core/admission/plan.js';
import { select, list } from '../core/discovery/select.js';
import { instantiate } from '../core/expansion/instantiate.js';
/** Every operation begins from an independently checked immutable authoritative catalog snapshot. */
function withCatalog<T, U>(
  input: unknown,
  deps: Pick<Dependencies<T>, 'identity'>,
  operation: (records: Catalog) => Result<U>,
): Result<U> {
  return protect(() => {
    const records = validateCatalog(input, deps.identity);
    if (!records.ok) return records;
    return operation(records.value);
  });
}
/** Validate a proposed immutable version including candidate dependency closure, without saving it. */
function validate<T>(records: Catalog, input: unknown, deps: Dependencies<T>): Result<Preset> {
  const result = admit(records, input, deps);
  if (!result.ok) return result;
  const planned = plan(records, result.value, deps);
  if (!planned.ok) return planned;
  return result;
}
/** Admission is complete before planning; no partial record is exposed on semantic or dependency failure. */
function planInput<T>(records: Catalog, input: unknown, deps: Dependencies<T>): Result<PresetPlan> {
  const result = admit(records, input, deps);
  if (!result.ok) return result;
  return plan(records, result.value, deps);
}
/** Selection shape is strict, including digest requiring an exact release. */
function readInput(records: Catalog, input: unknown): Result<Preset> {
  const request = parse(selection, clone(input));
  if (!request.ok) return request;
  return select(records, request.value);
}
/** Query defaults are applied once at the public schema boundary. */
function listInput(records: Catalog, input: unknown): Result<readonly Summary[]> {
  const request = parse(query, clone(input));
  if (!request.ok) return request;
  return success(list(records, request.value));
}
/** Namespace grammar is checked before syntax-owner remapping; no coordinates are supplied here. */
function expandInput<T>(
  records: Catalog,
  input: unknown,
  deps: Dependencies<T>,
): Result<Expansion<T>> {
  const request = parse(expansionRequest, clone(input));
  if (!request.ok) return request;
  return instantiate(records, request.value, deps.recipe);
}
/** Bind mandatory semantic owners and hashing. Stateless plans are replayable; Authoring owns commits/recovery. */
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
