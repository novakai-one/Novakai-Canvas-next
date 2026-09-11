import type { ObjectId, RelationshipId } from '../../contract/brands.js';
import type { Collection } from '../../contract/records/collection.js';
import type { Change } from '../../contract/records/change.js';
import type { Section, WireAppearance } from '../../contract/records/section.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../invariants/issues.js';
import { clearRoute, clearSection } from './preservation.js';

type ViewChange = Extract<Change, { op: 'hide' | 'reset-layout' | 'reset-route' }>;

/** Hiding changes visibility, not canonical objects or relationships. */
function hideAppearance(
  section: Section,
  collection: Collection,
  objectId: ObjectId,
): Result<Section> {
  const hasOrdinaryAppearance = section.appearances.some(
    (appearance) => appearance.object === objectId,
  );
  if (!hasOrdinaryAppearance) {
    return failure(
      'not-found',
      `sections.${section.id}.appearances.${objectId}`,
      'Hide requires ordinary appearance',
    );
  }
  const incidentRelationships = collection.relationships.filter(
    (relationship) =>
      relationship.source.object === objectId || relationship.target.object === objectId,
  );
  const incidentIds = incidentRelationships.map((relationship) => relationship.id);
  const appearances = section.appearances.filter((appearance) => appearance.object !== objectId);
  const wires = section.wires.filter((wire) => !incidentIds.includes(wire.relationship));
  return success({ ...section, appearances, wires });
}

/** Leave every unrelated route untouched. */
function resetMatchingWire(wire: WireAppearance, relationshipId: RelationshipId): WireAppearance {
  if (wire.relationship !== relationshipId) return wire;
  return clearRoute(wire);
}

/** A reset targets a visible wire, even if it currently has no manual points. */
function resetVisibleRoute(section: Section, relationshipId: RelationshipId): Result<Section> {
  const routeExists = section.wires.some((wire) => wire.relationship === relationshipId);
  if (!routeExists)
    return failure(
      'not-found',
      `sections.${section.id}.wires.${relationshipId}`,
      'Route must be visible',
    );
  const wires = section.wires.map((wire) => resetMatchingWire(wire, relationshipId));
  return success({ ...section, wires });
}

/** The remaining union case is reset-layout, which clears all geometry in this section. */
function applySectionEdit(
  section: Section,
  collection: Collection,
  change: ViewChange,
): Result<Section> {
  if (change.op === 'hide') return hideAppearance(section, collection, change.object);
  if (change.op === 'reset-route') return resetVisibleRoute(section, change.relationship);
  return success(clearSection(section));
}

/** Preserve collection ordering when replacing the edited section. */
function replaceMatchingSection(section: Section, edited: Section): Section {
  if (section.id !== edited.id) return section;
  return edited;
}

/** A rejected section operation leaves the entire collection unchanged. */
function editExistingSection(
  section: Section,
  collection: Collection,
  change: ViewChange,
): Result<Collection> {
  const edited = applySectionEdit(section, collection, change);
  if (!edited.ok) return edited;
  const sections = collection.sections.map((item) => replaceMatchingSection(item, edited.value));
  return success({ ...collection, sections });
}

/**
 * Applies a visibility or geometry edit to one existing section. These explicit resets
 * bypass preservation, so a later replacement inherits the reset state. Pure snapshot
 * replay; planChanges validates the final collection and Authoring owns commit/recovery.
 */
export function editView(collection: Collection, change: ViewChange): Result<Collection> {
  const section = collection.sections.find((candidate) => candidate.id === change.section);
  if (section === undefined)
    return failure('not-found', `sections.${change.section}`, 'Section must exist');
  return editExistingSection(section, collection, change);
}
