import type { Diagnostic } from '../../contract/errors.js';
import type { Collection } from '../../contract/records/collection.js';
import type { LayoutIntent } from '../../contract/records/layout.js';
import type { Relationship, RelationshipKind } from '../../contract/records/relationship.js';
import type { Section, Mode } from '../../contract/records/section.js';
import { duplicates } from '../invariants/duplicates.js';
import { diagnoseWhen } from '../invariants/issues.js';
import { visibleObjects } from './groups.js';

const compatibleLayouts: Readonly<Record<Mode, readonly LayoutIntent['algorithm'][]>> = {
  flow: ['flow', 'layered'],
  state: ['flow', 'layered'],
  er: ['layered'],
  modules: ['layered'],
  tree: ['tree'],
  sequence: ['sequence'],
  story: ['grid'],
  grid: ['grid'],
};

// An absent entry permits any canonical relationship kind; an empty list permits none.
const compatibleWires: Readonly<Partial<Record<Mode, readonly RelationshipKind[]>>> = {
  er: ['association', 'reference'],
  modules: ['imports', 'calls', 'implements', 'contains', 'reference'],
  state: ['transition', 'reference'],
  tree: ['parent', 'reference'],
  sequence: [],
};

/** Resolve visible wires to canonical relationships; missing identities are diagnosed by views. */
export function visibleRelationships(
  section: Section,
  collection: Collection,
): readonly Relationship[] {
  return collection.relationships.filter((relationship) =>
    section.wires.some((wire) => wire.relationship === relationship.id),
  );
}

/** Flow decisions distinguish their outgoing flow branches by label within this section. */
function validateDecisionLabels(section: Section, collection: Collection): readonly Diagnostic[] {
  if (section.mode !== 'flow') return [];
  const visible = visibleObjects(section);
  const decisions = collection.objects.filter(
    (object) => object.kind === 'decision' && visible.includes(object.id),
  );
  const relationships = visibleRelationships(section, collection);
  return decisions.flatMap((decision) => {
    const outgoing = relationships.filter(
      (wire) => wire.kind === 'flow' && wire.source.object === decision.id,
    );
    return duplicates(
      outgoing,
      (wire) => wire.label,
      `sections.${section.id}.decision.${decision.id}`,
    );
  });
}

/** Root and participation flags carry tree semantics and must not leak into other modes. */
function validateTreeOnlyFields(section: Section): readonly Diagnostic[] {
  if (section.mode === 'tree') return [];
  const rootIssues = diagnoseWhen(
    section.root !== undefined,
    'mode',
    `sections.${section.id}.root`,
    'Root is tree-only',
  );
  const participationIssues = section.appearances.flatMap((appearance) =>
    diagnoseWhen(
      appearance.participation !== undefined,
      'mode',
      `sections.${section.id}.appearances.${appearance.object}`,
      'Participation is tree-only',
    ),
  );
  return [...rootIssues, ...participationIssues];
}

/** Unrestricted modes omit their policy entry instead of maintaining redundant allow-all lists. */
function isAllowedWire(kind: RelationshipKind, mode: Mode): boolean {
  const allowedKinds = compatibleWires[mode];
  if (allowedKinds === undefined) return true;
  return allowedKinds.includes(kind);
}

/** Section and nested-group algorithms must both support the selected diagram mode. */
function validateLayoutCompatibility(section: Section): readonly Diagnostic[] {
  const layouts = [section.layout, ...section.groups.map((group) => group.layout)];
  return layouts.flatMap((layout) =>
    diagnoseWhen(
      !compatibleLayouts[section.mode].includes(layout.algorithm),
      'mode',
      `sections.${section.id}.layout`,
      'Mode and layout must be compatible',
    ),
  );
}

/**
 * Enforces mode/layout/relationship compatibility and mode-specific field restrictions.
 * Pure diagnostic accumulation; Authoring owns correction and commit/recovery.
 */
export function validateModes(section: Section, collection: Collection): readonly Diagnostic[] {
  const path = `sections.${section.id}`;
  const layoutIssues = validateLayoutCompatibility(section);
  const wireIssues = visibleRelationships(section, collection).flatMap((wire) =>
    diagnoseWhen(
      !isAllowedWire(wire.kind, section.mode),
      'mode',
      `${path}.wires.${wire.id}`,
      'Wire kind is not legal in this mode',
    ),
  );
  const sequenceInWrongMode = section.mode !== 'sequence' && section.sequence.length > 0;
  const sequenceIssues = diagnoseWhen(
    sequenceInWrongMode,
    'mode',
    `${path}.sequence`,
    'Sequence items are sequence-only',
  );
  const treeFieldIssues = validateTreeOnlyFields(section);
  const decisionIssues = validateDecisionLabels(section, collection);
  return [...layoutIssues, ...wireIssues, ...sequenceIssues, ...treeFieldIssues, ...decisionIssues];
}
