import type {
  Change,
  Placement,
  PlacementIntent,
  RenderDocument,
  SceneStamp,
  Section,
  Target,
} from '../../contract/records/owners.js';
import type { Result } from '../../contract/errors.js';
import type {
  GeometryChange,
  MoveOption,
  MoveReview,
  MovementPreviewContext,
} from '../../contract/records/movement.js';
type Box = GeometryChange['before'];
type GeometryPreview = MoveOption['preview'];
import { failure } from '../../contract/errors.js';
import { placeEntries } from './placements.js';

function sameStamp(intent: PlacementIntent, stamp: SceneStamp): boolean {
  return (
    intent.base.collectionId === stamp.collectionId &&
    intent.base.revision === stamp.revision &&
    intent.base.inputKey === stamp.inputKey &&
    intent.base.generation === stamp.generation
  );
}

function sourcePlacement(
  prior: Placement | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
): Placement {
  return {
    x,
    y,
    width,
    height,
    locked: prior?.locked ?? false,
  };
}

function originPlacement(prior: Placement | undefined, x: number, y: number): Placement {
  return prior === undefined ? { x, y, locked: false } : { ...prior, x, y };
}

function pinnedSections(document: RenderDocument, intent: PlacementIntent): readonly Section[] {
  const affected = new Set(
    intent.entries
      .filter((entry) => entry.target.kind === 'node')
      .map((entry) => ('section' in entry.target ? entry.target.section : '')),
  );
  return document.collection.sections.map((source) => pinSection(document, source, affected));
}

function pinSection(
  document: RenderDocument,
  source: Section,
  affected: ReadonlySet<string>,
): Section {
  const scene = document.scene.sections.find((item) => item.id === source.id);
  if (scene === undefined) throw new Error('captured section missing');
  const placement = originPlacement(source.placement, scene.origin.x, scene.origin.y);
  if (!affected.has(source.id) || source.mode !== 'modules') return { ...source, placement };
  const nodes = new Map(scene.nodes.map((node) => [node.id, node]));
  return {
    ...source,
    placement,
    groups: source.groups.map((group) => pinGroup(group, scene.nodes, nodes)),
    appearances: source.appearances.map((appearance) =>
      pinAppearance(appearance, scene.nodes, nodes),
    ),
  };
}
function parentBox(
  node: { readonly parent: string | null; readonly box: Box },
  nodes: ReadonlyMap<string, { readonly box: Box }>,
): Box | undefined {
  return node.parent === null ? undefined : nodes.get(node.parent)?.box;
}
function pinGroup(
  group: Section['groups'][number],
  nodes: readonly RenderDocument['scene']['sections'][number]['nodes'][number][],
  indexed: ReadonlyMap<string, RenderDocument['scene']['sections'][number]['nodes'][number]>,
): Section['groups'][number] {
  const node = nodes.find((candidate) => candidate.measured.groupId === group.id);
  if (node === undefined) throw new Error('captured group missing');
  const parent = parentBox(node, indexed);
  if (node.parent !== null && parent === undefined)
    throw new Error('captured group parent missing');
  return {
    ...group,
    placement: sourcePlacement(
      group.placement,
      node.box.x - (parent?.x ?? 0),
      node.box.y - (parent?.y ?? 0),
      node.box.width,
      node.box.height,
    ),
  };
}
function pinAppearance(
  appearance: Section['appearances'][number],
  nodes: readonly RenderDocument['scene']['sections'][number]['nodes'][number][],
  indexed: ReadonlyMap<string, RenderDocument['scene']['sections'][number]['nodes'][number]>,
): Section['appearances'][number] {
  const node = nodes.find(
    (candidate) =>
      candidate.measured.groupId === null && candidate.measured.objectId === appearance.object,
  );
  if (node === undefined) throw new Error('captured appearance missing');
  const parent = parentBox(node, indexed);
  if (node.parent !== null && parent === undefined)
    throw new Error('captured appearance parent missing');
  return {
    ...appearance,
    placement: sourcePlacement(
      appearance.placement,
      node.box.x - (parent?.x ?? 0),
      node.box.y - (parent?.y ?? 0),
      node.box.width,
      node.box.height,
    ),
  };
}

function plannedSections(document: RenderDocument, intent: PlacementIntent): readonly Section[] {
  const frozen = pinnedSections(document, intent);
  const pinnedDocument = {
    ...document,
    collection: { ...document.collection, sections: frozen },
  };
  return placeEntries(intent, pinnedDocument);
}

