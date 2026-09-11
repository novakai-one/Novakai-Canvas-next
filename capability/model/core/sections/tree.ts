import type { Collection } from '../../contract/records/collection.js';
import type { Section } from '../../contract/records/section.js';
import { issue } from '../invariants/issues.js';
import { hasCycle, visibleObjects } from './groups.js';
import { visibleRelationships } from './modes.js';
function participates(id: string, section: Section, collection: Collection) {
  const appearance = section.appearances.find((appearance) => appearance.object === id);
  if (appearance?.participation) return appearance.participation === 'tree';
  return collection.objects.find((object) => object.id === id)?.kind !== 'note';
}
function rootErrors(ids: readonly string[], section: Section) {
  if (ids.length === 0)
    return issue(
      section.root !== undefined,
      'tree',
      `sections.${section.id}.root`,
      'Empty tree has no root',
    );
  return issue(
    !ids.includes(section.root ?? ''),
    'tree',
    `sections.${section.id}.root`,
    'Tree root must be an explicit participant',
  );
}
export function validateTree(section: Section, collection: Collection) {
  if (section.mode !== 'tree') return [];
  const ids = visibleObjects(section).filter((id) => participates(id, section, collection));
  const parents = visibleRelationships(section, collection).filter(
    (wire) => wire.kind === 'parent',
  );
  return [
    ...rootErrors(ids, section),
    ...parents.flatMap((wire) =>
      issue(
        !ids.includes(wire.source.object) || !ids.includes(wire.target.object),
        'tree',
        `sections.${section.id}.wires.${wire.id}`,
        'Parent edge must connect tree participants',
      ),
    ),
    ...ids.flatMap((id) =>
      issue(
        parents.filter((wire) => wire.target.object === id).length !==
          (id === section.root ? 0 : 1),
        'tree',
        `sections.${section.id}.appearances.${id}`,
        'Root has zero parents; every other participant exactly one',
      ),
    ),
    ...ids.flatMap((id) =>
      issue(
        hasCycle(
          id,
          (current) => parents.find((wire) => wire.target.object === current)?.source.object,
        ),
        'tree',
        `sections.${section.id}.appearances.${id}`,
        'Parent graph must be acyclic and rooted',
      ),
    ),
  ];
}
