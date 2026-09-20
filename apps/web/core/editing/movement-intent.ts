import type { PlacementIntent, RenderDocument, SceneStamp } from '../../contract/records/owners.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
import { sceneBox, targetKey, type Box } from './movement-capture.js';

export function sameStamp(intent: PlacementIntent, stamp: SceneStamp): boolean {
  return (
    intent.base.collectionId === stamp.collectionId &&
    intent.base.revision === stamp.revision &&
    intent.base.inputKey === stamp.inputKey &&
    intent.base.generation === stamp.generation
  );
}

export function normalizedEntries(
  document: RenderDocument,
  intent: PlacementIntent,
): Result<readonly PlacementIntent['entries'][number][]> {
  const byKey = indexEntries(intent.entries);
  if (!byKey.ok) return byKey;
  const entries = [...byKey.value.values()];
  const conflict = entries
    .map((entry) => validateEntry(document, entry, byKey.value))
    .find((result) => !result.ok);
  if (conflict !== undefined) return conflict;
  return { ok: true, value: entries };
}

function indexEntries(
  entries: readonly PlacementIntent['entries'][number][],
): Result<ReadonlyMap<string, PlacementIntent['entries'][number]>> {
  const byKey = new Map<string, PlacementIntent['entries'][number]>();
  let result: Result<void> = { ok: true, value: undefined };
  entries.some((entry) => {
    const key = targetKey(entry.target);
    result = addEntry(byKey, key, entry);
    return !result.ok;
  });
  return entryIndexResult(result, byKey);
}

function entryIndexResult(
  result: Result<void>,
  entries: ReadonlyMap<string, PlacementIntent['entries'][number]>,
): Result<ReadonlyMap<string, PlacementIntent['entries'][number]>> {
  return result.ok ? { ok: true, value: entries } : result;
}

function addEntry(
  entries: Map<string, PlacementIntent['entries'][number]>,
  key: string,
  entry: PlacementIntent['entries'][number],
): Result<void> {
  if (entries.has(key))
    return failure('invalid-edit', 'Movement contains duplicate selected targets');
  entries.set(key, entry);
  return { ok: true, value: undefined };
}

function validateEntry(
  document: RenderDocument,
  entry: PlacementIntent['entries'][number],
  byKey: ReadonlyMap<string, PlacementIntent['entries'][number]>,
): Result<void> {
  if (entry.target.kind !== 'node') return { ok: true, value: undefined };
  return validateNodeEntry(document, entry, byKey);
}

function validateNodeEntry(
  document: RenderDocument,
  entry: PlacementIntent['entries'][number],
  byKey: ReadonlyMap<string, PlacementIntent['entries'][number]>,
): Result<void> {
  const sectionConflict = validateNodeSectionConflict(entry, byKey);
  if (!sectionConflict.ok) return sectionConflict;
  const captured = capturedNode(document, entry);
  if (!captured.ok) return captured;
  return validateParents(
    captured.value.section.nodes,
    captured.value.node.parent,
    captured.value.section.id,
    byKey,
  );
}

function validateNodeSectionConflict(
  entry: PlacementIntent['entries'][number],
  byKey: ReadonlyMap<string, PlacementIntent['entries'][number]>,
): Result<void> {
  if (entry.target.kind !== 'node') return { ok: true, value: undefined };
  return byKey.has(targetKey({ kind: 'section', id: entry.target.section }))
    ? failure('invalid-edit', 'Select either a section or one of its nodes, not both')
    : { ok: true, value: undefined };
}

function capturedNode(
  document: RenderDocument,
  entry: PlacementIntent['entries'][number],
): Result<{
  section: RenderDocument['scene']['sections'][number];
  node: RenderDocument['scene']['sections'][number]['nodes'][number];
}> {
  if (entry.target.kind !== 'node')
    return failure('unsupported-edit', 'Movement review supports module nodes and sections');
  const target = entry.target;
  const section = document.scene.sections.find((item) => item.id === target.section);
  const node = section?.nodes.find((item) => item.id === target.id);
  return section === undefined || node === undefined
    ? failure('stale-target', 'The selected movement target is missing')
    : { ok: true, value: { section, node } };
}

function validateParents(
  nodes: readonly { readonly id: string; readonly parent: string | null }[],
  initial: string | null,
  section: string,
  byKey: ReadonlyMap<string, unknown>,
): Result<void> {
  let parent = initial;
  let result: Result<string | null> = { ok: true, value: parent };
  while (parent !== null && (result = validateParent(nodes, parent, section, byKey)).ok) {
    parent = result.value;
  }
  return voidResult(result);
}

