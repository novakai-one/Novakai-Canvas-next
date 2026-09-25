/*
 * Planning an ordered batch of organisation changes as one atomic transition. Nothing is written: the
 * host commits the candidate only if the read versions are unchanged. Authoring owns admission,
 * the conditional commit and crash recovery.
 */
import type { Organisation } from '../../contract/records/organisation.js';
import { changesSchema, type OrganisationChange } from '../../contract/records/change.js';
import {
  inventorySchema,
  type LibrarySnapshot,
  type CollectionProjection,
} from '../../contract/records/snapshot.js';
import type { OrganisationPlan, PlanInput } from '../../contract/types.js';
import type { LibraryResult } from '../../contract/errors.js';
import { validateLibrarySnapshot } from '../validation/validate.js';
import { parse, protect, success } from '../shared/outcomes.js';
import { hasCollection } from '../shared/lookups.js';
import { readVersions } from '../shared/versions.js';
import { applyOperation } from './operations.js';

/**
 * Plans an ordered batch of organisation changes as one atomic transition.
 *
 * Steps; the first failure stops the plan and no partial candidate is returned:
 * 1. Read the input's `snapshot`, `changes` and `proposedCollections`.
 * 2. Validate the original snapshot.
 * 3. Parse the changes.
 * 4. Parse the inventory: `proposedCollections` when given (even `null`, which is rejected), or
 *    the snapshot's own collections when it is absent or `undefined`.
 * 5. Apply the changes in order to the original organisation.
 * 6. Validate the candidate against that inventory. Recent visits to collections no longer in the
 *    inventory are dropped for this check.
 *
 * Nothing is written. The candidate keeps the original revision, `versions` are the original read
 * revisions, and `changed` is the net effect. A throw while reading the input becomes a `invalid-input`
 * failure at `$`.
 */
export function planOrganisation(input: PlanInput): LibraryResult<OrganisationPlan> {
  return protect(() => preparePlan(input));
}

/** Validates the original snapshot before reading or applying any change. */
function preparePlan(input: PlanInput): LibraryResult<OrganisationPlan> {
  const { snapshot, changes, proposedCollections } = input;
  const before = validateLibrarySnapshot(snapshot);
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
function chooseInventory(
  before: LibrarySnapshot,
  proposedCollections: unknown,
): unknown {
  if (proposedCollections === undefined) {
    return before.collections;
  }
  return proposedCollections;
}

/** Parses the inventory, applies every change, then validates the candidate. */
function applyBatch(
  before: LibrarySnapshot,
  changes: readonly OrganisationChange[],
  proposedCollections: unknown,
): LibraryResult<OrganisationPlan> {
  const inventory = parse(inventorySchema(), proposedCollections);
  if (!inventory.ok) {
    return inventory;
  }
  // `applyNext` passes the first failure along unchanged, so later changes are skipped.
  const applied = changes.reduce(applyNext, success(before.organisation));
  if (!applied.ok) {
    return applied;
  }
  return validateCandidate(before, applied.value, inventory.value);
}

/** Applies the next change, or passes an earlier failure on unchanged. */
function applyNext(
  current: LibraryResult<Organisation>,
  change: OrganisationChange,
): LibraryResult<Organisation> {
  if (!current.ok) {
    return current;
  }
  return applyOperation(current.value, change);
}

/**
 * Validates the candidate organisation with the final inventory (recent visits to removed collections
 * dropped), then builds the plan. `changed` compares the JSON text of both organisations.
 */
function validateCandidate(
  before: LibrarySnapshot,
  organisation: Organisation,
  collections: readonly CollectionProjection[],
): LibraryResult<OrganisationPlan> {
  const recent = before.recent.filter((visit) => hasCollection(collections, visit.collection));
  const validated = validateLibrarySnapshot({ organisation, collections, recent });
  if (!validated.ok) {
    return validated;
  }
  const candidate = validated.value.organisation;
  const changed = JSON.stringify(candidate) !== JSON.stringify(before.organisation);
  return success({ candidate, changed, versions: readVersions(before) });
}
