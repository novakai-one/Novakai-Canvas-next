import type {
  Change,
  PlacementIntent,
  RenderDocument,
  Section,
  Target,
} from '../../contract/records/owners.js';
import type { Result } from '../../contract/errors.js';
import type {
  GeometryChange,
  MoveOption,
  MovementPreviewContext,
} from '../../contract/records/movement.js';
import { failure } from '../../contract/errors.js';
import {
  changes,
  closureKeys,
  exactBox,
  pinnedSections,
  sceneBox,
  sourcePlacement,
  targetKey,
  type Box,
} from './movement-capture.js';
import { completePreview } from './movement-preview.js';
import { normalizedEntries, expectedBoxes, sameStamp } from './movement-intent.js';

type SceneSection = RenderDocument['scene']['sections'][number];
type SceneNode = SceneSection['nodes'][number];
type RearrangementEntry = PlacementIntent['entries'][number];
type NodeRearrangementEntry = RearrangementEntry & {
  readonly target: Extract<RearrangementEntry['target'], { readonly kind: 'node' }>;
};
type RearrangementPreparation = {
  readonly intent: PlacementIntent;
  readonly entry: NodeRearrangementEntry;
  readonly sectionId: string;
  readonly scene: SceneSection;
  readonly source: Section;
  readonly selected: SceneNode;
  readonly selectedGroupId: string | null;
  readonly ancestors: ReadonlySet<string>;
};
type ReleasedCandidate = {
  readonly sections: readonly Section[];
  readonly changes: readonly Change[];
};

/** Build a deliberate release/reflow candidate for one module section. */
export function buildRearrangeOption(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  const prepared = prepareRearrangement(intent, context);
  if (!prepared.ok) return prepared;
  const released = releaseRearrangement(prepared.value, context.document);
  if (!released.ok) return released;
  return previewReleasedRearrangement(prepared.value, released.value, context);
}