function voidResult(result: Result<string | null>): Result<void> {
  return result.ok ? { ok: true, value: undefined } : result;
}

function validateParent(
  nodes: readonly { readonly id: string; readonly parent: string | null }[],
  parent: string,
  section: string,
  byKey: ReadonlyMap<string, unknown>,
): Result<string | null> {
  if (byKey.has(targetKey({ kind: 'node', section, id: parent })))
    return failure('invalid-edit', 'Select either an ancestor or its descendant, not both');
  const parentNode = nodes.find((item) => item.id === parent);
  return parentNode === undefined
    ? failure('stale-target', 'The selected movement parent is missing')
    : { ok: true, value: parentNode.parent };
}

export function expectedBoxes(
  document: RenderDocument,
  entries: readonly PlacementIntent['entries'][number][],
): Result<ReadonlyMap<string, Box>> {
  const roots = indexExpectedRoots(document, entries);
  if (!roots.ok) return roots;
  const expected = new Map<string, Box>();
  for (const section of document.scene.sections) addExpectedSection(expected, section, roots.value);
  return { ok: true, value: expected };
}

function indexExpectedRoots(
  document: RenderDocument,
  entries: readonly PlacementIntent['entries'][number][],
): Result<ReadonlyMap<string, { section: string; dx: number; dy: number }>> {
  const roots = new Map<string, { section: string; dx: number; dy: number }>();
  let result: Result<void> = { ok: true, value: undefined };
  entries.some((entry) => {
    result = addExpectedRootEntry(document, roots, entry);
    return !result.ok;
  });
  return expectedRootIndexResult(result, roots);
}

function addExpectedRootEntry(
  document: RenderDocument,
  roots: Map<string, { section: string; dx: number; dy: number }>,
  entry: PlacementIntent['entries'][number],
): Result<void> {
  const root = expectedRoot(document, entry);
  return root.ok ? addExpectedRoot(roots, entry, root.value) : root;
}

function expectedRootIndexResult(
  result: Result<void>,
  roots: ReadonlyMap<string, { section: string; dx: number; dy: number }>,
): Result<ReadonlyMap<string, { section: string; dx: number; dy: number }>> {
  return result.ok ? { ok: true, value: roots } : result;
}

function addExpectedRoot(
  roots: Map<string, { section: string; dx: number; dy: number }>,
  entry: PlacementIntent['entries'][number],
  root: { section: string; dx: number; dy: number },
): Result<void> {
  roots.set(targetKey(entry.target), root);
  return { ok: true, value: undefined };
}

function expectedRoot(
  document: RenderDocument,
  entry: PlacementIntent['entries'][number],
): Result<{ section: string; dx: number; dy: number }> {
  if (entry.target.kind === 'section') return expectedSectionRoot(document, entry);
  if (entry.target.kind !== 'node')
    return failure('unsupported-edit', 'Movement review supports module nodes and sections');
  return expectedNodeRoot(document, entry);
}

function expectedSectionRoot(
  document: RenderDocument,
  entry: PlacementIntent['entries'][number],
): Result<{ section: string; dx: number; dy: number }> {
  if (entry.target.kind !== 'section')
    return failure('unsupported-edit', 'Movement review supports module nodes and sections');
  const section = document.scene.sections.find((item) => item.id === entry.target.id);
  return section === undefined
    ? failure('stale-target', 'The selected section is missing')
    : {
        ok: true,
        value: {
          section: section.id,
          dx: entry.placement.x - section.origin.x,
          dy: entry.placement.y - section.origin.y,
        },
      };
}

function expectedNodeRoot(
  document: RenderDocument,
  entry: PlacementIntent['entries'][number],
): Result<{ section: string; dx: number; dy: number }> {
  if (entry.target.kind !== 'node')
    return failure('unsupported-edit', 'Movement review supports module nodes and sections');
  const captured = capturedNode(document, entry);
  return captured.ok ? expectedNodeRootFromCapture(document, entry, captured.value) : captured;
}

function expectedNodeRootFromCapture(
  document: RenderDocument,
  entry: PlacementIntent['entries'][number],
  captured: {
    section: RenderDocument['scene']['sections'][number];
    node: RenderDocument['scene']['sections'][number]['nodes'][number];
  },
): Result<{ section: string; dx: number; dy: number }> {
  const translation = expectedNodeTranslation(document, entry, captured.section, captured.node);
  return translation.ok
    ? { ok: true, value: { section: captured.section.id, ...translation.value } }
    : translation;
}

