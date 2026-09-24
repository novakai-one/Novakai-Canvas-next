/**
 * Library's three pure entry points. None of them stores anything; Authoring owns admission,
 * durable writes and crash recovery. Each returns a frozen result and never throws.
 */

/** Validates one Library snapshot: the catalog, the collection projections and recent visits. */
export { validateSnapshot as validate } from '../core/validation/validate.js';

/**
 * Plans an ordered batch of catalog changes against the original snapshot, and optionally the
 * collection inventory the host is about to commit.
 */
export { planCatalog as plan } from '../core/catalog/plan.js';

/**
 * Searches one snapshot. Results carry the source revisions, and a cursor only works with the
 * same query and the same revisions, so pages never mix revisions.
 */
export { queryLibrary as query } from '../core/discovery/query.js';