function prepareRearrangement(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<RearrangementPreparation> {
  const availability = validateRearrangementAvailability(intent, context);
  return availability.ok ? resolveRearrangementTarget(intent, context) : availability;
}

function validateRearrangementAvailability(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<void> {
  if (!sameStamp(intent, context.stamp))
    return failure('stale-gesture', 'The diagram changed while rearrangement was being evaluated');
  if (context.preview === undefined)
    return failure('invalid-edit', 'Movement preview is not available');
  return validateRearrangementShape(intent);
}

function validateRearrangementShape(intent: PlacementIntent): Result<void> {
  return intent.entries.length !== 1 ||
    intent.entries.some(
      (entry) =>
        entry.target.kind !== 'node' ||
        entry.placement.width !== undefined ||
        entry.placement.height !== undefined,
    )
    ? failure('unsupported-edit', 'Rearrangement supports one position-only module node')
    : { ok: true, value: undefined };
}

function resolveRearrangementTarget(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<RearrangementPreparation> {
  const normalized = normalizedEntries(context.document, intent);
  return normalized.ok
    ? resolveNormalizedRearrangementTarget(intent, context, normalized.value)
    : normalized;
}

function resolveNormalizedRearrangementTarget(
  intent: PlacementIntent,
  context: MovementPreviewContext,
  entries: readonly RearrangementEntry[],
): Result<RearrangementPreparation> {
  const entry = entries[0];
  return entry === undefined || !isNodeRearrangementEntry(entry)
    ? failure('unsupported-edit', 'Rearrangement supports one selected node')
    : captureRearrangementTarget(intent, context, entry);
}

function isNodeRearrangementEntry(entry: RearrangementEntry): entry is NodeRearrangementEntry {
  return entry.target.kind === 'node';
}

function captureRearrangementTarget(
  intent: PlacementIntent,
  context: MovementPreviewContext,
  entry: NodeRearrangementEntry,
): Result<RearrangementPreparation> {
  const sectionId = entry.target.section;
  const projection = context.document.projection.sections.find(
    (section) => section.id === sectionId,
  );
  const scene = context.document.scene.sections.find((section) => section.id === sectionId);
  const source = context.document.collection.sections.find((section) => section.id === sectionId);
  const selected = scene?.nodes.find((node) => node.id === entry.target.id);
  if (projection?.mode !== 'modules')
    return failure('unsupported-edit', 'Rearrangement supports module sections only');
  if (scene === undefined || source === undefined || selected === undefined)
    return failure('stale-target', 'The rearrangement target is missing');
  return {
    ok: true,
    value: {
      intent: { ...intent, entries: [entry] },
      entry,
      sectionId,
      scene,
      source,
      selected,
      selectedGroupId: selected.measured.groupId,
      ancestors: ancestorIds(scene, selected),
    },
  };
}

function ancestorIds(scene: SceneSection, selected: SceneNode): ReadonlySet<string> {
  const ancestors = new Set<string>();
  let parent = selected.parent;
  while (parent !== null) {
    ancestors.add(parent);
    parent = scene.nodes.find((node) => node.id === parent)?.parent ?? null;
  }
  return ancestors;
}

function releaseRearrangement(
  prepared: RearrangementPreparation,
  document: RenderDocument,
): Result<ReleasedCandidate> {
  let frozen: readonly Section[];
  try {
    frozen = pinnedSections(document, prepared.intent);
  } catch {
    return failure('stale-target', 'Captured rearrangement placements are no longer available');
  }
  const candidate = frozen.map((section) => releaseSection(section, prepared));
  let releasedChanges: readonly Change[];
  try {
    releasedChanges = changes(document, candidate);
  } catch {
    return failure('stale-target', 'Captured rearrangement placements are no longer available');
  }
  return { ok: true, value: { sections: candidate, changes: releasedChanges } };
}

function releaseSection(section: Section, prepared: RearrangementPreparation): Section {
  if (section.id !== prepared.sectionId) return section;
  return {
    ...section,
    groups: section.groups.map((group) => releaseGroup(group, prepared)),
    appearances: section.appearances.map((appearance) => releaseAppearance(appearance, prepared)),
  };
}

function releaseGroup(
  group: Section['groups'][number],
  prepared: RearrangementPreparation,
): Section['groups'][number] {
  const node = prepared.scene.nodes.find((item) => item.measured.groupId === group.id);
  if (node === undefined) throw new Error('captured rearrangement group missing');
  const parent = parentNode(prepared.scene, node);
  return releaseGroupPlacement(group, node, parent, prepared);
}

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

function parentNode(scene: SceneSection, node: SceneNode): SceneNode | undefined {
  return node.parent === null ? undefined : scene.nodes.find((item) => item.id === node.parent);
}

function isInSelectedClosure(node: SceneNode, prepared: RearrangementPreparation): boolean {
  if (node.id === prepared.selected.id || prepared.ancestors.has(node.id)) return true;
  return hasSelectedAncestor(prepared.scene, node.parent, prepared.selected.id);
}

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

function previewReleasedRearrangement(
  prepared: RearrangementPreparation,
  released: ReleasedCandidate,
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  const preview = context.preview;
  return preview === undefined
    ? failure('invalid-edit', 'Movement preview is not available')
    : callReleasedPreview(prepared, released, context, preview);
}

function callReleasedPreview(
  prepared: RearrangementPreparation,
  released: ReleasedCandidate,
  context: MovementPreviewContext,
  preview: NonNullable<MovementPreviewContext['preview']>,
): Result<MoveOption | null> {
  const first = preview(context.document, prepared.intent, released.changes);
  if (!first.ok) return first;
  if (first.value === null)
    return failure('invalid-edit', 'Native rearrangement preview produced no geometry');
  return inspectReleasedRearrangement(prepared, released.sections, first.value, context);
}

function inspectReleasedRearrangement(
  prepared: RearrangementPreparation,
  candidate: readonly Section[],
  firstPreview: MoveOption['preview'],
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  const firstMapResult = completePreview(context.document, firstPreview);
  return firstMapResult.ok
    ? inspectReleasedGeometry(prepared, candidate, firstPreview, firstMapResult.value, context)
    : firstMapResult;
}

function inspectReleasedGeometry(
  prepared: RearrangementPreparation,
  candidate: readonly Section[],
  firstPreview: MoveOption['preview'],
  firstMap: ReadonlyMap<string, Box>,
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  const expected = expectedBoxes(context.document, prepared.intent.entries);
  return expected.ok
    ? inspectReleasedTargetsAndMaterialize(
        prepared,
        candidate,
        firstPreview,
        firstMap,
        expected.value,
        context,
      )
    : expected;
}

function inspectReleasedTargetsAndMaterialize(
  prepared: RearrangementPreparation,
  candidate: readonly Section[],
  firstPreview: MoveOption['preview'],
  firstMap: ReadonlyMap<string, Box>,
  expected: ReadonlyMap<string, Box>,
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  const selectedBefore = sceneBox(context.document, prepared.entry.target);
  return selectedBefore === undefined
    ? failure('stale-target', 'The rearrangement target geometry is missing')
    : inspectReleasedTargetSet(
        prepared,
        candidate,
        firstPreview,
        firstMap,
        expected,
        selectedBefore,
        context,
      );
}

function inspectReleasedTargetSet(
  prepared: RearrangementPreparation,
  candidate: readonly Section[],
  firstPreview: MoveOption['preview'],
  firstMap: ReadonlyMap<string, Box>,
  expected: ReadonlyMap<string, Box>,
  selectedBefore: Box,
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  const closure = closureKeys(context.document, prepared.entry);
  const wanted = wantedBox(prepared, selectedBefore);
  const targetCheck = inspectReleasedTargets(
    prepared,
    firstMap,
    firstPreview,
    expected,
    closure,
    wanted,
    context.document,
  );
  return targetCheck.ok
    ? finishReleasedTargetSet(
        prepared,
        candidate,
        firstPreview,
        firstMap,
        expected,
        closure,
        wanted,
        targetCheck.value,
        context,
      )
    : targetCheck;
}

function finishReleasedTargetSet(
  prepared: RearrangementPreparation,
  candidate: readonly Section[],
  firstPreview: MoveOption['preview'],
  firstMap: ReadonlyMap<string, Box>,
  expected: ReadonlyMap<string, Box>,
  closure: ReadonlySet<string>,
  wanted: Box,
  targetsValid: boolean,
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  if (!targetsValid) return { ok: true, value: null };
  const geometryChanges = geometryDelta(context.document, firstPreview);
  return hasUnselectedChange(prepared, geometryChanges)
    ? materializeRearrangement(
        prepared,
        candidate,
        firstPreview,
        firstMap,
        expected,
        closure,
        wanted,
        geometryChanges,
        context,
      )
    : { ok: true, value: null };
}

function hasUnselectedChange(
  prepared: RearrangementPreparation,
  geometryChanges: readonly GeometryChange[],
): boolean {
  const selectedKey = targetKey(prepared.entry.target);
  return geometryChanges.some(
    (change) =>
      targetKey(change.target) !== selectedKey &&
      ('section' in change.target ? change.target.section === prepared.sectionId : false),
  );
}

function wantedBox(prepared: RearrangementPreparation, selectedBefore: Box): Box {
  const parent = parentNode(prepared.scene, prepared.selected);
  const parentOrigin =
    parent === undefined
      ? { x: prepared.scene.origin.x, y: prepared.scene.origin.y }
      : { x: prepared.scene.origin.x + parent.box.x, y: prepared.scene.origin.y + parent.box.y };
  return {
    ...selectedBefore,
    x: parentOrigin.x + prepared.entry.placement.x,
    y: parentOrigin.y + prepared.entry.placement.y,
  };
}

function inspectReleasedTargets(
  prepared: RearrangementPreparation,
  firstMap: ReadonlyMap<string, Box>,
  firstPreview: MoveOption['preview'],
  expected: ReadonlyMap<string, Box>,
  closure: ReadonlySet<string>,
  wanted: Box,
  document: RenderDocument,
): Result<boolean> {
  const results = [...firstMap].map(([key, actual]) =>
    inspectReleasedTargetEntry(
      prepared,
      key,
      actual,
      firstPreview,
      expected,
      closure,
      wanted,
      document,
    ),
  );
  const rejected = results.find((result) => !result.ok || !result.value);
  return rejected === undefined ? { ok: true, value: true } : rejected;
}

function inspectReleasedTargetEntry(
  prepared: RearrangementPreparation,
  key: string,
  actual: Box,
  preview: MoveOption['preview'],
  expected: ReadonlyMap<string, Box>,
  closure: ReadonlySet<string>,
  wanted: Box,
  document: RenderDocument,
): Result<boolean> {
  const target = preview.boxes.find((item) => targetKey(item.target) === key)?.target;
  return target === undefined
    ? failure('invalid-edit', 'Movement preview target identity is missing')
    : inspectReleasedTarget(prepared, target, actual, expected, closure, wanted, document);
}

function inspectReleasedTarget(
  prepared: RearrangementPreparation,
  target: Target,
  actual: Box,
  expected: ReadonlyMap<string, Box>,
  closure: ReadonlySet<string>,
  wanted: Box,
  document: RenderDocument,
): Result<boolean> {
  return {
    ok: true,
    value:
      sectionOriginMatches(prepared, target, actual) &&
      otherSectionMatches(prepared, target, actual, document) &&
      closureGeometryMatches(prepared, target, actual, expected, closure, wanted),
  };
}

function sectionOriginMatches(
  prepared: RearrangementPreparation,
  target: Target,
  actual: Box,
): boolean {
  return (
    target.kind !== 'section' ||
    target.id !== prepared.sectionId ||
    (actual.x === prepared.scene.box.x && actual.y === prepared.scene.box.y)
  );
}

function otherSectionMatches(
  prepared: RearrangementPreparation,
  target: Target,
  actual: Box,
  document: RenderDocument,
): boolean {
  const targetSection = targetSectionId(target);
  return (
    targetSection === null ||
    targetSection === prepared.sectionId ||
    matchesCaptured(document, target, actual)
  );
}

function targetSectionId(target: Target): string | null {
  if (target.kind === 'section') return target.id;
  return target.kind === 'node' ? target.section : null;
}

function closureGeometryMatches(
  prepared: RearrangementPreparation,
  target: Target,
  actual: Box,
  expected: ReadonlyMap<string, Box>,
  closure: ReadonlySet<string>,
  wanted: Box,
): boolean {
  const key = targetKey(target);
  if (!closure.has(key)) return true;
  return matchesExpectedClosure(prepared, key, actual, expected, wanted);
}

function matchesExpectedClosure(
  prepared: RearrangementPreparation,
  key: string,
  actual: Box,
  expected: ReadonlyMap<string, Box>,
  wanted: Box,
): boolean {
  const expectedBox = key === targetKey(prepared.entry.target) ? wanted : expected.get(key);
  return expectedBox !== undefined && exactBox(expectedBox, actual);
}

function matchesCaptured(document: RenderDocument, target: Target, actual: Box): boolean {
  const captured = sceneBox(document, target);
  return captured !== undefined && exactBox(captured, actual);
}

function geometryDelta(
  document: RenderDocument,
  preview: MoveOption['preview'],
): readonly GeometryChange[] {
  return preview.boxes.flatMap((item) => {
    const before = sceneBox(document, item.target);
    return before !== undefined && !exactBox(before, item.box)
      ? [{ target: item.target, before, after: item.box }]
      : [];
  });
}

function materializeRearrangement(
  prepared: RearrangementPreparation,
  candidate: readonly Section[],
  firstPreview: MoveOption['preview'],
  firstMap: ReadonlyMap<string, Box>,
  expected: ReadonlyMap<string, Box>,
  closure: ReadonlySet<string>,
  wanted: Box,
  geometryChanges: readonly GeometryChange[],
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  let finalSections: readonly Section[];
  try {
    finalSections = candidate.map((section) => materializeSection(section, prepared, firstPreview));
  } catch {
    return failure('invalid-edit', 'Rearrangement native preview omitted required geometry');
  }
  let finalChanges: readonly Change[];
  try {
    finalChanges = changes(context.document, finalSections);
  } catch {
    return failure('invalid-edit', 'Rearrangement could not be materialized');
  }
  return previewMaterializedRearrangement(
    prepared,
    finalChanges,
    firstPreview,
    firstMap,
    expected,
    closure,
    wanted,
    geometryChanges,
    context,
  );
}

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

function findSectionPreviewBox(preview: MoveOption['preview'], sectionId: string): Box {
  const box = preview.boxes.find(
    (item) => item.target.kind === 'section' && item.target.id === sectionId,
  )?.box;
  if (box === undefined) throw new Error('native rearrangement omitted section');
  return box;
}

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

function previewMaterializedRearrangement(
  prepared: RearrangementPreparation,
  finalChanges: readonly Change[],
  firstPreview: MoveOption['preview'],
  firstMap: ReadonlyMap<string, Box>,
  expected: ReadonlyMap<string, Box>,
  closure: ReadonlySet<string>,
  wanted: Box,
  geometryChanges: readonly GeometryChange[],
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  const preview = context.preview;
  return preview === undefined
    ? failure('invalid-edit', 'Movement preview is not available')
    : callMaterializedPreview(
        prepared,
        finalChanges,
        firstPreview,
        firstMap,
        expected,
        closure,
        wanted,
        geometryChanges,
        context,
        preview,
      );
}

function callMaterializedPreview(
  prepared: RearrangementPreparation,
  finalChanges: readonly Change[],
  firstPreview: MoveOption['preview'],
  firstMap: ReadonlyMap<string, Box>,
  expected: ReadonlyMap<string, Box>,
  closure: ReadonlySet<string>,
  wanted: Box,
  geometryChanges: readonly GeometryChange[],
  context: MovementPreviewContext,
  preview: NonNullable<MovementPreviewContext['preview']>,
): Result<MoveOption | null> {
  const second = preview(context.document, prepared.intent, finalChanges);
  return second.ok
    ? inspectMaterializedPreview(
        prepared,
        firstPreview,
        firstMap,
        second.value,
        expected,
        closure,
        wanted,
        finalChanges,
        geometryChanges,
        context,
      )
    : second;
}

function inspectMaterializedPreview(
  prepared: RearrangementPreparation,
  firstPreview: MoveOption['preview'],
  firstMap: ReadonlyMap<string, Box>,
  secondPreview: MoveOption['preview'] | null,
  expected: ReadonlyMap<string, Box>,
  closure: ReadonlySet<string>,
  wanted: Box,
  finalChanges: readonly Change[],
  geometryChanges: readonly GeometryChange[],
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  if (secondPreview === null) return { ok: true, value: null };
  const secondMapResult = completePreview(context.document, secondPreview);
  return secondMapResult.ok
    ? acceptRearrangement(
        prepared,
        firstPreview,
        secondPreview,
        firstMap,
        secondMapResult.value,
        expected,
        closure,
        wanted,
        finalChanges,
        geometryChanges,
        context,
      )
    : secondMapResult;
}

function acceptRearrangement(
  prepared: RearrangementPreparation,
  firstPreview: MoveOption['preview'],
  secondPreview: MoveOption['preview'],
  firstMap: ReadonlyMap<string, Box>,
  secondMap: ReadonlyMap<string, Box>,
  expected: ReadonlyMap<string, Box>,
  closure: ReadonlySet<string>,
  wanted: Box,
  finalChanges: readonly Change[],
  geometryChanges: readonly GeometryChange[],
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  if (!sameGeometryMap(firstMap, secondMap)) return { ok: true, value: null };
  const accepted = inspectSecondTargets(
    prepared,
    firstPreview,
    firstMap,
    expected,
    closure,
    wanted,
    context.document,
  );
  if (!accepted) return { ok: true, value: null };
  return {
    ok: true,
    value: {
      id: 'rearrange-section',
      kind: 'rearrange',
      label: 'Rearrange section',
      section: prepared.sectionId,
      changes: finalChanges,
      geometryChanges,
      preview: secondPreview,
    },
  };
}

function inspectSecondTargets(
  prepared: RearrangementPreparation,
  firstPreview: MoveOption['preview'],
  firstMap: ReadonlyMap<string, Box>,
  expected: ReadonlyMap<string, Box>,
  closure: ReadonlySet<string>,
  wanted: Box,
  document: RenderDocument,
): boolean {
  return [...firstMap].every(([key, firstBox]) =>
    inspectSecondTarget(prepared, key, firstBox, firstPreview, expected, closure, wanted, document),
  );
}

function sameGeometryMap(
  first: ReadonlyMap<string, Box>,
  second: ReadonlyMap<string, Box>,
): boolean {
  return [...first].every(([key, box]) => {
    const counterpart = second.get(key);
    return counterpart !== undefined && exactBox(counterpart, box);
  });
}

function inspectSecondTarget(
  prepared: RearrangementPreparation,
  key: string,
  firstBox: Box,
  preview: MoveOption['preview'],
  expected: ReadonlyMap<string, Box>,
  closure: ReadonlySet<string>,
  wanted: Box,
  document: RenderDocument,
): boolean {
  const target = preview.boxes.find((item) => targetKey(item.target) === key)?.target;
  return (
    target !== undefined &&
    otherSectionMatches(prepared, target, firstBox, document) &&
    closureGeometryMatches(prepared, target, firstBox, expected, closure, wanted)
  );
}
