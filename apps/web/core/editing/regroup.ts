import type {
  Appearance,
  RegroupIntent,
  RenderDocument,
  Section,
  Target,
} from '../../contract/records/owners.js';
import { missing, nodeFor, sectionFor } from './targets.js';

type GroupId = Section['groups'][number]['id'];
/** A section target means "no group"; a group node target names one of this section's groups. */
function groupOf(into: Target, section: Section, document: RenderDocument): GroupId | undefined {
  if (into.kind === 'section') return undefined;
  const id = nodeFor(into, document).measured.groupId;
  return section.groups.find((group) => group.id === id)?.id ?? missing(into.id);
}
function withGroup(appearance: Appearance, group: GroupId | undefined): Appearance {
  const rest = { ...appearance };
  delete rest.group;
  return group === undefined ? rest : { ...rest, group };
}
/** Move one appearance into another group (or out of all groups), placed local to that group. */
export function regroupSections(
  intent: RegroupIntent,
  document: RenderDocument,
): readonly Section[] {
  const section = sectionFor(intent.target, document.collection.sections);
  const object = nodeFor(intent.target, document).measured.objectId;
  const current =
    section.appearances.find((item) => item.object === object) ?? missing(String(object));
  const placement = { ...current.placement, ...intent.placement };
  const moved = withGroup({ ...current, placement }, groupOf(intent.into, section, document));
  const changed = {
    ...section,
    appearances: section.appearances.map((item) => (item === current ? moved : item)),
  };
  return document.collection.sections.map((item) => (item.id === changed.id ? changed : item));
}
