import type { Collection } from '../../contract/records/artifact.js';
import type { ManualSnapshot, ManualSection } from '../../contract/records/manual.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
import { success } from '../validation/outcomes.js';
import { restoreOrder, validOrder } from './order.js';
type Section = Collection['sections'][number];
/** Capture only stored overrides; automatic geometry belongs to Layout. Pure replay; Authoring owns import recovery. */
export function captureManual(collection: Collection): ManualSnapshot {
  return { schemaVersion: 1, sections: collection.sections.map(captureSection) };
}
/** Omitted placement stays omitted; route attachment decisions are retained even without bend points. */
function captureSection(section: Section): ManualSection {
  const record: ManualSection = {
    id: section.id,
    appearanceOrder: section.appearances.map((item) => item.object),
    groupOrder: section.groups.map((item) => item.id),
    sequenceOrder: section.sequence.map((item) => ({ id: item.id, order: item.order })),
    appearances: section.appearances.flatMap((item) => placedAppearance(item)),
    groups: section.groups.flatMap((item) => placedGroup(item)),
    wires: section.wires.map(captureWire),
  };
  if (section.placement) return { ...record, placement: section.placement };
  return record;
}
/** Transfer geometry contains no semantic appearance attributes. */
function placedAppearance(item: Section['appearances'][number]): ManualSection['appearances'] {
  if (!item.placement) return [];
  return [{ object: item.object, placement: item.placement }];
}
/** Group identity is local to its section, independent of a represented object. */
function placedGroup(item: Section['groups'][number]): ManualSection['groups'] {
  if (!item.placement) return [];
  return [{ id: item.id, placement: item.placement }];
}
/** Validate every target first; a rejected overlay exposes no partial candidate. Authoring owns recovery; retry is safe. */
export function overlayManual(collection: Collection, manual: ManualSnapshot): Result<unknown> {
  const invalid = validateTargets(collection, manual);
  if (!invalid.ok) return invalid;
  const sections = collection.sections.map((section) =>
    overlaySection(
      section,
      manual.sections.find((item) => item.id === section.id),
    ),
  );
  return success({ ...collection, sections });
}
/** Duplicate namespaces and unknown targets cannot be silently ignored by map/find. */
function validateTargets(collection: Collection, manual: ManualSnapshot): Result<void> {
  if (
    !validIds(
      manual.sections.map((section) => section.id),
      collection.sections.map((section) => section.id),
    )
  )
    return failure('invalid-import', 'manual.sections', 'Unknown or duplicate section override');
  const valid = manual.sections.every((section) => validSection(collection, section));
  if (!valid) return failure('invalid-import', 'manual', 'Unknown or duplicate manual target');
  return success(undefined);
}
/** An empty override list is valid; every provided entry must resolve exactly once. */
function validIds(actual: readonly string[], allowed: readonly string[]): boolean {
  return new Set(actual).size === actual.length && actual.every((id) => allowed.includes(id));
}
/** Coordinate shapes were parsed at the envelope; this step checks domain addresses only. */
function validSection(collection: Collection, manual: ManualSection): boolean {
  const section = collection.sections.find((item) => item.id === manual.id);
  if (!section) return false;
  const checks = [
    validOrder(section, manual),
    validIds(
      manual.appearances.map((item) => item.object),
      section.appearances.map((item) => item.object),
    ),
    validIds(
      manual.groups.map((item) => item.id),
      section.groups.map((item) => item.id),
    ),
    validIds(
      manual.wires.map((item) => item.relationship),
      section.wires.map((item) => item.relationship),
    ),
  ];
  return checks.every(Boolean);
}
/** Only supplied overrides replace stored fields. Semantic structure always comes from Language. */
function overlaySection(section: Section, manual: ManualSection | undefined): unknown {
  if (!manual) return section;
  const ordered = restoreOrder(section, manual);
  const next = {
    ...ordered,
    appearances: ordered.appearances.map((item) => ({
      ...item,
      ...manual.appearances.find((override) => override.object === item.object),
    })),
    groups: ordered.groups.map((item) => ({
      ...item,
      ...manual.groups.find((override) => override.id === item.id),
    })),
    wires: section.wires.map((item) => ({
      ...item,
      ...manual.wires.find((override) => override.relationship === item.relationship),
    })),
  };
  if (manual.placement) return { ...next, placement: manual.placement };
  return next;
}

/** Route shape remains semantic DSL; the sidecar retains only explicit attachment and manual state. */
function captureWire(item: Section['wires'][number]): ManualSection['wires'][number] {
  const record = {
    relationship: item.relationship,
    locked: item.locked,
    sourceSide: item.sourceSide,
    targetSide: item.targetSide,
  };
  if (item.manual) return { ...record, manual: [...item.manual] };
  return record;
}
