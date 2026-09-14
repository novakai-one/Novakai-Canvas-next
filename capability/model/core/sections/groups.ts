import type { GroupId, ObjectId } from '../../contract/brands.js';
import type { Diagnostic } from '../../contract/errors.js';
import type { Section, Group } from '../../contract/records/section.js';
import { diagnoseWhen, referenceIssue } from '../invariants/issues.js';
import { duplicates } from '../invariants/duplicates.js';

/**
 * Lists visible canonical object IDs from ordinary appearances and representing groups.
 * Duplicates are intentionally retained for validation. Pure replay; Authoring owns commits.
 */
export function visibleObjects(section: Section): readonly ObjectId[] {
  const ordinaryObjects = section.appearances.map((appearance) => appearance.object);
  const representedObjects = section.groups
    .map((group) => group.represents)
    .filter((id) => id !== undefined);
  return [...ordinaryObjects, ...representedObjects];
}

interface Ancestry<Id extends string> {
  readonly visited: ReadonlySet<Id>;
  readonly hasCycle: boolean;
}

/** Stop at a missing parent or an already visited identity; each traversal is locally bounded. */
function canVisit<Id extends string>(id: Id | undefined, visited: ReadonlySet<Id>): id is Id {
  return id !== undefined && !visited.has(id);
}

/** Walk parent links without recursion. Local cursor/set mutation never reaches diagram records. */
function traceAncestors<Id extends string>(
  start: Id | undefined,
  parentOf: (id: Id) => Id | undefined,
): Ancestry<Id> {
  const visited = new Set<Id>();
  let current = start;
  while (canVisit(current, visited)) {
    visited.add(current);
    current = parentOf(current);
  }
  return { visited, hasCycle: current !== undefined };
}

/** Missing parents terminate traversal; repeating any identity signals a containment cycle. */
export function hasCycle<Id extends string>(
  start: Id,
  parentOf: (id: Id) => Id | undefined,
): boolean {
  return traceAncestors(start, parentOf).hasCycle;
}

/** An absent parent means top-level membership; a missing group reference is diagnosed separately. */
function parentGroup(id: GroupId, section: Section): GroupId | undefined {
  const group = section.groups.find((candidate) => candidate.id === id);
  return group?.parent;
}

/** True when membership starts at the owner or reaches it through any parent group. */
export function nestedIn(
  parentId: GroupId | undefined,
  ownerId: GroupId,
  section: Section,
): boolean {
  const ancestry = traceAncestors(parentId, (id) => parentGroup(id, section));
  return ancestry.visited.has(ownerId);
}

/** Omitted parent means top-level membership, so it is not an unresolved reference. */
function validateParentReference(
  parentId: GroupId | undefined,
  section: Section,
  path: string,
): readonly Diagnostic[] {
  if (parentId === undefined) return [];
  const parentExists = section.groups.some((group) => group.id === parentId);
  return referenceIssue(!parentExists, path);
}

/** Resolve the immediate parent and separately reject cycles through the parent chain. */
function validateGroupAncestry(
  group: Group,
  section: Section,
  path: string,
): readonly Diagnostic[] {
  const parentIssues = validateParentReference(group.parent, section, `${path}.parent`);
  const cycleExists = hasCycle(group.id, (id) => parentGroup(id, section));
  const cycleIssues = diagnoseWhen(
    cycleExists,
    'group',
    path,
    'Group parent graph must be acyclic',
  );
  return [...parentIssues, ...cycleIssues];
}

/**
 * Validates section-local group identities, unique object representation and parent topology.
 * Returns every failure without changing records. Pure replay; validate/plan expose diagnostics
 * and Authoring owns correction, commit and crash recovery.
 */
export function validateGroups(section: Section): readonly Diagnostic[] {
  const path = `sections.${section.id}`;
  const groupIdentities = duplicates(section.groups, (group) => group.id, `${path}.groups`);
  const appearanceIdentities = duplicates(
    visibleObjects(section),
    (id) => id,
    `${path}.appearances`,
  );
  const memberships = section.appearances.flatMap((appearance) =>
    validateParentReference(
      appearance.group,
      section,
      `${path}.appearances.${appearance.object}.group`,
    ),
  );
  const ancestry = section.groups.flatMap((group) =>
    validateGroupAncestry(group, section, `${path}.groups.${group.id}`),
  );
  return [...groupIdentities, ...appearanceIdentities, ...memberships, ...ancestry];
}
