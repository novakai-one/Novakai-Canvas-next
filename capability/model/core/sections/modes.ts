import type { Collection } from '../../contract/records/collection.js';
import type { Section, Mode } from '../../contract/records/section.js';
import { duplicates, issue } from '../invariants/issues.js';
import { visibleObjects } from './groups.js';
export const compatibleLayouts: Readonly<Record<Mode, readonly string[]>> = {
  flow: ['flow', 'layered'],
  state: ['flow', 'layered'],
  er: ['layered'],
  modules: ['layered'],
  tree: ['tree'],
  sequence: ['sequence'],
  story: ['grid'],
  grid: ['grid'],
};
const compatibleWires: Partial<Readonly<Record<Mode, readonly string[]>>> = {
  er: ['association', 'reference'],
  modules: ['imports', 'calls', 'implements', 'contains', 'reference'],
  state: ['transition', 'reference'],
  tree: ['parent', 'reference'],
  sequence: [],
};
export function visibleRelationships(section: Section, collection: Collection) {
  return collection.relationships.filter((relationship) =>
    section.wires.some((wire) => wire.relationship === relationship.id),
  );
}
function decisions(section: Section, collection: Collection) {
  if (section.mode !== 'flow') return [];
  const ids = visibleObjects(section);
  return collection.objects
    .filter((object) => object.kind === 'decision' && ids.includes(object.id))
    .flatMap((object) =>
      duplicates(
        visibleRelationships(section, collection).filter(
          (wire) => wire.kind === 'flow' && wire.source.object === object.id,
        ),
        (wire) => wire.label,
        `sections.${section.id}.decision.${object.id}`,
      ),
    );
}
function treeOnly(section: Section) {
  if (section.mode === 'tree') return [];
  return [
    ...issue(
      section.root !== undefined,
      'mode',
      `sections.${section.id}.root`,
      'Root is tree-only',
    ),
    ...section.appearances.flatMap((appearance) =>
      issue(
        appearance.participation !== undefined,
        'mode',
        `sections.${section.id}.appearances.${appearance.object}`,
        'Participation is tree-only',
      ),
    ),
  ];
}
export function validateModes(section: Section, collection: Collection) {
  const path = `sections.${section.id}`;
  return [
    ...[section.layout, ...section.groups.map((group) => group.layout)].flatMap((layout) =>
      issue(
        !compatibleLayouts[section.mode].includes(layout.algorithm),
        'mode',
        `${path}.layout`,
        'Mode and layout must be compatible',
      ),
    ),
    ...visibleRelationships(section, collection).flatMap((wire) =>
      issue(
        !(compatibleWires[section.mode] ?? [wire.kind]).includes(wire.kind),
        'mode',
        `${path}.wires.${wire.id}`,
        'Wire kind is not legal in this mode',
      ),
    ),
    ...issue(
      section.mode !== 'sequence' && section.sequence.length > 0,
      'mode',
      `${path}.sequence`,
      'Sequence items are sequence-only',
    ),
    ...treeOnly(section),
    ...decisions(section, collection),
  ];
}
