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
  exactBox,
  plannedSections,
  sceneBox,
  sourcePlacement,
  targetKey,
  type Box,
} from './movement-capture.js';
import { expectedBoxes, normalizedEntries, sameStamp } from './movement-intent.js';

type SceneSection = RenderDocument['scene']['sections'][number];
type SceneNode = SceneSection['nodes'][number];
type ExpansionEntry = PlacementIntent['entries'][number];
type NodeExpansionEntry = ExpansionEntry & {
  readonly target: Extract<ExpansionEntry['target'], { readonly kind: 'node' }>;
};
type ExpansionPreparation = {
  readonly intent: PlacementIntent;
  readonly entry: NodeExpansionEntry;
  readonly sceneSection: SceneSection;
  readonly node: SceneNode;
  readonly parent: SceneNode | undefined;
  readonly before: Box;
  readonly dx: number;
  readonly dy: number;
};
type ExpandedGroup = { readonly node: SceneNode; readonly width: number; readonly height: number };
type ExpansionGeometry = {
  readonly expanded: ReadonlyMap<string, ExpandedGroup>;
  readonly requiredRight: number;
  readonly requiredBottom: number;
  readonly sectionWidth: number;
  readonly sectionHeight: number;
};

/** Build the supported right/bottom container expansion candidate. */
export function buildExpandOption(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  const prepared = prepareExpansion(intent, context);
  if (!prepared.ok) return prepared;
  const geometry = computeExpansion(prepared.value);
  if (geometry === null) return { ok: true, value: null };
  return previewExpansion(prepared.value, geometry, context);
}

