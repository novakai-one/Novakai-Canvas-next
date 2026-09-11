import type { ObjectId } from '../../contract/brands.js';
import type { Diagnostic } from '../../contract/errors.js';
import type { Collection } from '../../contract/records/collection.js';
import type { Relationship } from '../../contract/records/relationship.js';
import type { Section } from '../../contract/records/section.js';
import { diagnoseWhen } from '../invariants/issues.js';
import { hasCycle, visibleObjects } from './groups.js';
import { visibleRelationships } from './modes.js';

/** Explicit participation wins. Without it, notes annotate the tree and other objects participate. */
function participatesInTree(id: ObjectId, section: Section, collection: Collection): boolean {
  const appearance = section.appearances.find((candidate) => candidate.object === id);
  if (appearance?.participation !== undefined) return appearance.participation === 'tree';
  const object = collection.objects.find((candidate) => candidate.id === id);
  return object?.kind !== 'note';
}

/** Empty trees have no root; nonempty trees must explicitly name one of their participants. */
function validateRoot(participants: readonly ObjectId[], section: Section): readonly Diagnostic[] {
  const path = `sections.${section.id}.root`;
  if (participants.length === 0)
    return diagnoseWhen(section.root !== undefined, 'tree', path, 'Empty tree has no root');
  const rootIsParticipant = participants.some((id) => id === section.root);
  return diagnoseWhen(
    !rootIsParticipant,
    'tree',
    path,
    'Tree root must be an explicit participant',
  );
}

/** Tree annotations can have reference wires, but cannot be endpoints of parent edges. */
function validateParentEdge(
  wire: Relationship,
  participants: readonly ObjectId[],
  section: Section,
): readonly Diagnostic[] {
  const sourceParticipates = participants.includes(wire.source.object);
  const targetParticipates = participants.includes(wire.target.object);
  return diagnoseWhen(
    !sourceParticipates || !targetParticipates,
    'tree',
    `sections.${section.id}.wires.${wire.id}`,
    'Parent edge must connect tree participants',
  );
}

/** The root has no parent; every other participant must have exactly one. */
function expectedParentCount(id: ObjectId, section: Section): number {
  if (id === section.root) return 0;
  return 1;
}

/** A missing edge terminates traversal; excess parents are diagnosed by their count. */
function firstParent(id: ObjectId, parents: readonly Relationship[]): ObjectId | undefined {
  const edge = parents.find((wire) => wire.target.object === id);
  return edge?.source.object;
}

/** Parent counts distinguish the root from every nonroot participant. */
function validateParentCount(
  id: ObjectId,
  parents: readonly Relationship[],
  section: Section,
): readonly Diagnostic[] {
  const actualCount = parents.filter((wire) => wire.target.object === id).length;
  return diagnoseWhen(
    actualCount !== expectedParentCount(id, section),
    'tree',
    `sections.${section.id}.appearances.${id}`,
    'Root has zero parents; every other participant exactly one',
  );
}

/** With valid counts, rejecting cycles ensures every participant reaches the explicit root. */
function validateAncestry(
  id: ObjectId,
  parents: readonly Relationship[],
  section: Section,
): readonly Diagnostic[] {
  const cycleExists = hasCycle(id, (current) => firstParent(current, parents));
  return diagnoseWhen(
    cycleExists,
    'tree',
    `sections.${section.id}.appearances.${id}`,
    'Parent graph must be acyclic and rooted',
  );
}

/**
 * Validates a rooted parent graph over the participating visible objects in a tree view.
 * Other modes are ignored. Pure diagnostic accumulation; Authoring owns correction and
 * commit/recovery. Layout and annotation placement are outside this validator.
 */
export function validateTree(section: Section, collection: Collection): readonly Diagnostic[] {
  if (section.mode !== 'tree') return [];
  const participants = visibleObjects(section).filter((id) =>
    participatesInTree(id, section, collection),
  );
  const parents = visibleRelationships(section, collection).filter(
    (wire) => wire.kind === 'parent',
  );
  const rootIssues = validateRoot(participants, section);
  const edgeIssues = parents.flatMap((wire) => validateParentEdge(wire, participants, section));
  const countIssues = participants.flatMap((id) => validateParentCount(id, parents, section));
  const cycleIssues = participants.flatMap((id) => validateAncestry(id, parents, section));
  return [...rootIssues, ...edgeIssues, ...countIssues, ...cycleIssues];
}
