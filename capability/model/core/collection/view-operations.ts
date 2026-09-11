import type { ObjectId } from '../../contract/brands.js';
import type { Collection } from '../../contract/records/collection.js';
import type { Change } from '../../contract/records/change.js';
import type { Section } from '../../contract/records/section.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../invariants/issues.js';
import { clearRoute, clearSection } from './preservation.js';
type ViewChange = Extract<Change, { op: 'hide' | 'reset-layout' | 'reset-route' }>;
function hide(section: Section, collection: Collection, object: ObjectId): Result<Section> {
  if (!section.appearances.some((appearance) => appearance.object === object))
    return failure(
      'not-found',
      `sections.${section.id}.appearances.${object}`,
      'Hide requires ordinary appearance',
    );
  const incident = collection.relationships
    .filter((relationship) =>
      [relationship.source.object, relationship.target.object].includes(object),
    )
    .map((relationship) => relationship.id);
  return success({
    ...section,
    appearances: section.appearances.filter((appearance) => appearance.object !== object),
    wires: section.wires.filter((wire) => !incident.includes(wire.relationship)),
  });
}
function resetRoute(section: Section, relationship: string): Result<Section> {
  if (!section.wires.some((wire) => wire.relationship === relationship))
    return failure(
      'not-found',
      `sections.${section.id}.wires.${relationship}`,
      'Route must be visible',
    );
  return success({
    ...section,
    wires: section.wires.map((wire) =>
      wire.relationship === relationship ? clearRoute(wire) : wire,
    ),
  });
}
function edit(section: Section, collection: Collection, change: ViewChange): Result<Section> {
  if (change.op === 'hide') return hide(section, collection, change.object);
  if (change.op === 'reset-route') return resetRoute(section, change.relationship);
  return success(clearSection(section));
}
function editExisting(
  section: Section,
  collection: Collection,
  change: ViewChange,
): Result<Collection> {
  const result = edit(section, collection, change);
  if (!result.ok) return result;
  return success({
    ...collection,
    sections: collection.sections.map((item) => (item.id === section.id ? result.value : item)),
  });
}
export function editView(collection: Collection, change: ViewChange): Result<Collection> {
  const section = collection.sections.find((section) => section.id === change.section);
  if (!section) return failure('not-found', `sections.${change.section}`, 'Section must exist');
  return editExisting(section, collection, change);
}