function prepareExpansion(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<ExpansionPreparation> {
  const request = validateExpansionRequest(intent, context);
  return request.ok ? resolveExpansionTarget(intent, context) : request;
}

function validateExpansionRequest(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<void> {
  const available = validateExpansionAvailability(intent, context);
  return available.ok ? validateExpansionShape(intent) : available;
}

function validateExpansionAvailability(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<void> {
  if (!sameStamp(intent, context.stamp))
    return failure('stale-gesture', 'The diagram changed while expansion was being evaluated');
  if (context.preview === undefined)
    return failure('invalid-edit', 'Movement preview is not available');
  return { ok: true, value: undefined };
}

function validateExpansionShape(intent: PlacementIntent): Result<void> {
  return intent.entries.length !== 1 || intent.entries.some(hasSize)
    ? failure('unsupported-edit', 'Container expansion supports one position-only module move')
    : { ok: true, value: undefined };
}

function hasSize(entry: ExpansionEntry): boolean {
  return entry.placement.width !== undefined || entry.placement.height !== undefined;
}

function resolveExpansionTarget(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<ExpansionPreparation> {
  const normalized = normalizedEntries(context.document, intent);
  return normalized.ok
    ? resolveNormalizedExpansionTarget(intent, context, normalized.value)
    : normalized;
}

function resolveNormalizedExpansionTarget(
  intent: PlacementIntent,
  context: MovementPreviewContext,
  entries: readonly ExpansionEntry[],
): Result<ExpansionPreparation> {
  if (entries.length !== 1)
    return failure('unsupported-edit', 'Container expansion supports one selected node');
  const entry = entries[0];
  return entry === undefined || !isNodeExpansionEntry(entry)
    ? failure('unsupported-edit', 'Container expansion supports module nodes only')
    : captureExpansionTarget(intent, context, entry);
}

function isNodeExpansionEntry(entry: ExpansionEntry): entry is NodeExpansionEntry {
  return entry.target.kind === 'node';
}

function captureExpansionTarget(
  intent: PlacementIntent,
  context: MovementPreviewContext,
  entry: NodeExpansionEntry,
): Result<ExpansionPreparation> {
  const sectionId = entry.target.section;
  const sceneSection = context.document.scene.sections.find((item) => item.id === sectionId);
  const node = sceneSection?.nodes.find((item) => item.id === entry.target.id);
  const moduleSection = context.document.projection.sections.find((item) => item.id === sectionId);
  if (moduleSection?.mode !== 'modules')
    return failure('unsupported-edit', 'Container expansion supports module sections only');
  if (sceneSection === undefined || node === undefined)
    return failure('stale-target', 'The expansion target is missing');
  return captureExpansionGeometry(intent, context, entry, sceneSection, node);
}

function captureExpansionGeometry(
  intent: PlacementIntent,
  context: MovementPreviewContext,
  entry: NodeExpansionEntry,
  sceneSection: SceneSection,
  node: SceneNode,
): Result<ExpansionPreparation> {
  const parent = expansionParent(sceneSection, node);
  if (!parent.ok) return parent;
  const before = sceneBox(context.document, entry.target);
  if (before === undefined) return failure('stale-target', 'The expansion geometry is missing');
  const parentX = sceneSection.origin.x + (parent.value?.box.x ?? 0);
  const parentY = sceneSection.origin.y + (parent.value?.box.y ?? 0);
  return {
    ok: true,
    value: {
      intent: { ...intent, entries: [entry] },
      entry,
      sceneSection,
      node,
      parent: parent.value,
      before,
      dx: parentX + entry.placement.x - before.x,
      dy: parentY + entry.placement.y - before.y,
    },
  };
}

function expansionParent(section: SceneSection, node: SceneNode): Result<SceneNode | undefined> {
  if (node.parent === null) return { ok: true, value: undefined };
  const parent = section.nodes.find((item) => item.id === node.parent);
  return parent === undefined
    ? failure('stale-target', 'The expansion parent is missing')
    : { ok: true, value: parent };
}

function computeExpansion(prepared: ExpansionPreparation): ExpansionGeometry | null {
  const expanded = new Map<string, ExpandedGroup>();
  let ancestor = prepared.parent;
  let requiredRight =
    prepared.before.x - prepared.sceneSection.origin.x + prepared.dx + prepared.before.width;
  let requiredBottom =
    prepared.before.y - prepared.sceneSection.origin.y + prepared.dy + prepared.before.height;
  while (ancestor !== undefined) {
    const growth = growAncestor(prepared.sceneSection, ancestor, requiredRight, requiredBottom);
    requiredRight = growth.requiredRight;
    requiredBottom = growth.requiredBottom;
    recordGroup(expanded, growth);
    ancestor = growth.parent;
  }
  return computeExpandedSection(prepared.sceneSection, expanded, requiredRight, requiredBottom);
}

function recordGroup(
  expanded: Map<string, ExpandedGroup>,
  growth: ReturnType<typeof growAncestor>,
): void {
  if (growth.group !== undefined) expanded.set(growth.groupId, growth.group);
}

function growAncestor(
  section: SceneSection,
  ancestor: SceneNode,
  requiredRight: number,
  requiredBottom: number,
): {
  readonly requiredRight: number;
  readonly requiredBottom: number;
  readonly group: ExpandedGroup | undefined;
  readonly groupId: string;
  readonly parent: SceneNode | undefined;
} {
  const children = section.nodes.filter((item) => item.parent === ancestor.id);
  const childRight = children.reduce(
    (value, item) => Math.max(value, item.box.x + item.box.width),
    ancestor.box.x,
  );
  const childBottom = children.reduce(
    (value, item) => Math.max(value, item.box.y + item.box.height),
    ancestor.box.y,
  );
  const rightReserve = ancestor.box.x + ancestor.box.width - childRight;
  const bottomReserve = ancestor.box.y + ancestor.box.height - childBottom;
  const width = Math.max(ancestor.box.width, requiredRight - ancestor.box.x + rightReserve);
  const height = Math.max(ancestor.box.height, requiredBottom - ancestor.box.y + bottomReserve);
  return {
    requiredRight: Math.max(requiredRight, ancestor.box.x + width),
    requiredBottom: Math.max(requiredBottom, ancestor.box.y + height),
    group: ancestor.measured.groupId === null ? undefined : { node: ancestor, width, height },
    groupId: ancestor.measured.groupId ?? '',
    parent: parentNode(section, ancestor),
  };
}

function parentNode(section: SceneSection, node: SceneNode): SceneNode | undefined {
  return node.parent === null ? undefined : section.nodes.find((item) => item.id === node.parent);
}

function computeExpandedSection(
  sceneSection: SceneSection,
  expanded: ReadonlyMap<string, ExpandedGroup>,
  requiredRight: number,
  requiredBottom: number,
): ExpansionGeometry | null {
  const groupGrowth = [...expanded.values()].some(
    ({ node, width, height }) => width !== node.box.width || height !== node.box.height,
  );
  const sectionLocalX = sceneSection.box.x - sceneSection.origin.x;
  const sectionLocalY = sceneSection.box.y - sceneSection.origin.y;
  const sectionNeedsGrowth =
    requiredRight > sectionLocalX + sceneSection.box.width ||
    requiredBottom > sectionLocalY + sceneSection.box.height;
  if (!groupGrowth && !sectionNeedsGrowth) return null;
  const currentRight = sceneSection.nodes.reduce(
    (value, item) => Math.max(value, item.box.x + item.box.width),
    0,
  );
  const currentBottom = sceneSection.nodes.reduce(
    (value, item) => Math.max(value, item.box.y + item.box.height),
    0,
  );
  const rightReserve = sectionLocalX + sceneSection.box.width - currentRight;
  const bottomReserve = sectionLocalY + sceneSection.box.height - currentBottom;
  const expandedRight = Math.max(
    currentRight,
    requiredRight,
    ...[...expanded.values()].map(({ node, width }) => node.box.x + width),
  );
  const expandedBottom = Math.max(
    currentBottom,
    requiredBottom,
    ...[...expanded.values()].map(({ node, height }) => node.box.y + height),
  );
  return {
    expanded,
    requiredRight,
    requiredBottom,
    sectionWidth: Math.max(sceneSection.box.width, expandedRight + rightReserve),
    sectionHeight: Math.max(sceneSection.box.height, expandedBottom + bottomReserve),
  };
}

function materializeExpansion(
  prepared: ExpansionPreparation,
  geometry: ExpansionGeometry,
  document: RenderDocument,
): Result<{ readonly sections: readonly Section[]; readonly changes: readonly Change[] }> {
  try {
    const sections = plannedSections(document, prepared.intent).map((candidate) =>
      expandSection(candidate, prepared, geometry, document),
    );
    return { ok: true, value: { sections, changes: changes(document, sections) } };
  } catch {
    return failure('stale-target', 'Captured expansion placements are no longer available');
  }
}

function expandSection(
  candidate: Section,
  prepared: ExpansionPreparation,
  geometry: ExpansionGeometry,
  document: RenderDocument,
): Section {
  if (candidate.id !== prepared.sceneSection.id) return candidate;
  const sectionSource = document.collection.sections.find(
    (item) => item.id === prepared.sceneSection.id,
  );
  if (sectionSource === undefined) return candidate;
  return {
    ...candidate,
    placement: sourcePlacement(
      sectionSource.placement,
      prepared.sceneSection.origin.x,
      prepared.sceneSection.origin.y,
      geometry.sectionWidth,
      geometry.sectionHeight,
    ),
    groups: candidate.groups.map((group) => expandGroup(group, candidate, prepared, geometry)),
  };
}

function expandGroup(
  group: Section['groups'][number],
  candidate: Section,
  prepared: ExpansionPreparation,
  geometry: ExpansionGeometry,
): Section['groups'][number] {
  const change = geometry.expanded.get(group.id);
  if (change === undefined) return group;
  const source = candidate.groups.find((item) => item.id === group.id);
  if (source === undefined) return group;
  const parent = parentNode(prepared.sceneSection, change.node);
  return {
    ...group,
    placement: sourcePlacement(
      source.placement,
      change.node.box.x - (parent?.box.x ?? 0),
      change.node.box.y - (parent?.box.y ?? 0),
      change.width,
      change.height,
    ),
  };
}

function previewExpansion(
  prepared: ExpansionPreparation,
  geometry: ExpansionGeometry,
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  const materialized = materializeExpansion(prepared, geometry, context.document);
  return materialized.ok
    ? previewExpansionChanges(prepared, geometry, materialized.value, context)
    : materialized;
}

function previewExpansionChanges(
  prepared: ExpansionPreparation,
  geometry: ExpansionGeometry,
  materialized: { readonly sections: readonly Section[]; readonly changes: readonly Change[] },
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  const preview = context.preview;
  return preview === undefined
    ? failure('invalid-edit', 'Movement preview is not available')
    : callExpansionPreview(prepared, geometry, materialized.changes, context, preview);
}

function callExpansionPreview(
  prepared: ExpansionPreparation,
  geometry: ExpansionGeometry,
  changes: readonly Change[],
  context: MovementPreviewContext,
  preview: NonNullable<MovementPreviewContext['preview']>,
): Result<MoveOption | null> {
  const result = preview(context.document, prepared.intent, changes);
  if (!result.ok) return result;
  if (result.value === null)
    return failure('invalid-edit', 'Native movement preview produced no geometry');
  return inspectExpansion(prepared, geometry, changes, result.value, context.document);
}

function inspectExpansion(
  prepared: ExpansionPreparation,
  geometry: ExpansionGeometry,
  plannedChanges: readonly Change[],
  preview: MoveOption['preview'],
  document: RenderDocument,
): Result<MoveOption | null> {
  const expected = expectedBoxes(document, prepared.intent.entries);
  return expected.ok
    ? inspectExpansionExpectations(
        prepared,
        geometry,
        expected.value,
        document,
        preview,
        plannedChanges,
      )
    : expected;
}

function inspectExpansionExpectations(
  prepared: ExpansionPreparation,
  geometry: ExpansionGeometry,
  expected: ReadonlyMap<string, Box>,
  document: RenderDocument,
  preview: MoveOption['preview'],
  plannedChanges: readonly Change[],
): Result<MoveOption | null> {
  const expectedWithExpansion = new Map(expected);
  expectedWithExpansion.set(targetKey({ kind: 'section', id: prepared.sceneSection.id }), {
    ...prepared.sceneSection.box,
    width: geometry.sectionWidth,
    height: geometry.sectionHeight,
  });
  const additions = [...geometry.expanded.values()].map((change) =>
    addExpansionExpectation(expectedWithExpansion, document, prepared.sceneSection.id, change),
  );
  const invalid = additions.find((result) => !result.ok || !result.value);
  return finishExpansionExpectations(
    invalid,
    expectedWithExpansion,
    preview,
    plannedChanges,
    prepared.sceneSection.id,
    document,
  );
}

function finishExpansionExpectations(
  invalid: Result<boolean> | undefined,
  expected: ReadonlyMap<string, Box>,
  preview: MoveOption['preview'],
  plannedChanges: readonly Change[],
  sectionId: string,
  document: RenderDocument,
): Result<MoveOption | null> {
  if (invalid === undefined)
    return inspectExpansionGeometry(document, expected, preview, plannedChanges, sectionId);
  return invalid.ok ? { ok: true, value: null } : invalid;
}

function addExpansionExpectation(
  expected: Map<string, Box>,
  document: RenderDocument,
  sectionId: string,
  change: ExpandedGroup,
): Result<boolean> {
  const target: Target = { kind: 'node', section: sectionId, id: change.node.id };
  const prior = sceneBox(document, target);
  if (prior === undefined) return { ok: true, value: false };
  expected.set(targetKey(target), { ...prior, width: change.width, height: change.height });
  return { ok: true, value: true };
}

function inspectExpansionGeometry(
  document: RenderDocument,
  expected: ReadonlyMap<string, Box>,
  preview: MoveOption['preview'],
  plannedChanges: readonly Change[],
  sectionId: string,
): Result<MoveOption | null> {
  const actual = indexExpansionPreview(preview);
  if (actual === null || actual.size !== expected.size) return { ok: true, value: null };
  return inspectExpansionBoxes(document, expected, actual, preview, plannedChanges, sectionId);
}

function indexExpansionPreview(preview: MoveOption['preview']): ReadonlyMap<string, Box> | null {
  const actual = new Map<string, Box>();
  const duplicate = preview.boxes.some((item) => {
    const key = targetKey(item.target);
    if (actual.has(key)) return true;
    actual.set(key, item.box);
    return false;
  });
  return duplicate ? null : actual;
}

type ExpansionInspection = { readonly valid: boolean; readonly change?: GeometryChange };

function inspectExpansionBoxes(
  document: RenderDocument,
  expected: ReadonlyMap<string, Box>,
  actual: ReadonlyMap<string, Box>,
  preview: MoveOption['preview'],
  plannedChanges: readonly Change[],
  sectionId: string,
): Result<MoveOption | null> {
  const geometryChanges: GeometryChange[] = [];
  let valid = true;
  [...expected.entries()].some(([key, expectedBox]) => {
    const inspection = inspectExpansionBox(document, key, expectedBox, actual, preview);
    valid = appendExpansionInspection(geometryChanges, inspection);
    return !valid;
  });
  return !valid || geometryChanges.length === 0
    ? { ok: true, value: null }
    : {
        ok: true,
        value: {
          id: 'expand-container',
          kind: 'expand',
          label: 'Expand container',
          section: sectionId,
          changes: plannedChanges,
          geometryChanges,
          preview,
        },
      };
}

function inspectExpansionBox(
  document: RenderDocument,
  key: string,
  expected: Box,
  actual: ReadonlyMap<string, Box>,
  preview: MoveOption['preview'],
): ExpansionInspection {
  const after = actual.get(key);
  const item = preview.boxes.find((candidate) => targetKey(candidate.target) === key);
  const checked = checkedExpansionItem(after, item, expected);
  if (checked === undefined) return { valid: false };
  const prior = sceneBox(document, checked.item.target);
  if (prior === undefined) return { valid: false };
  return expansionDelta(prior, checked.item.target, checked.after);
}

function checkedExpansionItem(
  after: Box | undefined,
  item: { readonly target: Target; readonly box: Box } | undefined,
  expected: Box,
):
  | { readonly after: Box; readonly item: { readonly target: Target; readonly box: Box } }
  | undefined {
  return after !== undefined && item !== undefined && exactBox(after, expected)
    ? { after, item }
    : undefined;
}

function expansionDelta(prior: Box, target: Target, after: Box): ExpansionInspection {
  return exactBox(prior, after)
    ? { valid: true }
    : { valid: true, change: { target, before: prior, after } };
}

function appendExpansionInspection(
  changes: GeometryChange[],
  inspection: ExpansionInspection,
): boolean {
  if (!inspection.valid) return false;
  if (inspection.change !== undefined) changes.push(inspection.change);
  return true;
}
