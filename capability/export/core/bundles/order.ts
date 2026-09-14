import type { Collection } from '../../contract/records/artifact.js';
import type { ManualSection } from '../../contract/records/manual.js';
type Section = Collection['sections'][number];
/** DSL groups declarations by their scope; the sidecar preserves otherwise invisible record order and sequence ordinals. */
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
/** A full permutation is required; partial/duplicate order metadata cannot drop or invent semantic records. */
function completeOrder(actual: readonly string[], expected: readonly string[]): boolean {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    actual.every((id) => expected.includes(id))
  );
}
/** Order metadata is validated before restoration; Model revalidates the resulting sequence ordinals. */
export function restoreOrder(section: Section, manual: ManualSection): Section {
  return {
    ...section,
    appearances: [...section.appearances].sort(
      (a, b) => manual.appearanceOrder.indexOf(a.object) - manual.appearanceOrder.indexOf(b.object),
    ),
    groups: [...section.groups].sort(
      (a, b) => manual.groupOrder.indexOf(a.id) - manual.groupOrder.indexOf(b.id),
    ),
    sequence: manual.sequenceOrder.flatMap((order) => sequenceEntry(section, order)),
  };
}
/** Preserve the original sequence record and change only its stored ordinal. */
function sequenceEntry(
  section: Section,
  order: ManualSection['sequenceOrder'][number],
): Section['sequence'] {
  const entry = section.sequence.find((item) => item.id === order.id);
  if (!entry) return [];
  return [{ ...entry, order: order.order }];
}
