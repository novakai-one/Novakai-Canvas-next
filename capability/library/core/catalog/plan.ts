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

/** Stop applying operations after the first failure; no partial catalog escapes. */
function applyNext(current: Result<Catalog>, change: CatalogChange): Result<Catalog> {
  if (!current.ok) return current;
  return applyOperation(current.value, change);
}
/** Final inventory may add/remove projections; visits to removed sources are not part of the candidate. */
function validateCandidate(
  before: LibrarySnapshot,
  catalog: Catalog,
  collections: readonly CollectionProjection[],
): Result<CatalogPlan> {
  const recent = before.recent.filter((visit) =>
    collections.some((collection) => collection.id === visit.collection),
  );
  const validated = validateSnapshot({ catalog, collections, recent });
  if (!validated.ok) return validated;
  const candidate = validated.value.catalog;
  const changed = JSON.stringify(candidate) !== JSON.stringify(before.catalog);
  return success({ candidate, changed, versions: readVersions(before) });
}
/** A provided prospective inventory comes from Authoring's Model plans, never a durable write here. */
function applyBatch(
  before: LibrarySnapshot,
  changes: readonly CatalogChange[],
  proposedCollections: unknown,
): Result<CatalogPlan> {
  const inventory = parse(inventorySchema, proposedCollections);
  if (!inventory.ok) return inventory;
  const applied = changes.reduce(applyNext, success(before.catalog));
  if (!applied.ok) return applied;
  return validateCandidate(before, applied.value, inventory.value);
}
/** Absence means current inventory; an explicitly malformed prospective value is rejected. */
function chooseInventory(before: LibrarySnapshot, proposedCollections: unknown): unknown {
  if (proposedCollections === undefined) return before.collections;
  return proposedCollections;
}
/** Original consistency is checked before reading or applying any change. */
function preparePlan(
  input: unknown,
  changes: unknown,
  proposedCollections: unknown,
): Result<CatalogPlan> {
  const before = validateSnapshot(input);
  if (!before.ok) return before;
  const parsedChanges = parse(changesSchema, changes);
  if (!parsedChanges.ok) return parsedChanges;
  return applyBatch(
    before.value,
    parsedChanges.value,
    chooseInventory(before.value, proposedCollections),
  );
}
/**
 * Plan an ordered atomic catalog transition against original and optional prospective inventory.
 * Returns original read versions, an unchanged catalog revision and net catalog changed flag.
 * No partial candidate or source write occurs. protect translates read exceptions; Authoring
 * owns admission, conditional commit and crash recovery. Same-input replay is deterministic.
 */
export function planCatalog(
  snapshot: unknown,
  changes: unknown,
  proposedCollections?: unknown,
): Result<CatalogPlan> {
  return protect(() => preparePlan(snapshot, changes, proposedCollections));
}
