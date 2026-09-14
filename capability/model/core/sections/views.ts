import type { Diagnostic } from '../../contract/errors.js';
import type { Collection } from '../../contract/records/collection.js';
import type { Section, WireAppearance } from '../../contract/records/section.js';
import { diagnoseWhen, referenceIssue } from '../invariants/issues.js';
import { duplicates } from '../invariants/duplicates.js';
import { validateGroups, visibleObjects } from './groups.js';
import { validateModes } from './modes.js';
import { validateTree } from './tree.js';
import { validateSequence } from './sequence.js';

type SectionRule = (section: Section, collection: Collection) => readonly Diagnostic[];

/** A visible wire requires a relationship and two visible endpoints; a locked route needs points. */
function validateWireAppearance(
  wire: WireAppearance,
  section: Section,
  collection: Collection,
): readonly Diagnostic[] {
  const relationship = collection.relationships.find(
    (candidate) => candidate.id === wire.relationship,
  );
  const path = `sections.${section.id}.wires.${wire.relationship}`;
  if (relationship === undefined) return referenceIssue(true, path);
  const visible = visibleObjects(section);
  const sourceIssues = referenceIssue(
    !visible.includes(relationship.source.object),
    `${path}.source`,
  );
  const targetIssues = referenceIssue(
    !visible.includes(relationship.target.object),
    `${path}.target`,
  );
  const lockWithoutPoints = wire.locked && wire.manual === undefined;
  const routeIssues = diagnoseWhen(
    lockWithoutPoints,
    'layout',
    path,
    'Locked route requires manual points',
  );
  return [...sourceIssues, ...targetIssues, ...routeIssues];
}

/** An omitted appearance role inherits the canonical role, already checked on the object. */
function validateRoleOverride(
  role: string | undefined,
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  if (role === undefined) return [];
  return referenceIssue(!collection.theme.roles.includes(role), path);
}

/** Visibility references resolve against canonical data; overrides remain local to this section. */
function validateViewReferences(section: Section, collection: Collection): readonly Diagnostic[] {
  const path = `sections.${section.id}`;
  const objectIssues = visibleObjects(section).flatMap((id) => {
    const objectExists = collection.objects.some((object) => object.id === id);
    return referenceIssue(!objectExists, `${path}.appearances.${id}`);
  });
  const roleIssues = section.appearances.flatMap((appearance) =>
    validateRoleOverride(
      appearance.role,
      collection,
      `${path}.appearances.${appearance.object}.role`,
    ),
  );
  const duplicateWires = duplicates(section.wires, (wire) => wire.relationship, `${path}.wires`);
  const wireIssues = section.wires.flatMap((wire) =>
    validateWireAppearance(wire, section, collection),
  );
  return [...objectIssues, ...roleIssues, ...duplicateWires, ...wireIssues];
}

const sectionRules: readonly SectionRule[] = [
  validateViewReferences,
  validateModes,
  validateTree,
  validateSequence,
];

/** Group validity is checked before mode-specific rules, but all failures are accumulated. */
function validateSection(section: Section, collection: Collection): readonly Diagnostic[] {
  const groupIssues = validateGroups(section);
  const viewIssues = sectionRules.flatMap((rule) => rule(section, collection));
  return [...groupIssues, ...viewIssues];
}

/**
 * Validates each diagram view independently against its shared collection records.
 * Returns all topology, visibility and mode failures. Pure replay; Authoring owns
 * correction, admission, commit and crash recovery. No layout or rendering is performed.
 */
export function validateSections(collection: Collection): readonly Diagnostic[] {
  return collection.sections.flatMap((section) => validateSection(section, collection));
}
