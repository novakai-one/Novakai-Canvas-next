import type { Box } from '@novakai/canvas-layout';
import type {
  Change,
  Placement,
  PlacementIntent,
  RenderDocument,
  SceneStamp,
  Section,
  Target,
} from '../../contract/records/owners.js';
import type { GeometryPreview } from '@novakai/canvas-canvas';
import type { Result } from '../../contract/errors.js';
import type {
  GeometryChange,
  MoveOption,
  MoveReview,
  MovementPreviewContext,
} from '../../contract/records/movement.js';
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

function pinnedSections(
  document: RenderDocument,
  intent: PlacementIntent,
): readonly Section[] {
  const affected = new Set(
    intent.entries
      .filter((entry) => entry.target.kind === 'node')
      .map((entry) => ('section' in entry.target ? entry.target.section : '')),
  );
  return document.collection.sections.map((source) => {
    const scene = document.scene.sections.find((item) => item.id === source.id);
    if (scene === undefined) throw new Error('captured section missing');
    const sectionPlacement = originPlacement(source.placement, scene.origin.x, scene.origin.y);
    if (!affected.has(source.id) || source.mode !== 'modules')
      return { ...source, placement: sectionPlacement };

    const nodes = new Map(scene.nodes.map((node) => [node.id, node]));
    const groups = source.groups.map((group) => {
      const node = scene.nodes.find((candidate) => candidate.measured.groupId === group.id);
      if (node === undefined) throw new Error('captured group missing');
      const parent = node.parent === null ? undefined : nodes.get(node.parent);
      if (node.parent !== null && parent === undefined)
        throw new Error('captured group parent missing');
      return {
        ...group,
        placement: sourcePlacement(
          group.placement,
          node.box.x - (parent?.box.x ?? 0),
          node.box.y - (parent?.box.y ?? 0),
          node.box.width,
          node.box.height,
        ),
      };
    });
    const appearances = source.appearances.map((appearance) => {
      const node = scene.nodes.find(
        (candidate) =>
          candidate.measured.groupId === null &&
          candidate.measured.objectId === appearance.object,
      );
      if (node === undefined) throw new Error('captured appearance missing');
      const parent = node.parent === null ? undefined : nodes.get(node.parent);
      if (node.parent !== null && parent === undefined)
        throw new Error('captured appearance parent missing');
      return {
        ...appearance,
        placement: sourcePlacement(
          appearance.placement,
          node.box.x - (parent?.box.x ?? 0),
          node.box.y - (parent?.box.y ?? 0),
          node.box.width,
          node.box.height,
        ),
      };
    });
    return { ...source, placement: sectionPlacement, groups, appearances };
  });
}

function plannedSections(
  document: RenderDocument,
  intent: PlacementIntent,
): readonly Section[] {
  const frozen = pinnedSections(document, intent);
  const pinnedDocument = {
    ...document,
    collection: { ...document.collection, sections: frozen },
  };
  return placeEntries(intent, pinnedDocument);
}

function changes(
  document: RenderDocument,
  sections: readonly Section[],
): readonly Change[] {
  return sections
    .filter(
      (section) =>
        document.collection.sections.find((item) => item.id === section.id) !== section,
    )
    .map((value) => ({ op: 'replace' as const, target: 'sections' as const, value }));
}

function sceneBox(document: RenderDocument, target: Target): Box | undefined {
  if (target.kind === 'section') {
    return document.scene.sections.find((section) => section.id === target.id)?.box;
  }
  if (target.kind !== 'node') return undefined;
  const section = document.scene.sections.find((item) => item.id === target.section);
  const node = section?.nodes.find((item) => item.id === target.id);
  if (section === undefined || node === undefined) return undefined;
  return {
    ...node.box,
    x: node.box.x + section.origin.x,
    y: node.box.y + section.origin.y,
  };
}

function targetKey(target: Target): string {
  return target.kind === 'section'
    ? `section:${target.id}`
    : target.kind === 'node'
      ? `node:${target.section}:${target.id}`
      : `${target.kind}:${target.section}:${target.id}`;
}

function exactBox(before: Box, after: Box): boolean {
  return (
    before.x === after.x &&
    before.y === after.y &&
    before.width === after.width &&
    before.height === after.height
  );
}

