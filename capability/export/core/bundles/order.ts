/*
 * Order metadata in the manual snapshot. DSL groups declarations by scope, so the order of
 * appearances, groups and sequence items is not visible in the source; the manual snapshot
 * keeps it, and import restores it.
 */
import type { Collection } from '../../contract/records/artifact.js';
import type { ManualSection } from '../../contract/records/manual.js';

/** One section of a collection. */
type Section = Collection['sections'][number];

/**
 * Whether the manual snapshot's appearance, group and sequence orders are each a complete
 * permutation of the section's IDs (no missing, extra or repeated IDs). All three are checked.
 *
 * @param section - The parsed section.
 * @param manual - That section's manual overrides.
 * @returns `true` when all three orders are complete.
 * @throws Never for plain parsed data; a throwing getter or proxy propagates to the enclosing
 * `protect`.
 */
export function validOrder(section: Section, manual: ManualSection): boolean {
  const checks = [
    completeOrder(
      manual.appearanceOrder,
      section.appearances.map((item) => item.object),
    ),
    completeOrder(
      manual.groupOrder,
      section.groups.map((item) => item.id),
    ),
    completeOrder(
      manual.sequenceOrder.map((item) => item.id),
      section.sequence.map((item) => item.id),
    ),
  ];
  return checks.every(Boolean);
}

/**
 * Returns a copy of the section with appearances and groups sorted into the manual order, and
 * sequence items listed in the manual order with their stored order numbers. Call only after
 * {@link validOrder} passed; Model re-validates the resulting order numbers.
 *
 * @param section - The parsed section.
 * @param manual - That section's manual overrides.
 * @returns The reordered section; the input is not changed.
 * @throws Never for plain parsed data; a throwing getter or proxy propagates to the enclosing
 * `protect`.
 */
export function restoreOrder(section: Section, manual: ManualSection): Section {
  return {
    ...section,
    appearances: sortedAppearances(section, manual),
    groups: sortedGroups(section, manual),
    sequence: orderedSequence(section, manual),
  };
}

/** Whether `actual` is a permutation of `expected`: same length, no repeats, all known IDs. */
function completeOrder(actual: readonly string[], expected: readonly string[]): boolean {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    actual.every((id) => expected.includes(id))
  );
}

/** A sorted copy of the section's appearances, in the manual appearance order. */
function sortedAppearances(section: Section, manual: ManualSection): Section['appearances'] {
  return [...section.appearances].sort(
    (a, b) => manual.appearanceOrder.indexOf(a.object) - manual.appearanceOrder.indexOf(b.object),
  );
}

/** A sorted copy of the section's groups, in the manual group order. */
function sortedGroups(section: Section, manual: ManualSection): Section['groups'] {
  return [...section.groups].sort(
    (a, b) => manual.groupOrder.indexOf(a.id) - manual.groupOrder.indexOf(b.id),
  );
}

/** The section's sequence items listed in the manual order, each with its stored order number. */
function orderedSequence(section: Section, manual: ManualSection): Section['sequence'] {
  return manual.sequenceOrder.flatMap((order) => sequenceEntry(section, order));
}

/** The section's sequence item for `order.id` with its order number replaced; empty if absent. */
function sequenceEntry(
  section: Section,
  order: ManualSection['sequenceOrder'][number],
): Section['sequence'] {
  const entry = section.sequence.find((item) => item.id === order.id);
  if (!entry) return [];
  return [{ ...entry, order: order.order }];
}
