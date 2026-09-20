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

const EPSILON = 0.5;

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

function pinnedSections(document: RenderDocument): readonly Section[] {
  return document.collection.sections.map((source) => {
    const scene = document.scene.sections.find((item) => item.id === source.id);
    if (scene === undefined) return source;

    const nodes = new Map(scene.nodes.map((node) => [node.id, node]));
    const groups = source.groups.map((group) => {
      const node = scene.nodes.find((candidate) => candidate.measured.groupId === group.id);
      if (node === undefined) return group;
      return {
        ...group,
        placement: sourcePlacement(
          group.placement,
          node.box.x - (node.parent === null ? 0 : nodes.get(node.parent)?.box.x ?? 0),
          node.box.y - (node.parent === null ? 0 : nodes.get(node.parent)?.box.y ?? 0),
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
      if (node === undefined) return appearance;
      const parent = node.parent === null ? undefined : nodes.get(node.parent);
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

    return {
      ...source,
      placement: sourcePlacement(
        source.placement,
        scene.origin.x,
        scene.origin.y,
        scene.box.width,
        scene.box.height,
      ),
      groups,
      appearances,
    };
  });
}

function plannedSections(
  document: RenderDocument,
  intent: PlacementIntent,
): readonly Section[] {
  const frozen = pinnedSections(document);
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

function previewBox(preview: GeometryPreview, target: Target): Box | undefined {
  return preview.boxes.find((item) => {
    if (item.target.kind !== target.kind) return false;
    if (item.target.kind === 'section' && target.kind === 'section')
      return item.target.id === target.id;
    if (item.target.kind === 'node' && target.kind === 'node')
      return item.target.section === target.section && item.target.id === target.id;
    return false;
  })?.box;
}

function equalBox(before: Box, after: Box): boolean {
  return (
    Math.abs(before.x - after.x) <= EPSILON &&
    Math.abs(before.y - after.y) <= EPSILON &&
    Math.abs(before.width - after.width) <= EPSILON &&
    Math.abs(before.height - after.height) <= EPSILON
  );
}

function targetKey(target: Target): string {
  return target.kind === 'section' ? `section:${target.id}` : target.kind === 'node' ? `node:${target.section}:${target.id}` : `${target.kind}:${target.section}:${target.id}`;
}

function allowedTargets(document: RenderDocument, intent: PlacementIntent): Set<string> {
  const selected = new Set(intent.entries.map((entry) => entry.target));
  const allowed = new Set<string>();
  for (const section of document.scene.sections) {
    for (const node of section.nodes) {
      const target = { kind: 'node' as const, section: section.id, id: node.id };
      let currentId: string | null = node.id;
      while (currentId !== null) {
        const current = { kind: 'node' as const, section: section.id, id: currentId };
        if ([...selected].some((item) => targetKey(item) === targetKey(current))) {
          allowed.add(targetKey(target));
          break;
        }
        currentId = section.nodes.find((candidate) => candidate.id === currentId)?.parent ?? null;
      }
      if ([...selected].some((item) => item.kind === 'section' && item.id === section.id)) allowed.add(targetKey(target));
    }
    if ([...selected].some((item) => item.kind === 'section' && item.id === section.id)) allowed.add(targetKey({ kind: 'section', id: section.id }));
  }
  return allowed;
}

function geometryChanges(
  document: RenderDocument,
  intent: PlacementIntent,
  preview: GeometryPreview,
): Result<readonly GeometryChange[]> {
  const targets = document.scene.sections.flatMap((section) => [
    { kind: 'section' as const, id: section.id },
    ...section.nodes.map((node) => ({
      kind: 'node' as const,
      section: section.id,
      id: node.id,
    })),
  ]);
  const result: GeometryChange[] = [];
  const allowed = allowedTargets(document, intent);
  for (const target of targets) {
    const before = sceneBox(document, target);
    const after = previewBox(preview, target);
    if (before === undefined || after === undefined)
      return failure('invalid-edit', 'Movement preview omitted an existing scene target');
    if (!equalBox(before, after)) {
      if (!allowed.has(targetKey(target)))
        return failure('invalid-edit', 'Movement changed geometry outside the effective selection');
      result.push({ target, before, after });
    }
  }
  return { ok: true, value: result };
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

  let sections: readonly Section[];
  try {
    sections = plannedSections(context.document, intent);
  } catch {
    return failure('stale-target', 'The movement target is no longer available');
  }
  const plannedChanges = changes(context.document, sections);
  const preview = context.preview(context.document, intent, plannedChanges);
  if (!preview.ok) return preview;
  if (preview.value === null)
    return failure('invalid-edit', 'Movement preview produced no geometry');
  const inspected = geometryChanges(context.document, intent, preview.value);
  if (!inspected.ok) return inspected;
  if (inspected.value.length === 0)
    return { ok: true, value: {
      id: intent.id,
      intent,
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
      intent,
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
