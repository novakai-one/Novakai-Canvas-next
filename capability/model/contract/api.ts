/**
 * Model's callable boundary: validate diagram data or plan a valid immutable transition.
 * Both operations return frozen typed outcomes and perform no I/O. Authoring owns
 * admission, revision increments, commit and crash recovery.
 */

/** Inspect and validate unknown collection data; failure exposes diagnostics, never a partial collection. */
export { validateCollection as validate } from '../core/invariants/validate.js';

/** Plan an ordered change batch against a snapshot without writing or incrementing its revision. */
export { planChanges as plan } from '../core/collection/plan.js';
