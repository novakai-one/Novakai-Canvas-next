import type { Catalog } from '../../contract/records/catalog.js';
import { changesSchema, type CatalogChange } from '../../contract/records/change.js';
import {
  inventorySchema,
  type LibrarySnapshot,
  type CollectionProjection,
} from '../../contract/records/snapshot.js';
import type { CatalogPlan } from '../../contract/types.js';
import type { Result } from '../../contract/errors.js';
import { validateSnapshot } from '../validation/validate.js';
import { parse, protect, success } from '../validation/outcomes.js';
import { readVersions } from '../discovery/project.js';
import { applyOperation } from './operations.js';

/**
 * Plans an ordered batch of catalog changes as one atomic transition.
 *
 * Steps; the first failure stops the plan and no partial candidate is returned:
 * 1. Validate the original snapshot.
 * 2. Parse the changes.
 * 3. Parse the inventory: `proposedCollections` when given (even `null`, which is rejected), or
 *    the snapshot's own collections when it is omitted or `undefined`.
 * 4. Apply the changes in order to the original catalog.
 * 5. Validate the candidate against that inventory. Recent visits to collections no longer in the
 *    inventory are dropped for this check.
 *
 * Nothing is written. The candidate keeps the original revision, `versions` are the original read
 * revisions, and `changed` is the net effect. A throw while reading the input becomes a `shape`
 * failure. The same inputs always give the same plan; Authoring owns admission, the conditional
 * commit and crash recovery.
 *
 * @param snapshot - The untrusted original snapshot.
 * @param changes - The untrusted changes.
 * @param proposedCollections - The collection inventory Authoring is about to commit (from its
 * Model plans), when the batch registers or removes collections.
 * @returns The frozen plan, or a failure.
 * @throws Never; a throw while reading the input becomes a `shape` failure.
 */
export function planCatalog(
  snapshot: unknown,
  changes: unknown,
  proposedCollections?: unknown,
): Result<CatalogPlan> {
  return protect(() => preparePlan(snapshot, changes, proposedCollections));
}

/** Validates the original snapshot before reading or applying any change. */
function preparePlan(
  input: unknown,
  changes: unknown,
  proposedCollections: unknown,
): Result<CatalogPlan> {
  const before = validateSnapshot(input);
  if (!before.ok) {
    return before;
  }
  const parsedChanges = parse(changesSchema, changes);
  if (!parsedChanges.ok) {
    return parsedChanges;
  }
  return applyBatch(
    before.value,
    parsedChanges.value,
    chooseInventory(before.value, proposedCollections),
  );
}

/** The snapshot's own collections when none are proposed; otherwise the proposed value as given. */
function chooseInventory(before: LibrarySnapshot, proposedCollections: unknown): unknown {
  if (proposedCollections === undefined) {
    return before.collections;
  }
  return proposedCollections;
}

/** Parses the inventory, applies every change, then validates the candidate. */
function applyBatch(
  before: LibrarySnapshot,
  changes: readonly CatalogChange[],
  proposedCollections: unknown,
): Result<CatalogPlan> {
  const inventory = parse(inventorySchema, proposedCollections);
  if (!inventory.ok) {
    return inventory;
  }
  // `applyNext` passes the first failure along unchanged, so later changes are skipped.
  const applied = changes.reduce(applyNext, success(before.catalog));
  if (!applied.ok) {
    return applied;
  }
  return validateCandidate(before, applied.value, inventory.value);
}

/** Applies the next change, or passes an earlier failure on unchanged. */
function applyNext(current: Result<Catalog>, change: CatalogChange): Result<Catalog> {
  if (!current.ok) {
    return current;
  }
  return applyOperation(current.value, change);
}

/**
 * Validates the candidate catalog with the final inventory (recent visits to removed collections
 * dropped), then builds the plan. `changed` compares the JSON text of both catalogs.
 */
function validateCandidate(
  before: LibrarySnapshot,
  catalog: Catalog,
  collections: readonly CollectionProjection[],
): Result<CatalogPlan> {
  const recent = before.recent.filter((visit) =>
    collections.some((collection) => collection.id === visit.collection),
  );
  const validated = validateSnapshot({ catalog, collections, recent });
  if (!validated.ok) {
    return validated;
  }
  const candidate = validated.value.catalog;
  const changed = JSON.stringify(candidate) !== JSON.stringify(before.catalog);
  return success({ candidate, changed, versions: readVersions(before) });
}