function normalizedEntries(
  document: RenderDocument,
  intent: PlacementIntent,
): Result<readonly PlacementIntent['entries'][number][]> {
  const byKey = new Map<string, PlacementIntent['entries'][number]>();
  for (const entry of intent.entries) {
    const key = targetKey(entry.target);
    if (byKey.has(key)) return failure('invalid-edit', 'Movement contains duplicate selected targets');
    byKey.set(key, entry);
  }
  const entries = [...byKey.values()];
  for (const entry of entries) {
    if (entry.target.kind !== 'node') continue;
    if (byKey.has(targetKey({ kind: 'section', id: entry.target.section })))
      return failure('invalid-edit', 'Select either a section or one of its nodes, not both');
  }
  for (const entry of entries) {
    if (entry.target.kind !== 'node') continue;
    const section = document.scene.sections.find((item) => item.id === ('section' in entry.target ? entry.target.section : ''));
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
  }
  return { ok: true, value: entries };
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
    const section = document.scene.sections.find((item) => item.id === ('section' in entry.target ? entry.target.section : ''));
    const node = section?.nodes.find((item) => item.id === entry.target.id);
    if (section === undefined || node === undefined)
      return failure('stale-target', 'The selected node is missing');
    const parent = node.parent === null ? undefined : section.nodes.find((item) => item.id === node.parent);
    if (node.parent !== null && parent === undefined)
      return failure('stale-target', 'The selected node parent is missing');
    const parentX = section.origin.x + (parent?.box.x ?? 0);
    const parentY = section.origin.y + (parent?.box.y ?? 0);
    const before = worldBox(document, entry.target);
    if (before === undefined) return failure('stale-target', 'The selected node geometry is missing');
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
    expected.set(targetKey(sectionTarget), sectionRoot === undefined ? sectionBox : {
      ...sectionBox,
      x: sectionBox.x + sectionRoot.dx,
      y: sectionBox.y + sectionRoot.dy,
    });
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
      expected.set(targetKey(target), root === undefined ? { ...node.box, x: node.box.x + section.origin.x, y: node.box.y + section.origin.y } : {
        ...node.box,
        x: node.box.x + section.origin.x + root.dx,
        y: node.box.y + section.origin.y + root.dy,
      });
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
    if (actual.has(key)) return failure('invalid-edit', 'Movement preview contains duplicate geometry targets');
    actual.set(key, item.box);
  }
  if (actual.size !== expected.value.size)
    return failure('invalid-edit', 'Movement preview contains an unexpected geometry target set');
  for (const key of expected.value.keys()) {
    if (!actual.has(key)) return failure('invalid-edit', 'Movement preview omitted a captured geometry target');
  }
  const changes: GeometryChange[] = [];
  for (const [key, before] of expected.value) {
    const after = actual.get(key)!;
    if (!exactBox(before, after))
      return failure('invalid-edit', 'Movement preview does not match the requested geometry');
    const target = preview.boxes.find((item) => targetKey(item.target) === key)!.target;
    const captured = worldBox(document, target);
    if (captured === undefined) return failure('stale-target', 'Movement preview target is not captured');
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
  if (intent.entries.some((entry) => entry.target.kind === 'section' && context.document.projection.sections.every((section) => section.id !== entry.target.id || section.mode !== 'modules')))
    return failure('unsupported-edit', 'Movement review supports module sections only');
  if (
    intent.entries.length === 0 ||
    intent.entries.some((entry) => {
      if (entry.placement.width !== undefined || entry.placement.height !== undefined) return true;
      if (entry.target.kind === 'section') return false;
      if (entry.target.kind !== 'node') return true;
      return !context.document.projection.sections.some(
        (section) => section.id === ('section' in entry.target ? entry.target.section : '') && section.mode === 'modules',
      );
    })
  )
    return failure(
      'unsupported-edit',
      'Movement review supports position-only module moves',
    );
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
  const preview = context.preview(context.document, { ...intent, entries: normalized.value }, plannedChanges);
  if (!preview.ok) return preview;
  if (preview.value === null)
    return failure('invalid-edit', 'Movement preview produced no geometry');
  const inspected = geometryChanges(context.document, normalized.value, preview.value);
  if (!inspected.ok) return inspected;
  if (inspected.value.length === 0)
    return { ok: true, value: {
      id: intent.id,
      intent: { ...intent, entries: normalized.value },
      stamp: context.stamp,
      collectionId: context.document.collection.id,
      revision: context.document.collection.revision,
      options: [],
      selectedOption: null,
      reason: 'The requested position produced no changed geometry.',
    } };

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
    return failure(
      'stale-gesture',
      'The diagram changed while this move was under review',
    );
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
  if (!sameStamp(intent, context.stamp) || context.preview === undefined) return { ok: true, value: null };
  const normalized = normalizedEntries(context.document, intent);
  if (!normalized.ok || normalized.value.length !== 1) return { ok: true, value: null };
  const entry = normalized.value[0];
  if (entry === undefined || entry.target.kind !== 'node') return { ok: true, value: null };
  const sectionId = 'section' in entry.target ? entry.target.section : '';
  const sceneSection = context.document.scene.sections.find((item) => item.id === sectionId);
  const node = sceneSection?.nodes.find((item) => item.id === entry.target.id);
  if (sceneSection === undefined || node === undefined || node.parent === null) return { ok: true, value: null };
  const parent = sceneSection.nodes.find((item) => item.id === node.parent);
  if (node.parent !== null && parent === undefined) return { ok: true, value: null };
  const before = worldBox(context.document, entry.target);
  if (before === undefined) return { ok: true, value: null };
  const parentX = sceneSection.origin.x + (parent?.box.x ?? 0);
  const parentY = sceneSection.origin.y + (parent?.box.y ?? 0);
  const dx = parentX + entry.placement.x - before.x;
  const dy = parentY + entry.placement.y - before.y;
  const groupNode = parent;
  if (groupNode === undefined) return { ok: true, value: null };
  const expanded = new Map<string, { node: typeof groupNode; width: number; height: number }>();
  let ancestor: typeof groupNode | undefined = groupNode;
  let requiredRight = before.x + dx + before.width;
  let requiredBottom = before.y + dy + before.height;
  while (ancestor !== undefined) {
    const children = sceneSection.nodes.filter((item) => item.parent === ancestor?.id);
    const childRight = children.reduce((value, item) => Math.max(value, item.box.x + item.box.width), ancestor.box.x);
    const childBottom = children.reduce((value, item) => Math.max(value, item.box.y + item.box.height), ancestor.box.y);
    const rightReserve = ancestor.box.x + ancestor.box.width - childRight;
    const bottomReserve = ancestor.box.y + ancestor.box.height - childBottom;
    const width = Math.max(ancestor.box.width, requiredRight - ancestor.box.x + rightReserve);
    const height = Math.max(ancestor.box.height, requiredBottom - ancestor.box.y + bottomReserve);
    requiredRight = Math.max(requiredRight, ancestor.box.x + width);
    requiredBottom = Math.max(requiredBottom, ancestor.box.y + height);
    if (ancestor.measured.groupId !== null) { expanded.set(ancestor.measured.groupId, { node: ancestor, width, height }); }
    ancestor = ancestor.parent === null ? undefined : sceneSection.nodes.find((item) => item.id === ancestor?.parent);
  }
  if (expanded.size === 0 || [...expanded.values()].every(({ node, width, height }) => width === node.box.width && height === node.box.height)) {
    return { ok: true, value: null };
  }
  const planned = plannedSections(context.document, { ...intent, entries: normalized.value }).map((candidate) => {
    if (candidate.id !== sceneSection.id) return candidate;
    return {
      ...candidate,
      groups: candidate.groups.map((group) => {
        const change = expanded.get(group.id);
        if (change === undefined) return group;
        const source = candidate.groups.find((item) => item.id === group.id);
        if (source === undefined) return group;
        const groupParent = change.node.parent === null ? undefined : sceneSection.nodes.find((item) => item.id === change.node.parent);
        const placement = sourcePlacement(source.placement, change.node.box.x - (groupParent?.box.x ?? 0), change.node.box.y - (groupParent?.box.y ?? 0), change.width, change.height);
        return { ...group, placement };
      }),
    };
  });
  const plannedChanges = changes(context.document, planned);
  const preview = context.preview(context.document, { ...intent, entries: normalized.value }, plannedChanges);
  if (!preview.ok || preview.value === null) return { ok: true, value: null };
  const expected = expectedBoxes(context.document, normalized.value);
  if (!expected.ok) return expected;
  const expectedWithExpansion = new Map(expected.value);
  const expandedSection = preview.value.boxes.find((item) => item.target.kind === 'section' && item.target.id === sceneSection.id);
  if (expandedSection !== undefined) expectedWithExpansion.set(targetKey(expandedSection.target), expandedSection.box);
  for (const change of expanded.values()) {
    const target: Target = { kind: 'node', section: sceneSection.id, id: change.node.id };
    const prior = worldBox(context.document, target);
    if (prior === undefined) return { ok: true, value: null };
    expectedWithExpansion.set(targetKey(target), { ...prior, width: change.width, height: change.height });
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
    if (after === undefined || item === undefined || !exactBox(after, expectedBox)) return { ok: true, value: null };
    const prior = sceneBox(context.document, item.target);
    if (prior === undefined) return { ok: true, value: null };
    if (!exactBox(prior, after)) geometryChanges.push({ target: item.target, before: prior, after });
  }
  if (geometryChanges.length === 0) return { ok: true, value: null };
  return { ok: true, value: { id: 'expand-container', kind: 'expand', label: 'Expand container', section: sceneSection.id, changes: plannedChanges, geometryChanges, preview: preview.value } };
}