function expectedNodeTranslation(
  document: RenderDocument,
  entry: PlacementIntent['entries'][number],
  section: RenderDocument['scene']['sections'][number],
  node: RenderDocument['scene']['sections'][number]['nodes'][number],
): Result<{ dx: number; dy: number }> {
  const parent = expectedNodeParent(section, node);
  if (!parent.ok) return parent;
  const before = sceneBox(document, entry.target);
  if (before === undefined) return failure('stale-target', 'The selected node geometry is missing');
  return {
    ok: true,
    value: {
      dx: section.origin.x + (parent.value?.box.x ?? 0) + entry.placement.x - before.x,
      dy: section.origin.y + (parent.value?.box.y ?? 0) + entry.placement.y - before.y,
    },
  };
}

function expectedNodeParent(
  section: RenderDocument['scene']['sections'][number],
  node: RenderDocument['scene']['sections'][number]['nodes'][number],
): Result<RenderDocument['scene']['sections'][number]['nodes'][number] | undefined> {
  if (node.parent === null) return { ok: true, value: undefined };
  const parent = section.nodes.find((item) => item.id === node.parent);
  return parent === undefined
    ? failure('stale-target', 'The selected node parent is missing')
    : { ok: true, value: parent };
}

function addExpectedSection(
  expected: Map<string, Box>,
  section: RenderDocument['scene']['sections'][number],
  roots: ReadonlyMap<string, { section: string; dx: number; dy: number }>,
): void {
  const sectionTarget = { kind: 'section' as const, id: section.id };
  const sectionRoot = roots.get(targetKey(sectionTarget));
  expected.set(targetKey(sectionTarget), translatedSectionBox(section.box, sectionRoot));
  section.nodes.forEach((node) => addExpectedNode(expected, section, node, roots, sectionRoot));
}

function translatedSectionBox(box: Box, root: { dx: number; dy: number } | undefined): Box {
  return root === undefined ? box : { ...box, x: box.x + root.dx, y: box.y + root.dy };
}

function addExpectedNode(
  expected: Map<string, Box>,
  section: RenderDocument['scene']['sections'][number],
  node: RenderDocument['scene']['sections'][number]['nodes'][number],
  roots: ReadonlyMap<string, { section: string; dx: number; dy: number }>,
  sectionRoot: { section: string; dx: number; dy: number } | undefined,
): void {
  let current: string | null = node.id;
  let root: { section: string; dx: number; dy: number } | undefined;
  while (current !== null && root === undefined) {
    root = roots.get(targetKey({ kind: 'node', section: section.id, id: current }));
    current = section.nodes.find((item) => item.id === current)?.parent ?? null;
  }
  root ??= sectionRoot;
  expected.set(
    targetKey({ kind: 'node', section: section.id, id: node.id }),
    translatedBox(node.box, root, section.origin.x, section.origin.y),
  );
}

function translatedBox(
  box: Box,
  root: { dx: number; dy: number } | undefined,
  originX: number,
  originY: number,
): Box {
  return root === undefined
    ? { ...box, x: box.x + originX, y: box.y + originY }
    : { ...box, x: box.x + originX + root.dx, y: box.y + originY + root.dy };
}

export function validateMoveIntent(
  intent: PlacementIntent,
  context: {
    readonly document: RenderDocument;
    readonly stamp: SceneStamp;
  },
): Result<void> {
  if (!sameStamp(intent, context.stamp))
    return failure('stale-gesture', 'The diagram changed while this gesture was being edited');
  return validateMoveTargets(intent, context.document);
}

function validateMoveTargets(intent: PlacementIntent, document: RenderDocument): Result<void> {
  if (intent.entries.some((entry) => !moduleTarget(document, entry)))
    return failure('unsupported-edit', 'Movement review supports module sections only');
  if (
    intent.entries.length === 0 ||
    intent.entries.some((entry) => !positionOnlyModule(document, entry))
  )
    return failure('unsupported-edit', 'Movement review supports position-only module moves');
  return { ok: true, value: undefined };
}

function moduleTarget(
  document: RenderDocument,
  entry: PlacementIntent['entries'][number],
): boolean {
  if (entry.target.kind === 'section')
    return document.projection.sections.some(
      (section) => section.id === entry.target.id && section.mode === 'modules',
    );
  if (entry.target.kind !== 'node') return false;
  const target = entry.target;
  return document.projection.sections.some(
    (section) => section.id === target.section && section.mode === 'modules',
  );
}

function positionOnlyModule(
  document: RenderDocument,
  entry: PlacementIntent['entries'][number],
): boolean {
  const sized = entry.placement.width !== undefined || entry.placement.height !== undefined;
  return !sized && (entry.target.kind === 'section' || moduleTarget(document, entry));
}
