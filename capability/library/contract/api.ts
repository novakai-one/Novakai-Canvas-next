/*
 * Library's three pure entry points, composed from core. None of them stores anything; Authoring
 * owns admission, durable writes and crash recovery. Each returns a frozen result and never
 * throws: a throw while reading the input becomes a `shape` failure at `$`. The same input always
 * gives the same result, so a retry is always safe.
 */
export { validateLibrarySnapshot } from '../core/validation/validate.js';
export { planOrganisation } from '../core/organisation/plan.js';
export { queryLibrary } from '../core/discovery/query.js';
