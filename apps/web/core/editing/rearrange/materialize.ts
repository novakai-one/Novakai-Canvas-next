/*
 * Materializing an accepted rearrangement: placements are rewritten from the native preview's
 * geometry and the preview is run a second time. The option is offered only when both previews
 * agree on the final geometry. Geometry the preview omits is an `invalid-edit` failure, never
 * a throw.
 */
import type { Section } from '../../../contract/records/owners.js';
import type { Result } from '../../../contract/errors.js';
import type { MoveOption } from '../../../contract/records/movement.js';
import { failure } from '../../../contract/errors.js';
import { mapResults } from '../results.js';
import { changes } from '../capture/settling.js';
import { sourcePlacement } from '../capture/pinning.js';
import { exactBox, targetKey, type Box } from '../capture/boxes.js';
import type { SceneNode } from '../capture/scene.js';
import { completePreview } from '../movement-preview.js';
import { closureGeometryMatches, otherSectionMatches } from './matching.js';
import type {
  MaterializedCandidate,
  MaterializedPreview,
  RearrangementPreparation,
  SectionAppearance,
  SectionGroup,
} from './types.js';

/** A node's own preview box and its parent's frame box. */
type PreviewFrames = {
  readonly box: Box;
  readonly parentBox: Box;
};

/**
 * Rewrite placements from the first preview, then verify the result with a second preview.
 *
 * A captured node missing from the scene is `stale-target`; a preview that omits required
 * geometry is `invalid-edit`.
 */
export function materializeRearrangement(input: MaterializedCandidate): Result<MoveOption | null> {
  const finalSections = mapResults(input.candidate, (section) =>
    materializeSection(section, input.prepared, input.firstPreview),
  );
  if (!finalSections.ok) return finalSections;
  const finalChanges = changes(input.context.document, finalSections.value);
  return previewMaterializedRearrangement({ ...input, finalChanges });
}

/** Rewrite the target section's placement and contents from the preview boxes. */
function materializeSection(
  section: Section,
  prepared: RearrangementPreparation,
  firstPreview: MoveOption['preview'],
): Result<Section> {
  if (section.id !== prepared.sectionId) return { ok: true, value: section };
  const sectionBox = findSectionPreviewBox(firstPreview, prepared.sectionId);
  return sectionBox.ok
    ? materializeContents(section, prepared, firstPreview, sectionBox.value)
    : sectionBox;
}

/** Rewrite the section's groups and appearances against its preview box. */
function materializeContents(
  section: Section,
  prepared: RearrangementPreparation,
  firstPreview: MoveOption['preview'],
  sectionBox: Box,
): Result<Section> {
  const groups = mapResults(section.groups, (group) =>
    materializeGroup(group, prepared, firstPreview, sectionBox),
  );
  if (!groups.ok) return groups;
  const appearances = mapResults(section.appearances, (appearance) =>
    materializeAppearance(appearance, prepared, firstPreview, sectionBox),
  );
  return appearances.ok
    ? {
        ok: true,
        value: materializedSection(section, prepared, sectionBox, groups.value, appearances.value),
      }
    : appearances;
}

/** The section with its origin placement and every group and appearance rewritten. */
function materializedSection(
  section: Section,
  prepared: RearrangementPreparation,
  sectionBox: Box,
  groups: readonly SectionGroup[],
  appearances: readonly SectionAppearance[],
): Section {
  const placement = sourcePlacement(
    section.placement,
    prepared.scene.origin.x,
    prepared.scene.origin.y,
    sectionBox.width,
    sectionBox.height,
  );
  return { ...section, placement, groups, appearances };
}

/** The section's own box in the preview; the preview must cover it. */
function findSectionPreviewBox(
  preview: MoveOption['preview'],
  sectionId: string,
): Result<Box> {
  const box = preview.boxes.find(
    (item) => item.target.kind === 'section' && item.target.id === sectionId,
  )?.box;
  return box === undefined
    ? failure('invalid-edit', 'Rearrangement native preview omitted the section geometry')
    : { ok: true, value: box };
}

/** Rewrite one group's placement relative to its parent's preview box. */
function materializeGroup(
  group: SectionGroup,
  prepared: RearrangementPreparation,
  preview: MoveOption['preview'],
  sectionBox: Box,
): Result<SectionGroup> {
  const node = prepared.scene.nodes.find((item) => item.measured.groupId === group.id);
  if (node === undefined)
    return failure('stale-target', 'The rearrangement scene is missing a captured group');
  const frames = previewFrames(preview, prepared.sectionId, node, sectionBox);
  return frames.ok
    ? { ok: true, value: groupPlacement(group, frames.value.box, frames.value.parentBox) }
    : frames;
}

/** The group's placement rewritten into its parent's preview frame. */
function groupPlacement(
  group: SectionGroup,
  box: Box,
  parentBox: Box,
): SectionGroup {
  return {
    ...group,
    placement: sourcePlacement(
      group.placement,
      box.x - parentBox.x,
      box.y - parentBox.y,
      box.width,
      box.height,
    ),
  };
}