function changes(document: RenderDocument, sections: readonly Section[]): readonly Change[] {
  return sections
    .filter(
      (section) => document.collection.sections.find((item) => item.id === section.id) !== section,
    )
    .map((value) => ({ op: 'replace' as const, target: 'sections' as const, value }));
}

function sceneBox(document: RenderDocument, target: Target): Box | undefined {
  return target.kind === 'section'
    ? sectionBox(document, target.id)
    : target.kind === 'node'
      ? nodeWorldBox(document, target)
      : undefined;
}
function sectionBox(document: RenderDocument, id: string): Box | undefined {
  return document.scene.sections.find((section) => section.id === id)?.box;
}
function nodeWorldBox(
  document: RenderDocument,
  target: Extract<Target, { kind: 'node' }>,
): Box | undefined {
  const section = document.scene.sections.find((item) => item.id === target.section);
  const node = section?.nodes.find((item) => item.id === target.id);
  return section === undefined || node === undefined
    ? undefined
    : { ...node.box, x: node.box.x + section.origin.x, y: node.box.y + section.origin.y };
}

function targetKey(target: Target): string {
  if (target.kind === 'section') return `section:${target.id}`;
  return `node:${target.section}:${target.id}`;
}

function exactBox(before: Box, after: Box): boolean {
  return (
    before.x === after.x &&
    before.y === after.y &&
    before.width === after.width &&
    before.height === after.height
  );
}

function completePreview(
  document: RenderDocument,
  preview: GeometryPreview,
): Result<ReadonlyMap<string, Box>> {
  const expected = [
    ...document.scene.sections.map((section) =>
      targetKey({ kind: 'section' as const, id: section.id }),
    ),
    ...document.scene.sections.flatMap((section) =>
      section.nodes.map((node) =>
        targetKey({ kind: 'node' as const, section: section.id, id: node.id }),
      ),
    ),
  ];
  const actual = new Map<string, Box>();
  for (const item of preview.boxes) {
    const key = targetKey(item.target);
    if (!expected.includes(key) || actual.has(key))
      return failure(
        'invalid-edit',
        'Movement preview contains an unexpected or duplicate geometry target',
      );
    actual.set(key, item.box);
  }
  if (actual.size !== expected.length || expected.some((key) => !actual.has(key)))
    return failure(
      'invalid-edit',
      'Movement preview did not preserve the complete captured target set',
    );
  return { ok: true, value: actual };
}

function closureKeys(
  document: RenderDocument,
  entry: PlacementIntent['entries'][number],
): ReadonlySet<string> {
  const keys = new Set<string>();
  if (entry.target.kind !== 'node') return keys;
  const section = document.scene.sections.find(
    (item) => item.id === ('section' in entry.target ? entry.target.section : ''),
  );
  if (!section) return keys;
  section.nodes
    .filter((node) => containsAncestor(section.nodes, node.id, entry.target.id))
    .forEach((node) => keys.add(targetKey({ kind: 'node', section: section.id, id: node.id })));
  return keys;
}
function containsAncestor(
  nodes: readonly { readonly id: string; readonly parent: string | null }[],
  start: string,
  wanted: string,
): boolean {
  let current: string | null = start;
  while (current !== null && current !== wanted)
    current = nodes.find((item) => item.id === current)?.parent ?? null;
  return current === wanted;
}

function normalizedEntries(
  document: RenderDocument,
  intent: PlacementIntent,
): Result<readonly PlacementIntent['entries'][number][]> {
  const byKey = new Map<string, PlacementIntent['entries'][number]>();
  for (const entry of intent.entries) {
    const key = targetKey(entry.target);
    if (byKey.has(key))
      return failure('invalid-edit', 'Movement contains duplicate selected targets');
    byKey.set(key, entry);
  }
  const entries = [...byKey.values()];
  const conflict = entries
    .map((entry) => validateEntry(document, entry, byKey))
    .find((result) => !result.ok);
  if (conflict !== undefined) return conflict;
  return { ok: true, value: entries };
}
function validateEntry(
  document: RenderDocument,
  entry: PlacementIntent['entries'][number],
  byKey: ReadonlyMap<string, PlacementIntent['entries'][number]>,
): Result<void> {
  if (entry.target.kind !== 'node') return { ok: true, value: undefined };
  if (byKey.has(targetKey({ kind: 'section', id: entry.target.section })))
    return failure('invalid-edit', 'Select either a section or one of its nodes, not both');
  const section = document.scene.sections.find(
    (item) => item.id === ('section' in entry.target ? entry.target.section : ''),
  );
  const node = section?.nodes.find((item) => item.id === entry.target.id);
  if (section === undefined || node === undefined)
    return failure('stale-target', 'The selected movement target is missing');
  let parent = node.parent;
  while (parent !== null) {
    if (byKey.has(targetKey({ kind: 'node', section: section.id, id: parent })))
      return failure('invalid-edit', 'Select either an ancestor or its descendant, not both');
    const parentNode = section.nodes.find((item) => item.id === parent);
    if (parentNode === undefined)
      return failure('stale-target', 'The selected movement parent is missing');
    parent = parentNode.parent;
  }
  return { ok: true, value: undefined };
}

