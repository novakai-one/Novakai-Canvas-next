/*
 * Planning an ordered batch of catalog changes as one atomic transition. Nothing is written: the
 * host commits the candidate only if the read versions are unchanged. Authoring owns admission,
 * the conditional commit and crash recovery.
 */
import type { Catalog } from '../../contract/records/catalog.js';
import { changesSchema, type CatalogChange } from '../../contract/records/change.js';
import {
  inventorySchema,
  type LibrarySnapshot,
  type CollectionProjection,
} from '../../contract/records/snapshot.js';
import type { CatalogPlan, PlanInput } from '../../contract/types.js';
import type { Result } from '../../contract/errors.js';
import { validateSnapshot } from '../validation/validate.js';
import { parse, protect, success } from '../validation/outcomes.js';
import { hasCollection } from '../validation/lookups.js';
import { readVersions } from '../discovery/versions.js';
import { applyOperation } from './operations.js';

/**
 * Plans an ordered batch of catalog changes as one atomic transition.
 *
 * Steps; the first failure stops the plan and no partial candidate is returned:
 * 1. Read the input's `snapshot`, `changes` and `proposedCollections`.
 * 2. Validate the original snapshot.
 * 3. Parse the changes.
 * 4. Parse the inventory: `proposedCollections` when given (even `null`, which is rejected), or
 *    the snapshot's own collections when it is absent or `undefined`.
 * 5. Apply the changes in order to the original catalog.
 * 6. Validate the candidate against that inventory. Recent visits to collections no longer in the
 *    inventory are dropped for this check.
 *
 * Nothing is written. The candidate keeps the original revision, `versions` are the original read
 * revisions, and `changed` is the net effect. A throw while reading the input becomes a `shape`
 * failure at `$`. The same input always gives the same plan, so a retry is safe; Authoring owns
 * admission, the conditional commit and crash recovery.
 *
 * @param input - The untrusted snapshot, changes and optional proposed inventory.
 * @returns The frozen plan, or a failure.
 * @throws Never; a throw while reading the input becomes a `shape` failure.
 */
export function planCatalog(input: PlanInput): Result<CatalogPlan> {
  return protect(/** Plans the batch. */ () => preparePlan(input));
}

/** Validates the original snapshot before reading or applying any change. */
function preparePlan(input: PlanInput): Result<CatalogPlan> {
  const { snapshot, changes, proposedCollections } = input;
  const before = validateSnapshot(snapshot);
  if (!before.ok) {
    return before;
  }
  const parsedChanges = parse(changesSchema(), changes);
  if (!parsedChanges.ok) {
    return parsedChanges;
  }
  const inventory = chooseInventory(before.value, proposedCollections);
  return applyBatch(before.value, parsedChanges.value, inventory);
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
  const inventory = parse(inventorySchema(), proposedCollections);
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
  const recent = before.recent.filter(
    /** Whether the visited collection is still in the inventory. */ (visit) =>
      hasCollection(collections, visit.collection),
  );
  const validated = validateSnapshot({ catalog, collections, recent });
  if (!validated.ok) {
    return validated;
  }
  const candidate = validated.value.catalog;
  const changed = JSON.stringify(candidate) !== JSON.stringify(before.catalog);
  return success({ candidate, changed, versions: readVersions(before) });
}
