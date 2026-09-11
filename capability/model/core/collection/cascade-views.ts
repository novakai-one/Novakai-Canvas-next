import type { ObjectId } from '../../contract/brands.js';
import type { Section, Appearance, Group } from '../../contract/records/section.js';
import type { LayoutIntent } from '../../contract/records/layout.js';
function cleanAppearance(appearance: Appearance, removedGroups: readonly string[]): Appearance {
  if (!removedGroups.includes(appearance.group ?? '')) return appearance;
  const { group, ...rest } = appearance;
  void group;
  return rest;
}
function cleanParent(group: Group, removedGroups: readonly string[]): Group {
  if (!removedGroups.includes(group.parent ?? '')) return group;
  const { parent, ...rest } = group;
  void parent;
  return rest;
}
function cleanLayout(layout: LayoutIntent, id: string, groups: readonly string[]): LayoutIntent {
  return {
    ...layout,
    constraints: layout.constraints.filter(
      (constraint) =>
        !constraint.targets.some((target) => removedTarget(target.kind, target.id, id, groups)),
    ),
  };
}
function removedTarget(
  kind: string,
  target: string,
  id: string,
  groups: readonly string[],
): boolean {
  if (kind === 'object') return target === id;
  return kind === 'group' && groups.includes(target);
}
function root(section: Section, id: string): Section {
  if (section.root !== id) return section;
  const { root: removed, ...rest } = section;
  void removed;
  return rest;
}
export function cascadeSection(
  section: Section,
  id: ObjectId,
  relationships: readonly string[],
): Section {
  const removedGroups = section.groups
    .filter((group) => group.represents === id)
    .map((group) => group.id);
  return {
    ...root(section, id),
    appearances: section.appearances
      .filter((appearance) => appearance.object !== id)
      .map((appearance) => cleanAppearance(appearance, removedGroups)),
    groups: section.groups
      .filter((group) => group.represents !== id)
      .map((group) => ({
        ...cleanParent(group, removedGroups),
        layout: cleanLayout(group.layout, id, removedGroups),
      })),
    wires: section.wires.filter((wire) => !relationships.includes(wire.relationship)),
    layout: cleanLayout(section.layout, id, removedGroups),
    sequence: section.sequence.filter(
      (item) => item.kind !== 'event' || ![item.source, item.target].includes(id),
    ),
  };
}
