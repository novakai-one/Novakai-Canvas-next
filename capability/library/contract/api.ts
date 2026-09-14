/** Pure Library entry points; Authoring owns admission, durable writes and crash recovery. */
export { validateSnapshot as validate } from '../core/validation/validate.js';
/** Plan catalog organization against original and optional prospective collection inventories. */
export { planCatalog as plan } from '../core/catalog/plan.js';
/** Search one immutable snapshot; source versions and cursors prevent mixed-revision paging. */
export { queryLibrary as query } from '../core/discovery/query.js';
