import type { Section } from '../../contract/records/section.js';
import { duplicates, issue, present, required } from '../invariants/issues.js';
export function visibleObjects(section: Section): readonly string[] {
  return [
    ...section.appearances.map((appearance) => appearance.object),
    ...section.groups.map((group) => group.represents).filter(present),
  ];
}
/** Iterative traversal; bounded local state never escapes as mutable shared state. */
function unseen(id: string | undefined, seen: ReadonlySet<string>): id is string {
  return id !== undefined && !seen.has(id);
}
function ancestry(start: string | undefined, parentOf: (id: string) => string | undefined) {
  const seen = new Set<string>();
  let current = start;
  while (unseen(current, seen)) {
    seen.add(current);
    current = parentOf(current);
  }
  return { seen, cycle: current !== undefined };
}
export function hasCycle(start: string, parentOf: (id: string) => string | undefined): boolean {
  return ancestry(start, parentOf).cycle;
}
export function nestedIn(id: string | undefined, owner: string, section: Section): boolean {
  return ancestry(
    id,
    (current) => section.groups.find((group) => group.id === current)?.parent,
  ).seen.has(owner);
}
function parentReference(parent: string | undefined, section: Section, path: string) {
  if (!parent) return [];
  return required(
    section.groups.some((group) => group.id === parent),
    path,
  );
}
export function validateGroups(section: Section) {
  const path = `sections.${section.id}`;
  return [
    ...duplicates(section.groups, (group) => group.id, `${path}.groups`),
    ...duplicates(visibleObjects(section), (id) => id, `${path}.appearances`),
    ...section.appearances.flatMap((appearance) =>
      parentReference(appearance.group, section, `${path}.appearances.${appearance.object}.group`),
    ),
    ...section.groups.flatMap((group) => [
      ...parentReference(group.parent, section, `${path}.groups.${group.id}.parent`),
      ...issue(
        hasCycle(group.id, (id) => section.groups.find((group) => group.id === id)?.parent),
        'group',
        `${path}.groups.${group.id}`,
        'Group parent graph must be acyclic',
      ),
    ]),
  ];
}
