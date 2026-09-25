/*
 * Materializing an accepted rearrangement: placements are rewritten from the native preview's
 * geometry and the preview is run a second time. The option is offered only when both previews
 * agree on the final geometry.
 */
import type { Change, Section } from '../../../contract/records/owners.js';
import type { Result } from '../../../contract/errors.js';
import type { MoveOption } from '../../../contract/records/movement.js';
import { failure } from '../../../contract/errors.js';
import { changes } from '../capture/settling.js';
import { sourcePlacement } from '../capture/pinning.js';
import { exactBox, targetKey, type Box } from '../capture/boxes.js';
import { completePreview } from '../movement-preview.js';
import { closureGeometryMatches, otherSectionMatches } from './matching.js';
import type {
  MaterializedCandidate,
  MaterializedPreview,
  RearrangementPreparation,
} from './types.js';

/** Rewrite placements from the first preview, then verify the result with a second preview. */
export function materializeRearrangement(input: MaterializedCandidate): Result<MoveOption | null> {
  let finalSections: readonly Section[];
  try {
    finalSections = input.candidate.map((section) =>
      materializeSection(section, input.prepared, input.firstPreview),
    );
  } catch {
    return failure('invalid-edit', 'Rearrangement native preview omitted required geometry');
  }
  let finalChanges: readonly Change[];
  try {
    finalChanges = changes(input.context.document, finalSections);
  } catch {
    return failure('invalid-edit', 'Rearrangement could not be materialized');
  }
  return previewMaterializedRearrangement({ ...input, finalChanges });
}

/** Rewrite the target section's placement and contents from the preview boxes. */
function materializeSection(
  section: Section,
  prepared: RearrangementPreparation,
  firstPreview: MoveOption['preview'],
): Section {
  if (section.id !== prepared.sectionId) return section;
  const sectionBox = findSectionPreviewBox(firstPreview, prepared.sectionId);
  const placement = sourcePlacement(
    section.placement,
    prepared.scene.origin.x,
    prepared.scene.origin.y,
    sectionBox.width,
    sectionBox.height,
  );
  return {
    ...section,
    placement,
    groups: section.groups.map((group) =>
      materializeGroup(group, prepared, firstPreview, sectionBox),
    ),
    appearances: section.appearances.map((appearance) =>
      materializeAppearance(appearance, prepared, firstPreview, sectionBox),
    ),
  };
}

/** The section's own box in the preview; the preview must cover it. */
function findSectionPreviewBox(
  preview: MoveOption['preview'],
  sectionId: string,
): Box {
  const box = preview.boxes.find(
    (item) => item.target.kind === 'section' && item.target.id === sectionId,
  )?.box;
  if (box === undefined) throw new Error('native rearrangement omitted section');
  return box;
}

/** Rewrite one group's placement relative to its parent's preview box. */
function materializeGroup(
  group: Section['groups'][number],
  prepared: RearrangementPreparation,
  preview: MoveOption['preview'],
  sectionBox: Box,
): Section['groups'][number] {
  const node = prepared.scene.nodes.find((item) => item.measured.groupId === group.id);
  if (node === undefined) throw new Error('native rearrangement omitted group');
  const box = findNodePreviewBox(
    preview,
    prepared.sectionId,
    node.id,
    'native rearrangement omitted group geometry',
  );
  const parentBox = previewParentBox(
    preview,
    prepared.sectionId,
    node.parent,
    sectionBox,
    'native rearrangement omitted parent geometry',
  );
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
  appearance: Section['appearances'][number],
  prepared: RearrangementPreparation,
  preview: MoveOption['preview'],
  sectionBox: Box,
): Section['appearances'][number] {
  const node = prepared.scene.nodes.find(
    (item) => item.measured.groupId === null && item.measured.objectId === appearance.object,
  );
  if (node === undefined) throw new Error('native rearrangement omitted appearance');
  const box = findNodePreviewBox(
    preview,
    prepared.sectionId,
    node.id,
    'native rearrangement omitted appearance geometry',
  );
  const parentBox = previewParentBox(
    preview,
    prepared.sectionId,
    node.parent,
    sectionBox,
    'native rearrangement omitted appearance parent',
  );
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

/** A node's box in the preview; the preview must cover every captured node. */
function findNodePreviewBox(
  preview: MoveOption['preview'],
  sectionId: string,
  nodeId: string,
  message: string,
): Box {
  const box = preview.boxes.find(
    (item) =>
      item.target.kind === 'node' && item.target.section === sectionId && item.target.id === nodeId,
  )?.box;
  if (box === undefined) throw new Error(message);
  return box;
}

/** A parent node's box in the preview; the section box frames parentless nodes. */
function previewParentBox(
  preview: MoveOption['preview'],
  sectionId: string,
  parentId: string | null,
  sectionBox: Box,
  message: string,
): Box {
  if (parentId === null) return sectionBox;
  const box = preview.boxes.find(
    (item) =>
      item.target.kind === 'node' &&
      item.target.section === sectionId &&
      item.target.id === parentId,
  )?.box;
  if (box === undefined) throw new Error(message);
  return box;
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
