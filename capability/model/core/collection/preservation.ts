import type { Collection } from '../../contract/records/collection.js';
import type { Section, WireAppearance } from '../../contract/records/section.js';
import type { Placement } from '../../contract/records/layout.js';
function placement<T extends { readonly placement?: Placement | undefined }>(
  next: T,
  previous: { readonly placement?: Placement | undefined } | undefined,
): T {
  if (next.placement || !previous?.placement) return next;
  return { ...next, placement: previous.placement };
}
function route(next: WireAppearance, previous: WireAppearance | undefined): WireAppearance {
  if (next.manual || !previous?.manual) return next;
  return { ...next, manual: previous.manual, locked: previous.locked };
}
export function preserveSection(next: Section, previous: Section | undefined): Section {
  if (!previous) return next;
  return {
    ...placement(next, previous),
    appearances: next.appearances.map((item) =>
      placement(
        item,
        previous.appearances.find((old) => old.object === item.object) ??
          previous.groups.find((old) => old.represents === item.object),
      ),
    ),
    groups: next.groups.map((item) =>
      placement(
        item,
        previous.groups.find((old) => old.id === item.id) ??
          previous.appearances.find((old) => old.object === item.represents),
      ),
    ),
    wires: next.wires.map((item) =>
      route(
        item,
        previous.wires.find((old) => old.relationship === item.relationship),
      ),
    ),
  };
}
export function preserveOverrides(next: Collection, previous: Collection): Collection {
  return {
    ...next,
    sections: next.sections.map((section) =>
      preserveSection(
        section,
        previous.sections.find((old) => old.id === section.id),
      ),
    ),
  };
}
export function clearPlacement<T extends { readonly placement?: Placement | undefined }>(
  value: T,
): Omit<T, 'placement'> {
  const { placement: removed, ...rest } = value;
  void removed;
  return rest;
}
export function clearRoute(wire: WireAppearance): WireAppearance {
  const { manual, ...rest } = wire;
  void manual;
  return { ...rest, locked: false };
}
export function clearSection(section: Section): Section {
  return {
    ...clearPlacement(section),
    appearances: section.appearances.map(clearPlacement),
    groups: section.groups.map(clearPlacement),
    wires: section.wires.map(clearRoute),
  };
}
