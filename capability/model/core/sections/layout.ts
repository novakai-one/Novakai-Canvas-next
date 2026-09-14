import type { GroupId } from '../../contract/brands.js';
import type { Diagnostic } from '../../contract/errors.js';
import type { Collection } from '../../contract/records/collection.js';
import type {
  LayoutIntent,
  LayoutTarget,
  LayoutConstraint,
} from '../../contract/records/layout.js';
import type { Section } from '../../contract/records/section.js';
import { diagnoseWhen, referenceIssue } from '../invariants/issues.js';
import { duplicates } from '../invariants/duplicates.js';
import { nestedIn, visibleObjects } from './groups.js';

/** before/below order a pair; rank/align can address two or more unique targets. */
function validateConstraint(constraint: LayoutConstraint, path: string): readonly Diagnostic[] {
  const duplicateTargets = duplicates(
    constraint.targets,
    (target) => `${target.kind}:${target.id}`,
    path,
  );
  const requiresPair = constraint.kind === 'before' || constraint.kind === 'below';
  const wrongArity = requiresPair && constraint.targets.length !== 2;
  const arityIssues = diagnoseWhen(
    wrongArity,
    'layout',
    path,
    'before/below need exactly two targets',
  );
  return [...duplicateTargets, ...arityIssues];
}

/** Structural constraint rules apply equally to collection, section and group layouts. */
function validateConstraintShapes(layout: LayoutIntent, path: string): readonly Diagnostic[] {
  const columnIssues = diagnoseWhen(
    layout.columns !== undefined && layout.algorithm !== 'grid',
    'layout',
    `${path}.columns`,
    'Columns require grid layout',
  );
  const constraints = layout.constraints.flatMap((constraint, index): readonly Diagnostic[] =>
    validateConstraint(constraint, `${path}.constraints.${index}`),
  );
  return [...columnIssues, ...constraints];
}

/** A section constraint may address its visible objects or groups, never another section. */
function isVisibleTarget(target: LayoutTarget, section: Section): boolean {
  if (target.kind === 'object') return visibleObjects(section).includes(target.id);
  return target.kind === 'group' && section.groups.some((group) => group.id === target.id);
}

/** Prefer ordinary membership; a represented object derives membership from its container's parent. */
function targetParent(target: LayoutTarget, section: Section): GroupId | undefined {
  if (target.kind === 'group') {
    const group = section.groups.find((candidate) => candidate.id === target.id);
    return group?.parent;
  }
  const appearance = section.appearances.find((candidate) => candidate.object === target.id);
  if (appearance?.group !== undefined) return appearance.group;
  const representation = section.groups.find((group) => group.represents === target.id);
  return representation?.parent;
}

/** Group-owned constraints may address descendants, not the owning group or unrelated peers. */
function validateGroupScope(
  targets: readonly LayoutTarget[],
  section: Section,
  path: string,
  ownerId: GroupId | undefined,
): readonly Diagnostic[] {
  if (ownerId === undefined) return [];
  return targets.flatMap((target) => {
    const parentId = targetParent(target, section);
    const isDescendant = nestedIn(parentId, ownerId, section);
    return diagnoseWhen(
      !isDescendant,
      'layout',
      `${path}.${target.id}`,
      'Group constraints must address descendants',
    );
  });
}

/** Resolve references in the containing section, then apply optional group ownership restrictions. */
function validateLocalLayout(
  layout: LayoutIntent,
  section: Section,
  path: string,
  ownerId?: GroupId,
): readonly Diagnostic[] {
  const shapeIssues = validateConstraintShapes(layout, path);
  const targets = layout.constraints.flatMap((constraint) => constraint.targets);
  const targetIssues = targets.flatMap((target) =>
    referenceIssue(!isVisibleTarget(target, section), `${path}.${target.id}`),
  );
  const scopeIssues = validateGroupScope(targets, section, path, ownerId);
  return [...shapeIssues, ...targetIssues, ...scopeIssues];
}

/** Collection arrangement addresses section IDs only, in collection scope. */
function validateArrangement(collection: Collection): readonly Diagnostic[] {
  const shapeIssues = validateConstraintShapes(collection.arrangement, 'arrangement');
  const targets = collection.arrangement.constraints.flatMap((constraint) => constraint.targets);
  const targetIssues = targets.flatMap((target) => {
    const sectionExists =
      target.kind === 'section' && collection.sections.some((section) => section.id === target.id);
    return referenceIssue(!sectionExists, `arrangement.${target.id}`);
  });
  return [...shapeIssues, ...targetIssues];
}

/** Each group has its own descendant scope while sharing the section's visibility set. */
function validateSectionLayouts(section: Section): readonly Diagnostic[] {
  const path = `sections.${section.id}`;
  const sectionIssues = validateLocalLayout(section.layout, section, `${path}.layout`);
  const groupIssues = section.groups.flatMap((group) =>
    validateLocalLayout(group.layout, section, `${path}.groups.${group.id}.layout`, group.id),
  );
  return [...sectionIssues, ...groupIssues];
}

/**
 * Validates semantic constraint shape and scope at every layout level; computes no geometry.
 * Failures accumulate without mutation. Pure replay; Authoring owns correction and commit/recovery.
 */
export function validateLayouts(collection: Collection): readonly Diagnostic[] {
  const arrangementIssues = validateArrangement(collection);
  const sectionIssues = collection.sections.flatMap(validateSectionLayouts);
  return [...arrangementIssues, ...sectionIssues];
}
