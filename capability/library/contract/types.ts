import type { CatalogId, CollectionId } from './brands.js';
import type { Catalog } from './records/catalog.js';
/** Original source revisions read by a query/plan; collections are sorted by ID. */
export interface ReadVersions {
  readonly catalog: { readonly id: CatalogId; readonly revision: number };
  readonly collections: readonly { readonly id: CollectionId; readonly revision: number }[];
}
/** Proposed organization only. Authoring checks the original read set and performs the commit. */
export interface CatalogPlan {
  readonly candidate: Catalog;
  readonly versions: ReadVersions;
  readonly changed: boolean;
}
