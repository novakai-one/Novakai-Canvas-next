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
