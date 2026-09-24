import type { CatalogId, CollectionId } from './brands.js';
import type { Catalog } from './records/catalog.js';

/**
 * The source revisions an operation read: the catalog's, and each collection's, sorted by
 * collection ID. A host that commits a plan or pages results must make sure these sources have not
 * changed. (The current service host builds its commit conditions from its own snapshot instead
 * of reading this record.)
 */
export interface ReadVersions {
  /** The catalog's ID and the revision read. */
  readonly catalog: { readonly id: CatalogId; readonly revision: number };
  /** Each collection's ID and the revision read, sorted by ID. */
  readonly collections: readonly { readonly id: CollectionId; readonly revision: number }[];
}

/**
 * A proposed catalog, not yet stored. The host commits it only if the sources in `versions` are
 * unchanged; Authoring performs the commit.
 */
export interface CatalogPlan {
  /** The catalog after the changes. Its `revision` is unchanged; Authoring assigns the next one. */
  readonly candidate: Catalog;
  /** The revisions of the original snapshot the plan was made from. */
  readonly versions: ReadVersions;
  /** True when the candidate differs from the original catalog (the net effect of all changes). */
  readonly changed: boolean;
}