function worldBox(document: RenderDocument, target: Target): Box | undefined {
  return sceneBox(document, target);
}

function expectedBoxes(
  document: RenderDocument,
  entries: readonly PlacementIntent['entries'][number][],
): Result<ReadonlyMap<string, Box>> {
  const roots = new Map<string, { section: string; dx: number; dy: number }>();
  for (const entry of entries) {
    if (entry.target.kind === 'section') {
      const section = document.scene.sections.find((item) => item.id === entry.target.id);
      if (section === undefined) return failure('stale-target', 'The selected section is missing');
      roots.set(targetKey(entry.target), {
        section: section.id,
        dx: entry.placement.x - section.origin.x,
        dy: entry.placement.y - section.origin.y,
      });
      continue;
    }
    if (entry.target.kind !== 'node')
      return failure('unsupported-edit', 'Movement review supports module nodes and sections');
    const section = document.scene.sections.find(
      (item) => item.id === ('section' in entry.target ? entry.target.section : ''),
    );
    const node = section?.nodes.find((item) => item.id === entry.target.id);
    if (section === undefined || node === undefined)
      return failure('stale-target', 'The selected node is missing');
    const parent =
      node.parent === null ? undefined : section.nodes.find((item) => item.id === node.parent);
    if (node.parent !== null && parent === undefined)
      return failure('stale-target', 'The selected node parent is missing');
    const parentX = section.origin.x + (parent?.box.x ?? 0);
    const parentY = section.origin.y + (parent?.box.y ?? 0);
    const before = worldBox(document, entry.target);
    if (before === undefined)
      return failure('stale-target', 'The selected node geometry is missing');
    roots.set(targetKey(entry.target), {
      section: section.id,
      dx: parentX + entry.placement.x - before.x,
      dy: parentY + entry.placement.y - before.y,
    });
  }
  const expected = new Map<string, Box>();
  for (const section of document.scene.sections) {
    const sectionTarget = { kind: 'section' as const, id: section.id };
    const sectionRoot = roots.get(targetKey(sectionTarget));
    const sectionBox = section.box;
    expected.set(
      targetKey(sectionTarget),
      sectionRoot === undefined
        ? sectionBox
        : {
            ...sectionBox,
            x: sectionBox.x + sectionRoot.dx,
            y: sectionBox.y + sectionRoot.dy,
          },
    );
    for (const node of section.nodes) {
      const target = { kind: 'node' as const, section: section.id, id: node.id };
      let current: string | null = node.id;
      let root: { section: string; dx: number; dy: number } | undefined;
      while (current !== null) {
        root = roots.get(targetKey({ kind: 'node', section: section.id, id: current }));
        if (root !== undefined) break;
        current = section.nodes.find((item) => item.id === current)?.parent ?? null;
      }
      root ??= sectionRoot;
      expected.set(
        targetKey(target),
        root === undefined
          ? { ...node.box, x: node.box.x + section.origin.x, y: node.box.y + section.origin.y }
          : {
              ...node.box,
              x: node.box.x + section.origin.x + root.dx,
              y: node.box.y + section.origin.y + root.dy,
            },
      );
    }
  }
  return { ok: true, value: expected };
}

function geometryChanges(
  document: RenderDocument,
  entries: readonly PlacementIntent['entries'][number][],
  preview: GeometryPreview,
): Result<readonly GeometryChange[]> {
  const expected = expectedBoxes(document, entries);
  if (!expected.ok) return expected;
  const actual = new Map<string, Box>();
  for (const item of preview.boxes) {
    const key = targetKey(item.target);
    if (actual.has(key))
      return failure('invalid-edit', 'Movement preview contains duplicate geometry targets');
    actual.set(key, item.box);
  }
  if (actual.size !== expected.value.size)
    return failure('invalid-edit', 'Movement preview contains an unexpected geometry target set');
  for (const key of expected.value.keys()) {
    if (!actual.has(key))
      return failure('invalid-edit', 'Movement preview omitted a captured geometry target');
  }
  const changes: GeometryChange[] = [];
  for (const [key, before] of expected.value) {
    const after = actual.get(key);
    if (after === undefined)
      return failure('invalid-edit', 'Movement preview omitted a captured geometry target');
    if (!exactBox(before, after))
      return failure('invalid-edit', 'Movement preview does not match the requested geometry');
    const matched = preview.boxes.find((item) => targetKey(item.target) === key);
    if (matched === undefined)
      return failure('invalid-edit', 'Movement preview omitted a captured target identity');
    const target = matched.target;
    const captured = worldBox(document, target);
    if (captured === undefined)
      return failure('stale-target', 'Movement preview target is not captured');
    if (!exactBox(captured, after)) changes.push({ target, before: captured, after });
  }
  return { ok: true, value: changes };
}

