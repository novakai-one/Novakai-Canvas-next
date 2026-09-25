/*
 * Releasing a section for rearrangement: the selected node takes its requested placement, its
 * closure keeps source-relative placements, and everything else is unpinned so the native reflow
 * can move it.
 */
import type { RenderDocument, Section } from '../../../contract/records/owners.js';
import type { Result } from '../../../contract/errors.js';
import { changes } from '../capture/settling.js';
import { pinnedSections, sourcePlacement } from '../capture/pinning.js';
import { parentNode } from '../capture/scene.js';
import type { SceneNode, SceneSection } from '../capture/scene.js';
import type { RearrangementPreparation, ReleasedCandidate } from './types.js';

/** Release every section's placements implied by the intent; only the target section changes. */
export function releaseRearrangement(
  prepared: RearrangementPreparation,
  document: RenderDocument,
): Result<ReleasedCandidate> {
  const frozen = pinnedSections(document, prepared.intent);
  if (!frozen.ok) return frozen;
  const candidate = frozen.value.map((section) => releaseSection(section, prepared));
  const releasedChanges = changes(document, candidate);
  return { ok: true, value: { sections: candidate, changes: releasedChanges } };
}

/** Other sections pass through; the target section's groups and appearances are released. */
function releaseSection(
  section: Section,
  prepared: RearrangementPreparation,
): Section {
  if (section.id !== prepared.sectionId) return section;
  return {
    ...section,
    groups: section.groups.map((group) => releaseGroup(group, prepared)),
    appearances: section.appearances.map((appearance) => releaseAppearance(appearance, prepared)),
  };
}

/** Release one group's placement from its measured scene node. */
function releaseGroup(
  group: Section['groups'][number],
  prepared: RearrangementPreparation,
): Section['groups'][number] {
  const node = prepared.scene.nodes.find((item) => item.measured.groupId === group.id);
  if (node === undefined) throw new Error('captured rearrangement group missing');
  const parent = parentNode(prepared.scene, node);
  return releaseGroupPlacement(group, node, parent, prepared);
}

/** The selected group takes the requested placement; its closure keeps source positions. */
function releaseGroupPlacement(
  group: Section['groups'][number],
  node: SceneNode,
  parent: SceneNode | undefined,
  prepared: RearrangementPreparation,
): Section['groups'][number] {
  if (node.measured.groupId === prepared.selectedGroupId)
    return selectedGroupPlacement(group, node, prepared);
  return isInSelectedClosure(node, prepared)
    ? {
        ...group,
        placement: sourcePlacement(
          group.placement,
          node.box.x - (parent?.box.x ?? 0),
          node.box.y - (parent?.box.y ?? 0),
          node.box.width,
          node.box.height,
        ),
      }
    : { ...group, placement: undefined };
}

/** The selected group is placed where the intent asks. */
function selectedGroupPlacement(
  group: Section['groups'][number],
  node: SceneNode,
  prepared: RearrangementPreparation,
): Section['groups'][number] {
  return {
    ...group,
    placement: sourcePlacement(
      group.placement,
      prepared.entry.placement.x,
      prepared.entry.placement.y,
      node.box.width,
      node.box.height,
    ),
  };
}

/** Release one appearance's placement from its measured scene node. */
function releaseAppearance(
  appearance: Section['appearances'][number],
  prepared: RearrangementPreparation,
): Section['appearances'][number] {
  const node = prepared.scene.nodes.find(
    (item) => item.measured.groupId === null && item.measured.objectId === appearance.object,
  );
  if (node === undefined) throw new Error('captured rearrangement appearance missing');
  const parent = parentNode(prepared.scene, node);
  return releaseAppearancePlacement(appearance, node, parent, prepared);
}

/** An ungrouped selected node is placed by the intent; every other appearance is preserved. */
function releaseAppearancePlacement(
  appearance: Section['appearances'][number],
  node: SceneNode,
  parent: SceneNode | undefined,
  prepared: RearrangementPreparation,
): Section['appearances'][number] {
  return node.id === prepared.selected.id && prepared.selectedGroupId === null
    ? selectedAppearancePlacement(appearance, node, prepared)
    : preservedAppearancePlacement(appearance, node, parent, prepared);
}

/** The selected node's appearance is placed where the intent asks. */
function selectedAppearancePlacement(
  appearance: Section['appearances'][number],
  node: SceneNode,
  prepared: RearrangementPreparation,
): Section['appearances'][number] {
  return {
    ...appearance,
    placement: sourcePlacement(
      appearance.placement,
      prepared.entry.placement.x,
      prepared.entry.placement.y,
      node.box.width,
      node.box.height,
    ),
  };
}

/** Closure members keep source-relative placements; outsiders are unpinned for the reflow. */
function preservedAppearancePlacement(
  appearance: Section['appearances'][number],
  node: SceneNode,
  parent: SceneNode | undefined,
  prepared: RearrangementPreparation,
): Section['appearances'][number] {
  return isInSelectedClosure(node, prepared) || prepared.ancestors.has(node.parent ?? '')
    ? {
        ...appearance,
        placement: sourcePlacement(
          appearance.placement,
          node.box.x - (parent?.box.x ?? 0),
          node.box.y - (parent?.box.y ?? 0),
          node.box.width,
          node.box.height,
        ),
      }
    : { ...appearance, placement: undefined };
}

/** A node is in the closure when it is the selected node, an ancestor, or below the selected one. */
function isInSelectedClosure(
  node: SceneNode,
  prepared: RearrangementPreparation,
): boolean {
  if (node.id === prepared.selected.id || prepared.ancestors.has(node.id)) return true;
  return hasSelectedAncestor(prepared.scene, node.parent, prepared.selected.id);
}

/** Walk the parent chain looking for the selected node. */
function hasSelectedAncestor(
  scene: SceneSection,
  initial: string | null,
  selected: string,
): boolean {
  let current = initial;
  let found = false;
  while (current !== null && !found) {
    found = current === selected;
    current = scene.nodes.find((item) => item.id === current)?.parent ?? null;
  }
  return found;
}
