/*
 * The inputs and results of Library's entry points. Library writes nothing: a host that commits a
 * plan or pages results checks the read versions, and Authoring owns commit and crash recovery.
 */
import type { CatalogId, CollectionId } from './brands.js';
import type { Catalog } from './records/catalog.js';

/**
 * The input of `plan`. Every value is untrusted and checked by Library.
 */
export interface PlanInput {
  /** The original snapshot (see `LibrarySnapshot`). */
  readonly snapshot: unknown;
  /** The ordered batch of catalog changes (see `CatalogChange`). */
  readonly changes: unknown;
  /**
   * The collection inventory Authoring is about to commit, when the batch registers or removes
   * collections. Absent or `undefined`: the snapshot's own collections are used. `null` is
   * rejected.
   */
  readonly proposedCollections?: unknown;
}

/**
 * The input of `query`. Both values are untrusted and checked by Library.
 */
export interface QueryInput {
  /** The snapshot to search (see `LibrarySnapshot`). */
  readonly snapshot: unknown;
  /** The search criteria (see `QueryRequest`). */
  readonly request: unknown;
}

/** The catalog's ID and the revision read. */
export interface CatalogVersion {
  readonly id: CatalogId;
  readonly revision: number;
}

/** A collection's ID and the revision read. */
export interface CollectionVersion {
  readonly id: CollectionId;
  readonly revision: number;
}

/**
 * The source revisions an operation read: the catalog's, and each collection's, sorted by
 * collection ID. A host that commits a plan or pages results must make sure these sources have not
 * changed. (The current service host builds its commit conditions from its own snapshot instead
 * of reading this record.)
 */
export interface ReadVersions {
  readonly catalog: CatalogVersion;
  /** Sorted by collection ID. */
  readonly collections: readonly CollectionVersion[];
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
