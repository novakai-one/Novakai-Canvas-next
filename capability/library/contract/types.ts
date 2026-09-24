import type { CatalogId, CollectionId } from './brands.js';
import type { Catalog } from './records/catalog.js';

/**
 * The source revisions an operation read: the catalog's, and each collection's, sorted by
 * collection ID. Authoring compares them with the current revisions before committing a plan.
 */
export interface ReadVersions {
  readonly catalog: { readonly id: CatalogId; readonly revision: number };
  readonly collections: readonly { readonly id: CollectionId; readonly revision: number }[];
}

/**
 * A proposed catalog, not yet stored. Authoring checks `versions` against the current sources and
 * performs the commit.
 */
export interface CatalogPlan {
  /** The catalog after the changes. Its `revision` is unchanged; Authoring assigns the next one. */
  readonly candidate: Catalog;
  /** The revisions of the original snapshot the plan was made from. */
  readonly versions: ReadVersions;
  /** True when the candidate differs from the original catalog (the net effect of all changes). */
  readonly changed: boolean;
}