/** Rewrite one appearance's placement relative to its parent's preview box. */
function materializeAppearance(
  appearance: SectionAppearance,
  prepared: RearrangementPreparation,
  preview: MoveOption['preview'],
  sectionBox: Box,
): Result<SectionAppearance> {
  const node = prepared.scene.nodes.find(
    (item) => item.measured.groupId === null && item.measured.objectId === appearance.object,
  );
  if (node === undefined)
    return failure('stale-target', 'The rearrangement scene is missing a captured appearance');
  const frames = previewFrames(preview, prepared.sectionId, node, sectionBox);
  return frames.ok
    ? { ok: true, value: appearancePlacement(appearance, frames.value.box, frames.value.parentBox) }
    : frames;
}

/** The appearance's placement rewritten into its parent's preview frame. */
function appearancePlacement(
  appearance: SectionAppearance,
  box: Box,
  parentBox: Box,
): SectionAppearance {
  return {
    ...appearance,
    placement: sourcePlacement(
      appearance.placement,
      box.x - parentBox.x,
      box.y - parentBox.y,
      box.width,
      box.height,
    ),
  };
}

/** The node's own preview box and the frame its placement is relative to. */
function previewFrames(
  preview: MoveOption['preview'],
  sectionId: string,
  node: SceneNode,
  sectionBox: Box,
): Result<PreviewFrames> {
  const box = findNodePreviewBox(preview, sectionId, node.id);
  if (!box.ok) return box;
  const parentBox = previewParentBox(preview, sectionId, node.parent, sectionBox);
  return parentBox.ok
    ? { ok: true, value: { box: box.value, parentBox: parentBox.value } }
    : parentBox;
}

/** A node's box in the preview; the preview must cover every captured node. */
function findNodePreviewBox(
  preview: MoveOption['preview'],
  sectionId: string,
  nodeId: string,
): Result<Box> {
  const box = preview.boxes.find(
    (item) =>
      item.target.kind === 'node' && item.target.section === sectionId && item.target.id === nodeId,
  )?.box;
  return box === undefined
    ? failure('invalid-edit', 'Rearrangement native preview omitted node geometry')
    : { ok: true, value: box };
}

/** A parent node's box in the preview; the section box frames parentless nodes. */
function previewParentBox(
  preview: MoveOption['preview'],
  sectionId: string,
  parentId: string | null,
  sectionBox: Box,
): Result<Box> {
  if (parentId === null) return { ok: true, value: sectionBox };
  return findNodePreviewBox(preview, sectionId, parentId);
}

/** Run the native preview over the materialized changes for verification. */
function previewMaterializedRearrangement(input: MaterializedPreview): Result<MoveOption | null> {
  const preview = input.context.preview;
  return preview === undefined
    ? failure('invalid-edit', 'Movement preview is not available')
    : callMaterializedPreview(input, preview);
}

/** A failed second preview is a failure; a null one declines the option. */
function callMaterializedPreview(
  input: MaterializedPreview,
  preview: NonNullable<MaterializedPreview['context']['preview']>,
): Result<MoveOption | null> {
  const second = preview(input.context.document, input.prepared.intent, input.finalChanges);
  return second.ok ? inspectMaterializedPreview(input, second.value) : second;
}

/** Flatten the second preview before comparing it with the first. */
function inspectMaterializedPreview(
  input: MaterializedPreview,
  secondPreview: MoveOption['preview'] | null,
): Result<MoveOption | null> {
  if (secondPreview === null) return { ok: true, value: null };
  const secondMapResult = completePreview(input.context.document, secondPreview);
  return secondMapResult.ok
    ? acceptRearrangement(input, secondPreview, secondMapResult.value)
    : secondMapResult;
}

/** Offer the option only when both previews agree and every target still matches. */
function acceptRearrangement(
  input: MaterializedPreview,
  secondPreview: MoveOption['preview'],
  secondMap: ReadonlyMap<string, Box>,
): Result<MoveOption | null> {
  if (!sameGeometryMap(input.firstMap, secondMap)) return { ok: true, value: null };
  const accepted = inspectSecondTargets(input);
  if (!accepted) return { ok: true, value: null };
  return {
    ok: true,
    value: {
      id: 'rearrange-section',
      kind: 'rearrange',
      label: 'Rearrange section',
      section: input.prepared.sectionId,
      changes: input.finalChanges,
      geometryChanges: input.geometryChanges,
      preview: secondPreview,
    },
  };
}

/** Every first-preview target must still satisfy the section and closure predicates. */
function inspectSecondTargets(input: MaterializedPreview): boolean {
  return [...input.firstMap].every(([key, firstBox]) => inspectSecondTarget(input, key, firstBox));
}

/** Two geometry maps agree when every shared key holds an exactly equal box. */
function sameGeometryMap(
  first: ReadonlyMap<string, Box>,
  second: ReadonlyMap<string, Box>,
): boolean {
  return [...first].every(([key, box]) => {
    const counterpart = second.get(key);
    return counterpart !== undefined && exactBox(counterpart, box);
  });
}

/** One second-preview target passes when its section and closure geometry still match. */
function inspectSecondTarget(
  input: MaterializedPreview,
  key: string,
  firstBox: Box,
): boolean {
  const target = input.firstPreview.boxes.find((item) => targetKey(item.target) === key)?.target;
  return (
    target !== undefined &&
    otherSectionMatches(input.prepared, target, firstBox, input.context.document) &&
    closureGeometryMatches(
      input.prepared,
      target,
      firstBox,
      input.expected,
      input.closure,
      input.wanted,
    )
  );
}
