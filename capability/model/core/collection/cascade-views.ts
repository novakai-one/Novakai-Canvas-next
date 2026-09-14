import type { ObjectId, GroupId, RelationshipId } from '../../contract/brands.js';
import type { Section, Appearance, Group, SequenceItem } from '../../contract/records/section.js';
import type { LayoutIntent, LayoutTarget } from '../../contract/records/layout.js';

/** Children of a removed representing group survive as ungrouped appearances. */
function detachAppearance(appearance: Appearance, removedGroups: readonly GroupId[]): Appearance {
  if (appearance.group === undefined) return appearance;
  if (!removedGroups.includes(appearance.group)) return appearance;
  const { group: removedGroup, ...ungrouped } = appearance;
  void removedGroup;
  return ungrouped;
}

/** Nested groups survive when their parent representation is deleted. */
function detachGroup(group: Group, removedGroups: readonly GroupId[]): Group {
  if (group.parent === undefined) return group;
  if (!removedGroups.includes(group.parent)) return group;
  const { parent: removedParent, ...unparented } = group;
  void removedParent;
  return unparented;
}

/** Constraints involving a removed object or representing group must be removed as a whole. */
function addressesRemovedTarget(
  target: LayoutTarget,
  removedId: ObjectId,
  removedGroups: readonly GroupId[],
): boolean {
  if (target.kind === 'object') return target.id === removedId;
  return target.kind === 'group' && removedGroups.includes(target.id);
}

/** Retain constraints whose complete target set survives. */
function pruneLayout(
  layout: LayoutIntent,
  removedId: ObjectId,
  removedGroups: readonly GroupId[],
): LayoutIntent {
  const constraints = layout.constraints.filter((constraint) => {
    const hasRemovedTarget = constraint.targets.some((target) =>
      addressesRemovedTarget(target, removedId, removedGroups),
    );
    return !hasRemovedTarget;
  });
  return { ...layout, constraints };
}

/** Deleting the explicit tree root clears the reference; final validation decides whether a new root is needed. */
function clearDeletedRoot(section: Section, removedId: ObjectId): Section {
  if (section.root !== removedId) return section;
  const { root: removedRoot, ...withoutRoot } = section;
  void removedRoot;
  return withoutRoot;
}

/** Fragments remain; only messages incident to the deleted participant are removed. */
function sequenceItemSurvives(item: SequenceItem, removedId: ObjectId): boolean {
  if (item.kind !== 'event') return true;
  return item.source !== removedId && item.target !== removedId;
}

/**
 * Prunes section references for an explicit cascade while retaining unrelated content and
 * child groups. This may leave a tree requiring repair by another operation in the batch.
 * Pure copying; planChanges owns final validation and Authoring owns commit/recovery.
 */
export function cascadeSection(
  section: Section,
  removedId: ObjectId,
  removedRelationships: readonly RelationshipId[],
): Section {
  const removedGroups = section.groups
    .filter((group) => group.represents === removedId)
    .map((group) => group.id);
  const survivingAppearances = section.appearances.filter(
    (appearance) => appearance.object !== removedId,
  );
  const appearances = survivingAppearances.map((appearance) =>
    detachAppearance(appearance, removedGroups),
  );
  const survivingGroups = section.groups.filter((group) => group.represents !== removedId);
  const groups = survivingGroups.map((group) => {
    const detachedGroup = detachGroup(group, removedGroups);
    const layout = pruneLayout(group.layout, removedId, removedGroups);
    return { ...detachedGroup, layout };
  });
  const wires = section.wires.filter((wire) => !removedRelationships.includes(wire.relationship));
  const layout = pruneLayout(section.layout, removedId, removedGroups);
  const sequence = section.sequence.filter((item) => sequenceItemSurvives(item, removedId));
  return { ...clearDeletedRoot(section, removedId), appearances, groups, wires, layout, sequence };
}
