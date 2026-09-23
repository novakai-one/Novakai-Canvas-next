/**
 * Model's callable boundary: validate diagram data or plan a valid immutable transition.
 * Both operations return frozen typed outcomes and perform no I/O. Authoring owns
 * admission, revision increments, commit and crash recovery.
 */

/** Inspect and validate unknown collection data; failure exposes diagnostics, never a partial collection. */
export { validateCollection as validate } from '../core/invariants/validate.js';

/** Plan an ordered change batch against a snapshot without writing or incrementing its revision. */
export { planChanges as plan } from '../core/collection/plan.js';

/** Compiler-only unchecked projection; plan remains the final validity gate. */
export { stageChanges as stage } from '../core/collection/stage.js';
export {
  definitionDisplay,
  definitionUsages,
  fieldTypeDisplay,
  typeUseDisplay,
} from '../core/definitions.js';
export {
  typeUseText,
  typeUseKey,
  typeUseDefinitions,
  typeUseEntities,
} from '../core/definitions/type-uses.js';
export { resolveCallableEndpoint } from '../core/relationships/callable.js';
export type { CallableEndpoint } from '../core/relationships/callable.js';
export { relationshipLabel } from '../core/relationships/label.js';
export type { DefinitionUsage } from '../core/definitions.js';

/** Derived sequence-diagram ids (grammar §5): stable across lowering and the data fix. */
export {
  callId,
  callReturnId,
  returnId,
  fragmentId,
  branchId,
} from '../core/canonical/sequence-ids.js';
