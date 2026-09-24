/**
 * Library's three pure entry points. None of them stores anything; Authoring owns admission,
 * durable writes and crash recovery. Each returns a frozen result (success or failure) and never
 * throws: a throw while reading the input becomes a `shape` failure.
 */

/**
 * Validates one Library snapshot: the catalog, the collection projections and recent visits.
 *
 * `validate(input: unknown)` returns the parsed snapshot, or every diagnostic.
 */
export { validateSnapshot as validate } from '../core/validation/validate.js';

/**
 * Plans an ordered batch of catalog changes against the original snapshot, and optionally the
 * collection inventory the host is about to commit.
 *
 * `plan(snapshot: unknown, changes: unknown, proposedCollections?: unknown)` returns a
 * `CatalogPlan` (candidate catalog, original read versions, `changed`), or a failure.
 */
export { planCatalog as plan } from '../core/catalog/plan.js';

/**
 * Searches one snapshot. Results carry the source revisions. A cursor only works with the same
 * normalized criteria (text and kinds normalized; page size included), the same recent visits and
 * the same source revisions, so pages never mix revisions.
 *
 * `query(snapshot: unknown, request: unknown)` returns a `QueryPage`, or a failure.
 */
export { queryLibrary as query } from '../core/discovery/query.js';
