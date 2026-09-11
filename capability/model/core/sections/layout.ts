import type { Collection } from '../../contract/records/collection.js';
import type { LayoutIntent, LayoutTarget } from '../../contract/records/layout.js';
import type { Section } from '../../contract/records/section.js';
import { duplicates, issue, required } from '../invariants/issues.js';
import { nestedIn, visibleObjects } from './groups.js';
function shape(layout: LayoutIntent, path: string) {
  return layout.constraints.flatMap((constraint, index) => [
    ...duplicates(
      constraint.targets,
      (target) => `${target.kind}:${target.id}`,
      `${path}.constraints.${index}`,
    ),
    ...issue(
      ['before', 'below'].includes(constraint.kind) && constraint.targets.length !== 2,
      'layout',
      `${path}.constraints.${index}`,
      'before/below need exactly two targets',
    ),
  ]);
}
function visible(target: LayoutTarget, section: Section) {
  if (target.kind === 'object') return visibleObjects(section).includes(target.id);
  return target.kind === 'group' && section.groups.some((group) => group.id === target.id);
}
function inGroup(target: LayoutTarget, section: Section, owner: string) {
  if (target.kind === 'group')
    return nestedIn(section.groups.find((group) => group.id === target.id)?.parent, owner, section);
  const represented = section.groups.find((group) => group.represents === target.id);
  const parent =
    section.appearances.find((appearance) => appearance.object === target.id)?.group ??
    represented?.parent;
  return nestedIn(parent, owner, section);
}
function local(layout: LayoutIntent, section: Section, path: string, owner?: string) {
  const targets = layout.constraints.flatMap((constraint) => constraint.targets);
  return [
    ...shape(layout, path),
    ...targets.flatMap((target) => required(visible(target, section), `${path}.${target.id}`)),
    ...ownedTargets(targets, section, path, owner),
  ];
}
function ownedTargets(
  targets: readonly LayoutTarget[],
  section: Section,
  path: string,
  owner?: string,
) {
  if (!owner) return [];
  return targets.flatMap((target) =>
    issue(
      !inGroup(target, section, owner),
      'layout',
      `${path}.${target.id}`,
      'Group constraints must address descendants',
    ),
  );
}
export function validateLayouts(collection: Collection) {
  return [
    ...shape(collection.arrangement, 'arrangement'),
    ...collection.arrangement.constraints.flatMap((constraint) =>
      constraint.targets.flatMap((target) =>
        required(
          target.kind === 'section' &&
            collection.sections.some((section) => section.id === target.id),
          `arrangement.${target.id}`,
        ),
      ),
    ),
    ...collection.sections.flatMap((section) => [
      ...local(section.layout, section, `sections.${section.id}.layout`),
      ...section.groups.flatMap((group) =>
        local(group.layout, section, `sections.${section.id}.groups.${group.id}.layout`, group.id),
      ),
    ]),
  ];
}
