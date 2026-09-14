import type { Collection } from '../../contract/records/collection.js';
import type { Section, Appearance, Group, WireAppearance } from '../../contract/records/section.js';
import type { Placement } from '../../contract/records/layout.js';

type PlacedRecord = { readonly placement?: Placement | undefined };

/** Explicit new geometry wins; absence preserves an existing human override, if any. */
function inheritPlacement<T extends PlacedRecord>(
  next: T,
  previousPlacement: Placement | undefined,
): T {
  if (next.placement !== undefined) return next;
  if (previousPlacement === undefined) return next;
  return { ...next, placement: previousPlacement };
}

/** Match an ordinary appearance first. Only an absent appearance permits the group fallback. */
function previousAppearancePlacement(
  appearance: Appearance,
  previous: Section,
): Placement | undefined {
  const previousAppearance = previous.appearances.find((item) => item.object === appearance.object);
  if (previousAppearance !== undefined) return previousAppearance.placement;
  const representedGroup = previous.groups.find((group) => group.represents === appearance.object);
  return representedGroup?.placement;
}

/** Group identity takes precedence; a newly representing group can inherit its object's position. */
function previousGroupPlacement(group: Group, previous: Section): Placement | undefined {
  const previousGroup = previous.groups.find((item) => item.id === group.id);
  if (previousGroup !== undefined) return previousGroup.placement;
  const previousAppearance = previous.appearances.find((item) => item.object === group.represents);
  return previousAppearance?.placement;
}

/** A route override carries its lock with its points; explicit new points take precedence. */
function preserveWireRoute(wire: WireAppearance, previous: Section): WireAppearance {
  if (wire.manual !== undefined) return wire;
  const previousWire = previous.wires.find((item) => item.relationship === wire.relationship);
  if (previousWire?.manual === undefined) return wire;
  return { ...wire, manual: previousWire.manual, locked: previousWire.locked };
}

/**
 * Carries geometry across semantic replacement of an existing section. Appearances match
 * by object, groups by group ID, wires by relationship. Appearance/group conversion may
 * inherit placement from the prior representation, but never substitutes for a matching
 * record that simply has no placement. New explicit geometry wins. Pure copying; Authoring
 * owns commit/recovery and reset operations intentionally bypass preservation.
 */
export function preserveSection(next: Section, previous: Section): Section {
  const section = inheritPlacement(next, previous.placement);
  const appearances = next.appearances.map((appearance) => {
    const previousPlacement = previousAppearancePlacement(appearance, previous);
    return inheritPlacement(appearance, previousPlacement);
  });
  const groups = next.groups.map((group) => {
    const previousPlacement = previousGroupPlacement(group, previous);
    return inheritPlacement(group, previousPlacement);
  });
  const wires = next.wires.map((wire) => preserveWireRoute(wire, previous));
  return { ...section, appearances, groups, wires };
}

/** New section identities have no geometry to inherit. */
function preserveMatchingSection(section: Section, previous: Collection): Section {
  const previousSection = previous.sections.find((item) => item.id === section.id);
  if (previousSection === undefined) return section;
  return preserveSection(section, previousSection);
}

/** Preserve matching section geometry during whole-document replacement; never mutate the base. */
export function preserveOverrides(next: Collection, previous: Collection): Collection {
  const sections = next.sections.map((section) => preserveMatchingSection(section, previous));
  return { ...next, sections };
}

/** Omit the field entirely so subsequent layout sees an automatic-placement request. */
function clearPlacement<T extends PlacedRecord>(value: T): Omit<T, 'placement'> {
  const { placement: removedPlacement, ...unplaced } = value;
  void removedPlacement;
  return unplaced;
}

/** Reset points and lock together; route style and attachment-side preferences remain. */
export function clearRoute(wire: WireAppearance): WireAppearance {
  const { manual: removedPoints, ...automaticRoute } = wire;
  void removedPoints;
  return { ...automaticRoute, locked: false };
}

/** Reset all section geometry, retaining semantic constraints. Repeating the reset is safe. */
export function clearSection(section: Section): Section {
  const unplacedSection = clearPlacement(section);
  const appearances = section.appearances.map(clearPlacement);
  const groups = section.groups.map(clearPlacement);
  const wires = section.wires.map(clearRoute);
  return { ...unplacedSection, appearances, groups, wires };
}