export function buildMoveReview(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<MoveReview> {
  if (!sameStamp(intent, context.stamp))
    return failure('stale-gesture', 'The diagram changed while this gesture was being edited');
  if (
    intent.entries.some(
      (entry) =>
        entry.target.kind === 'section' &&
        context.document.projection.sections.every(
          (section) => section.id !== entry.target.id || section.mode !== 'modules',
        ),
    )
  )
    return failure('unsupported-edit', 'Movement review supports module sections only');
  if (
    intent.entries.length === 0 ||
    intent.entries.some((entry) => {
      if (entry.placement.width !== undefined || entry.placement.height !== undefined) return true;
      if (entry.target.kind === 'section') return false;
      if (entry.target.kind !== 'node') return true;
      return !context.document.projection.sections.some(
        (section) =>
          section.id === ('section' in entry.target ? entry.target.section : '') &&
          section.mode === 'modules',
      );
    })
  )
    return failure('unsupported-edit', 'Movement review supports position-only module moves');
  if (context.preview === undefined)
    return failure('invalid-edit', 'Movement preview is not available');

  const normalized = normalizedEntries(context.document, intent);
  if (!normalized.ok) return normalized;

  let sections: readonly Section[];
  try {
    sections = plannedSections(context.document, { ...intent, entries: normalized.value });
  } catch {
    return failure('stale-target', 'The movement target is no longer available');
  }
  const plannedChanges = changes(context.document, sections);
  const preview = context.preview(
    context.document,
    { ...intent, entries: normalized.value },
    plannedChanges,
  );
  if (!preview.ok) return preview;
  if (preview.value === null)
    return failure('invalid-edit', 'Movement preview produced no geometry');
  const inspected = geometryChanges(context.document, normalized.value, preview.value);
  if (!inspected.ok) return inspected;
  if (inspected.value.length === 0)
    return {
      ok: true,
      value: {
        id: intent.id,
        intent: { ...intent, entries: normalized.value },
        stamp: context.stamp,
        collectionId: context.document.collection.id,
        revision: context.document.collection.revision,
        options: [],
        selectedOption: null,
        reason: 'The requested position produced no changed geometry.',
      },
    };

  const option: MoveOption = {
    id: 'move-only',
    kind: 'move-only',
    label: 'Move only',
    changes: plannedChanges,
    geometryChanges: inspected.value,
    preview: preview.value,
  };
  return {
    ok: true,
    value: {
      id: intent.id,
      intent: { ...intent, entries: normalized.value },
      stamp: context.stamp,
      collectionId: context.document.collection.id,
      revision: context.document.collection.revision,
      options: [option],
      selectedOption: option.id,
    },
  };
}

export function chooseMoveOption(
  review: MoveReview,
  optionId: string,
  current: SceneStamp,
): Result<MoveOption> {
  if (
    review.stamp.collectionId !== current.collectionId ||
    review.stamp.revision !== current.revision ||
    review.stamp.inputKey !== current.inputKey ||
    review.stamp.generation !== current.generation
  )
    return failure('stale-gesture', 'The diagram changed while this move was under review');
  const selected = review.options.find((option) => option.id === optionId);
  if (selected === undefined)
    return failure('invalid-edit', 'That movement option is no longer available');
  return { ok: true, value: selected };
}

/** Build the supported right/bottom container expansion candidate. */
export function buildExpandOption(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  if (!sameStamp(intent, context.stamp))
    return failure('stale-gesture', 'The diagram changed while expansion was being evaluated');
  if (context.preview === undefined)
    return failure('invalid-edit', 'Movement preview is not available');
  if (
    intent.entries.length !== 1 ||
    intent.entries.some(
      (item) => item.placement.width !== undefined || item.placement.height !== undefined,
    )
  ) {
    return failure(
      'unsupported-edit',
      'Container expansion supports one position-only module move',
    );
  }
  const normalized = normalizedEntries(context.document, intent);
  if (!normalized.ok) return normalized;
  if (normalized.value.length !== 1)
    return failure('unsupported-edit', 'Container expansion supports one selected node');
  const entry = normalized.value[0];
  if (entry === undefined || entry.target.kind !== 'node')
    return failure('unsupported-edit', 'Container expansion supports module nodes only');
  const sectionId = 'section' in entry.target ? entry.target.section : '';
  const sceneSection = context.document.scene.sections.find((item) => item.id === sectionId);
  const node = sceneSection?.nodes.find((item) => item.id === entry.target.id);
  const moduleSection = context.document.projection.sections.find((item) => item.id === sectionId);
  if (moduleSection?.mode !== 'modules')
    return failure('unsupported-edit', 'Container expansion supports module sections only');
  if (sceneSection === undefined || node === undefined)
    return failure('stale-target', 'The expansion target is missing');
  const parent =
    node.parent === null ? undefined : sceneSection.nodes.find((item) => item.id === node.parent);
  if (node.parent !== null && parent === undefined)
    return failure('stale-target', 'The expansion parent is missing');
  const before = worldBox(context.document, entry.target);
  if (before === undefined) return failure('stale-target', 'The expansion geometry is missing');
  const parentX = sceneSection.origin.x + (parent?.box.x ?? 0);
  const parentY = sceneSection.origin.y + (parent?.box.y ?? 0);
  const dx = parentX + entry.placement.x - before.x;
  const dy = parentY + entry.placement.y - before.y;
  const groupNode = parent;
  const expanded = new Map<string, { node: typeof node; width: number; height: number }>();
  let ancestor: typeof node | undefined = groupNode;
  let requiredRight = before.x - sceneSection.origin.x + dx + before.width;
  let requiredBottom = before.y - sceneSection.origin.y + dy + before.height;
  while (ancestor !== undefined) {
    const children = sceneSection.nodes.filter((item) => item.parent === ancestor?.id);
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
    requiredRight = Math.max(requiredRight, ancestor.box.x + width);
    requiredBottom = Math.max(requiredBottom, ancestor.box.y + height);
    if (ancestor.measured.groupId !== null) {
      expanded.set(ancestor.measured.groupId, { node: ancestor, width, height });
    }
    ancestor =
      ancestor.parent === null
        ? undefined
        : sceneSection.nodes.find((item) => item.id === ancestor?.parent);
  }
  const groupGrowth = [...expanded.values()].some(
    ({ node: candidate, width, height }) =>
      width !== candidate.box.width || height !== candidate.box.height,
  );
  const sectionLocalX = sceneSection.box.x - sceneSection.origin.x;
  const sectionLocalY = sceneSection.box.y - sceneSection.origin.y;
  const sectionNeedsGrowth =
    requiredRight > sectionLocalX + sceneSection.box.width ||
    requiredBottom > sectionLocalY + sceneSection.box.height;
  if (!groupGrowth && !sectionNeedsGrowth) return { ok: true, value: null };
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
    ...[...expanded.values()].map(({ node: candidate, width }) => candidate.box.x + width),
  );
  const expandedBottom = Math.max(
    currentBottom,
    requiredBottom,
    ...[...expanded.values()].map(({ node: candidate, height }) => candidate.box.y + height),
  );
  const sectionWidth = Math.max(sceneSection.box.width, expandedRight + rightReserve);
  const sectionHeight = Math.max(sceneSection.box.height, expandedBottom + bottomReserve);
  let planned: readonly Section[];
  try {
    planned = plannedSections(context.document, { ...intent, entries: normalized.value }).map(
      (candidate) => {
        if (candidate.id !== sceneSection.id) return candidate;
        const sectionSource = context.document.collection.sections.find(
          (item) => item.id === sceneSection.id,
        );
        if (sectionSource === undefined) return candidate;
        const sectionPlacement = sourcePlacement(
          sectionSource.placement,
          sceneSection.origin.x,
          sceneSection.origin.y,
          sectionWidth,
          sectionHeight,
        );
        return {
          ...candidate,
          placement: sectionPlacement,
          groups: candidate.groups.map((group) => {
            const change = expanded.get(group.id);
            if (change === undefined) return group;
            const source = candidate.groups.find((item) => item.id === group.id);
            if (source === undefined) return group;
            const groupParent =
              change.node.parent === null
                ? undefined
                : sceneSection.nodes.find((item) => item.id === change.node.parent);
            const placement = sourcePlacement(
              source.placement,
              change.node.box.x - (groupParent?.box.x ?? 0),
              change.node.box.y - (groupParent?.box.y ?? 0),
              change.width,
              change.height,
            );
            return { ...group, placement };
          }),
        };
      },
    );
  } catch {
    return failure('stale-target', 'Captured expansion placements are no longer available');
  }
  const plannedChanges = changes(context.document, planned);
  const preview = context.preview(
    context.document,
    { ...intent, entries: normalized.value },
    plannedChanges,
  );
  if (!preview.ok) return preview;
  if (preview.value === null)
    return failure('invalid-edit', 'Native movement preview produced no geometry');
  const expected = expectedBoxes(context.document, normalized.value);
  if (!expected.ok) return expected;
  const expectedWithExpansion = new Map(expected.value);
  expectedWithExpansion.set(targetKey({ kind: 'section', id: sceneSection.id }), {
    ...sceneSection.box,
    width: sectionWidth,
    height: sectionHeight,
  });
  for (const change of expanded.values()) {
    const target: Target = { kind: 'node', section: sceneSection.id, id: change.node.id };
    const prior = worldBox(context.document, target);
    if (prior === undefined) return { ok: true, value: null };
    expectedWithExpansion.set(targetKey(target), {
      ...prior,
      width: change.width,
      height: change.height,
    });
  }
  const actual = new Map<string, Box>();
  for (const item of preview.value.boxes) {
    const key = targetKey(item.target);
    if (actual.has(key)) return { ok: true, value: null };
    actual.set(key, item.box);
  }
  if (actual.size !== expectedWithExpansion.size) return { ok: true, value: null };
  const geometryChanges: GeometryChange[] = [];
  for (const [key, expectedBox] of expectedWithExpansion) {
    const after = actual.get(key);
    const item = preview.value.boxes.find((candidate) => targetKey(candidate.target) === key);
    if (after === undefined || item === undefined || !exactBox(after, expectedBox))
      return { ok: true, value: null };
    const prior = sceneBox(context.document, item.target);
    if (prior === undefined) return { ok: true, value: null };
    if (!exactBox(prior, after))
      geometryChanges.push({ target: item.target, before: prior, after });
  }
  if (geometryChanges.length === 0) return { ok: true, value: null };
  return {
    ok: true,
    value: {
      id: 'expand-container',
      kind: 'expand',
      label: 'Expand container',
      section: sceneSection.id,
      changes: plannedChanges,
      geometryChanges,
      preview: preview.value,
    },
  };
}

