import type { Collection } from '../../contract/records/collection.js';
import type { Section, WireAppearance } from '../../contract/records/section.js';
import { duplicates, issue, required } from '../invariants/issues.js';
import { validateGroups, visibleObjects } from './groups.js';
import { validateModes } from './modes.js';
import { validateTree } from './tree.js';
import { validateSequence } from './sequence.js';
function wireErrors(wire: WireAppearance, section: Section, collection: Collection) {
  const relationship = collection.relationships.find(
    (relationship) => relationship.id === wire.relationship,
  );
  const path = `sections.${section.id}.wires.${wire.relationship}`;
  if (!relationship) return required(false, path);
  const visible = visibleObjects(section);
  return [
    ...required(visible.includes(relationship.source.object), `${path}.source`),
    ...required(visible.includes(relationship.target.object), `${path}.target`),
    ...issue(wire.locked && !wire.manual, 'layout', path, 'Locked route requires manual points'),
  ];
}
function viewErrors(section: Section, collection: Collection) {
  const path = `sections.${section.id}`;
  return [
    ...visibleObjects(section).flatMap((id) =>
      required(
        collection.objects.some((object) => object.id === id),
        `${path}.appearances.${id}`,
      ),
    ),
    ...section.appearances.flatMap((appearance) =>
      roleErrors(appearance.role, collection, `${path}.appearances.${appearance.object}.role`),
    ),
    ...duplicates(section.wires, (wire) => wire.relationship, `${path}.wires`),
    ...section.wires.flatMap((wire) => wireErrors(wire, section, collection)),
  ];
}
function roleErrors(role: string | undefined, collection: Collection, path: string) {
  if (!role) return [];
  return required(collection.theme.roles.includes(role), path);
}
const rules = [viewErrors, validateModes, validateTree, validateSequence];
export function validateSections(collection: Collection) {
  return collection.sections.flatMap((section) => [
    ...validateGroups(section),
    ...rules.flatMap((rule) => rule(section, collection)),
  ]);
}
