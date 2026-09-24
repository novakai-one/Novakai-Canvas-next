/**
 * Model's callable boundary: validate diagram data, plan a valid immutable transition, or stage
 * one unchecked. These three return deeply frozen typed outcomes and perform no I/O. Authoring
 * owns admission, revision increments, commit and crash recovery.
 *
 * The definition and callable helpers below read an already validated collection; they do not
 * validate or freeze.
 */

/**
 * Validates unknown collection data.
 *
 * In order:
 * 1. inspects the input as plain JSON without running accessors: no getters, hidden or symbol
 *    fields, cycles, sparse arrays, non-finite numbers or non-plain prototypes (`shape`), and at
 *    most 100,000 values and 64 levels (`limit`). The first problem found is returned. A throw
 *    while inspecting (for example a revoked proxy) is `shape` at `$`, "Input cannot be
 *    inspected as plain data";
 * 2. parses it with the strict collection schema, which builds a detached copy (`shape`
 *    diagnostics, one per schema issue, at the issue's path joined by `.`);
 * 3. runs every domain rule on the copy and collects all their diagnostics, in rule order:
 *    identity, content, composition, references, keys, relationships, sections, layouts,
 *    definitions.
 *
 * A throw during steps 2–3 (for example from a proxy trap) is `shape` at `$`, "Input could not
 * be read as plain data". The input is never changed or frozen.
 *
 * @param input - Proposed collection data.
 * @returns The detached collection, or `validation-failed` with at least one diagnostic and no
 * partial value. Either outcome is deeply frozen.
 * @throws Never.
 */
export { validateCollection as validate } from '../core/invariants/validate.js';

/**
 * Plans an ordered change batch against a snapshot: validates the snapshot, stages the changes
 * (see {@link stage}), then validates the resulting candidate as a whole collection. Changes may
 * temporarily break references as long as the final candidate is valid. The revision is never
 * incremented and nothing is written.
 *
 * The first failing step's diagnostics are returned: the snapshot's, then staging's, then the
 * candidate's. A throw that escapes those steps is `shape` at `changes`, "Input could not be
 * read as plain data".
 *
 * @param snapshot - The current collection data.
 * @param changes - The ordered changes (at most 1,000).
 * @returns The valid candidate and its net impact (records added, updated or removed), or
 * `validation-failed`. Either outcome is deeply frozen.
 * @throws Never.
 */
export { planChanges as plan } from '../core/collection/plan.js';

/**
 * Stages a change batch without the final validity check, for the language compiler. It
 * validates the snapshot, inspects the changes as plain JSON, parses them with the change
 * schema, then applies them in order and stops at the first failing change. The candidate's
 * references may be unresolved; only {@link plan} proves validity.
 *
 * A throw that escapes those steps is `shape` at `changes`, "Input could not be read as plain
 * data".
 *
 * @param snapshot - The current collection data.
 * @param changes - The ordered changes (at most 1,000).
 * @returns The unchecked candidate with the parsed changes (`validity: 'unchecked'`), or
 * `validation-failed`. Either outcome is deeply frozen.
 * @throws Never.
 */
export { stageChanges as stage } from '../core/collection/stage.js';

/**
 * Display helpers for shared type definitions. Each takes a validated collection.
 *
 * - `definitionDisplay(collection, id)`: the definition's type as text, expanding referenced
 *   definitions. A reference back to a definition already being expanded, or to a missing one,
 *   shows as `@id`. At most 256 expression nodes are shown; a longer display ends with ` …`. An
 *   unknown ID is `not-found` at `definitions.<id>`, "Definition ID must exist".
 * - `definitionUsages(collection, id)`: every direct use of the definition (fields, members,
 *   signature parameters and returns, and other definitions' expressions), sorted by path. An
 *   unknown ID is `not-found` as above.
 * - `fieldTypeDisplay(collection, field)` and `typeUseDisplay(collection, type)`: a plain string
 *   type as written, or a definition reference displayed as above.
 *
 * Results are new and not frozen. They throw only if given data that is not a validated
 * collection.
 */
export {
  definitionDisplay,
  definitionUsages,
  fieldTypeDisplay,
  typeUseDisplay,
} from '../core/definitions.js';

/**
 * Resolves a relationship endpoint to a callable target in a validated collection: a whole
 * object of kind `function`, or a `signature` member of a `module`, `interface` or `function`
 * object.
 *
 * @returns The owner (and member), or `undefined` when the endpoint is not callable or its owner
 * or member does not exist. Not frozen.
 * @throws Only if given data that is not a validated collection.
 */
export { resolveCallableEndpoint } from '../core/relationships/callable.js';

/** A resolved callable target: its owning object and, for a signature, the member. */
export type { CallableEndpoint } from '../core/relationships/callable.js';

/** One direct use of a definition, addressed by its collection path. */
export type { DefinitionUsage } from '../core/definitions.js';