/** Build a deliberate release/reflow candidate for one module section. */
export function buildRearrangeOption(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<MoveOption | null> {
  if (!sameStamp(intent, context.stamp))
    return failure('stale-gesture', 'The diagram changed while rearrangement was being evaluated');
  if (context.preview === undefined)
    return failure('invalid-edit', 'Movement preview is not available');
  if (
    intent.entries.length !== 1 ||
    intent.entries.some(
      (entry) =>
        entry.target.kind !== 'node' ||
        entry.placement.width !== undefined ||
        entry.placement.height !== undefined,
    )
  )
    return failure('unsupported-edit', 'Rearrangement supports one position-only module node');
  const normalized = normalizedEntries(context.document, intent);
  if (!normalized.ok) return normalized;
  const entry = normalized.value[0];
  if (entry === undefined || entry.target.kind !== 'node')
    return failure('unsupported-edit', 'Rearrangement supports one selected node');
  const sectionId = 'section' in entry.target ? entry.target.section : '';
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
  const ancestors = new Set<string>();
  const selectedGroupId = selected.measured.groupId;
  let parent = selected.parent;
  while (parent !== null) {
    ancestors.add(parent);
    parent = scene.nodes.find((node) => node.id === parent)?.parent ?? null;
  }
  let frozen: readonly Section[];
  try {
    frozen = pinnedSections(context.document, intent);
  } catch {
    return failure('stale-target', 'Captured rearrangement placements are no longer available');
  }
  const candidate = frozen.map((section) => {
    if (section.id !== sectionId) return section;
    const groups = section.groups.map((group) => {
      const node = scene.nodes.find((item) => item.measured.groupId === group.id);
      if (node === undefined) throw new Error('captured rearrangement group missing');
      const parentNode =
        node.parent === null ? undefined : scene.nodes.find((item) => item.id === node.parent);
      let inSelectedClosure = node.id === selected.id || ancestors.has(node.id);
      let current: string | null = node.parent;
      while (current !== null) {
        if (current === selected.id) inSelectedClosure = true;
        current = scene.nodes.find((item) => item.id === current)?.parent ?? null;
      }
      if (node.measured.groupId === selectedGroupId) {
        return {
          ...group,
          placement: sourcePlacement(
            group.placement,
            entry.placement.x,
            entry.placement.y,
            node.box.width,
            node.box.height,
          ),
        };
      }
      if (inSelectedClosure)
        return {
          ...group,
          placement: sourcePlacement(
            group.placement,
            node.box.x - (parentNode?.box.x ?? 0),
            node.box.y - (parentNode?.box.y ?? 0),
            node.box.width,
            node.box.height,
          ),
        };
      return { ...group, placement: undefined };
    });
    const appearances = section.appearances.map((appearance) => {
      const node = scene.nodes.find(
        (item) => item.measured.groupId === null && item.measured.objectId === appearance.object,
      );
      if (node === undefined) throw new Error('captured rearrangement appearance missing');
      const parentNode =
        node.parent === null ? undefined : scene.nodes.find((item) => item.id === node.parent);
      if (node.id === selected.id && selectedGroupId === null) {
        return {
          ...appearance,
          placement: sourcePlacement(
            appearance.placement,
            entry.placement.x,
            entry.placement.y,
            node.box.width,
            node.box.height,
          ),
        };
      }
      let inSelectedClosure = node.id === selected.id;
      let current: string | null = node.parent;
      while (current !== null) {
        if (current === selected.id) inSelectedClosure = true;
        current = scene.nodes.find((item) => item.id === current)?.parent ?? null;
      }
      if (inSelectedClosure || ancestors.has(node.parent ?? ''))
        return {
          ...appearance,
          placement: sourcePlacement(
            appearance.placement,
            node.box.x - (parentNode?.box.x ?? 0),
            node.box.y - (parentNode?.box.y ?? 0),
            node.box.width,
            node.box.height,
          ),
        };
      return { ...appearance, placement: undefined };
    });
    return { ...section, groups, appearances };
  });
  let firstChanges: readonly Change[];
  try {
    firstChanges = changes(context.document, candidate);
  } catch {
    return failure('stale-target', 'Captured rearrangement placements are no longer available');
  }
  const first = context.preview(
    context.document,
    { ...intent, entries: normalized.value },
    firstChanges,
  );
  if (!first.ok) return first;
  if (first.value === null)
    return failure('invalid-edit', 'Native rearrangement preview produced no geometry');
  const firstPreview = first.value;
  const expected = expectedBoxes(context.document, normalized.value);
  if (!expected.ok) return expected;
  const firstMapResult = completePreview(context.document, first.value);
  if (!firstMapResult.ok) return firstMapResult;
  const firstMap = firstMapResult.value;
  const closure = closureKeys(context.document, entry);
  const selectedBefore = sceneBox(context.document, entry.target);
  if (selectedBefore === undefined)
    return failure('stale-target', 'The rearrangement target geometry is missing');
  const parentOrigin =
    selected.parent === null
      ? { x: scene.origin.x, y: scene.origin.y }
      : (() => {
          const item = scene.nodes.find((node) => node.id === selected.parent);
          return item === undefined
            ? { x: scene.origin.x, y: scene.origin.y }
            : { x: scene.origin.x + item.box.x, y: scene.origin.y + item.box.y };
        })();
  const wanted = {
    ...selectedBefore,
    x: parentOrigin.x + entry.placement.x,
    y: parentOrigin.y + entry.placement.y,
  };
  for (const [key, actual] of firstMap) {
    const target = first.value.boxes.find((item) => targetKey(item.target) === key)?.target;
    if (target === undefined)
      return failure('invalid-edit', 'Movement preview target identity is missing');
    if (
      target.kind === 'section' &&
      target.id === sectionId &&
      (actual.x !== scene.box.x || actual.y !== scene.box.y)
    )
      return { ok: true, value: null };
    const targetSection =
      target.kind === 'section' ? target.id : target.kind === 'node' ? target.section : null;
    if (targetSection !== null && targetSection !== sectionId) {
      const captured = sceneBox(context.document, target);
      if (captured === undefined || !exactBox(captured, actual)) return { ok: true, value: null };
    }
    if (closure.has(key)) {
      const expectedBox = key === targetKey(entry.target) ? wanted : expected.value.get(key);
      if (expectedBox === undefined || !exactBox(expectedBox, actual))
        return { ok: true, value: null };
    }
  }
  const geometryChanges = first.value.boxes.flatMap((item) => {
    const before = sceneBox(context.document, item.target);
    return before !== undefined && !exactBox(before, item.box)
      ? [{ target: item.target, before, after: item.box }]
      : [];
  });
  const selectedKey = targetKey(entry.target);
  const unselectedChange = geometryChanges.some(
    (change) =>
      targetKey(change.target) !== selectedKey &&
      ('section' in change.target ? change.target.section === sectionId : false),
  );
  if (!unselectedChange) return { ok: true, value: null };
  let finalSections: readonly Section[];
  try {
    finalSections = candidate.map((section) => {
      if (section.id !== sectionId) return section;
      const sectionBox = firstPreview.boxes.find(
        (item) => item.target.kind === 'section' && item.target.id === sectionId,
      )?.box;
      if (sectionBox === undefined) throw new Error('native rearrangement omitted section');
      const sectionPlacement = sourcePlacement(
        section.placement,
        scene.origin.x,
        scene.origin.y,
        sectionBox.width,
        sectionBox.height,
      );
      const groups = section.groups.map((group) => {
        const node = scene.nodes.find((item) => item.measured.groupId === group.id);
        if (node === undefined) throw new Error('native rearrangement omitted group');
        const box = firstPreview.boxes.find(
          (item) =>
            item.target.kind === 'node' &&
            item.target.section === sectionId &&
            item.target.id === node.id,
        )?.box;
        if (box === undefined) throw new Error('native rearrangement omitted group geometry');
        const parentBox =
          node.parent === null
            ? sectionBox
            : firstPreview.boxes.find(
                (item) =>
                  item.target.kind === 'node' &&
                  item.target.section === sectionId &&
                  item.target.id === node.parent,
              )?.box;
        if (parentBox === undefined)
          throw new Error('native rearrangement omitted parent geometry');
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
      });
      const appearances = section.appearances.map((appearance) => {
        const node = scene.nodes.find(
          (item) => item.measured.groupId === null && item.measured.objectId === appearance.object,
        );
        if (node === undefined) throw new Error('native rearrangement omitted appearance');
        const box = firstPreview.boxes.find(
          (item) =>
            item.target.kind === 'node' &&
            item.target.section === sectionId &&
            item.target.id === node.id,
        )?.box;
        if (box === undefined) throw new Error('native rearrangement omitted appearance geometry');
        const parentBox =
          node.parent === null
            ? sectionBox
            : firstPreview.boxes.find(
                (item) =>
                  item.target.kind === 'node' &&
                  item.target.section === sectionId &&
                  item.target.id === node.parent,
              )?.box;
        if (parentBox === undefined)
          throw new Error('native rearrangement omitted appearance parent');
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
      });
      return { ...section, placement: sectionPlacement, groups, appearances };
    });
  } catch {
    return failure('invalid-edit', 'Rearrangement native preview omitted required geometry');
  }
  let finalChanges: readonly Change[];
  try {
    finalChanges = changes(context.document, finalSections);
  } catch {
    return failure('invalid-edit', 'Rearrangement could not be materialized');
  }
  const second = context.preview(
    context.document,
    { ...intent, entries: normalized.value },
    finalChanges,
  );
  if (!second.ok) return second;
  if (second.value === null) return { ok: true, value: null };
  const secondMapResult = completePreview(context.document, second.value);
  if (!secondMapResult.ok) return secondMapResult;
  const secondMap = secondMapResult.value;
  for (const [key, firstBox] of firstMap) {
    const counterpart = secondMap.get(key);
    if (counterpart === undefined || !exactBox(counterpart, firstBox))
      return { ok: true, value: null };
  }
  for (const [key, firstBox] of firstMap) {
    const target = first.value.boxes.find((item) => targetKey(item.target) === key)?.target;
    if (target === undefined) return { ok: true, value: null };
    const targetSection =
      target.kind === 'section' ? target.id : target.kind === 'node' ? target.section : null;
    if (targetSection !== null && targetSection !== sectionId) {
      const captured = sceneBox(context.document, target);
      if (captured === undefined || !exactBox(captured, firstBox)) return { ok: true, value: null };
    }
    if (closure.has(key)) {
      const expectedBox = key === selectedKey ? wanted : expected.value.get(key);
      if (expectedBox === undefined || !exactBox(expectedBox, firstBox))
        return { ok: true, value: null };
    }
  }
  return {
    ok: true,
    value: {
      id: 'rearrange-section',
      kind: 'rearrange',
      label: 'Rearrange section',
      section: sectionId,
      changes: finalChanges,
      geometryChanges,
      preview: second.value,
    },
  };
}
