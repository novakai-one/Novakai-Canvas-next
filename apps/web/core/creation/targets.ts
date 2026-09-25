/*
 * Where an add can go. Tree diagrams take no adds, so only the other sections are offered. A draft
 * section that is not offered falls back to the first offered section. An object already shown in
 * the target diagram cannot be reused there again.
 */
import type { ReuseChoice } from '../../contract/records/creation.js';
import type { Collection, DiagramObject, Section } from '../../contract/records/owners.js';

/** The diagrams an add can target: every section except trees; none without a collection. */
export function addableSections(collection: Collection | null): readonly Section[] {
  return (collection?.sections ?? []).filter((section) => section.mode !== 'tree');
}

/** A section from another collection (or none) falls back to the first diagram, so the select and the submit agree. */
export function selectedSection(
  current: string,
  sections: readonly Section[],
): string {
  return sections.some((section) => section.id === current) ? current : (sections[0]?.id ?? '');
}

/** The offered section with this ID; null when none has it. */
export function sectionById(
  sections: readonly Section[],
  id: string,
): Section | null {
  return sections.find((section) => section.id === id) ?? null;
}

/** Objects that already appear in the target diagram cannot be reused there again. */
export function presentObjects(section: Section | null): ReadonlySet<string> {
  return new Set(section?.appearances.map((appearance) => appearance.object) ?? []);
}

/** Every object in the collection as a reuse choice; one already present is disabled. */
export function reuseChoices(
  objects: readonly DiagramObject[],
  present: ReadonlySet<string>,
): readonly ReuseChoice[] {
  return objects.map((item) => ({
    id: item.id,
    label: reuseLabel(item, present),
    disabled: present.has(item.id),
  }));
}

/** An object's name, marked when the target diagram already shows it. */
function reuseLabel(
  item: DiagramObject,
  present: ReadonlySet<string>,
): string {
  return present.has(item.id) ? `${item.label} · already in this diagram` : item.label;
}
