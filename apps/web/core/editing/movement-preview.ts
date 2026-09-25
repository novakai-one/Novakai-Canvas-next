/*
 * Verifying a movement preview against the captured geometry: every captured target appears once,
 * and each box either matches exactly or moved by a rule the canvas allows (grown container, pushed
 * sibling, stopped-short drop, refitted section). Pure; Authoring owns commit and recovery.
 */
import type { PlacementIntent, RenderDocument, Target } from '../../contract/records/owners.js';
import type { Result } from '../../contract/errors.js';
import type { GeometryChange, MoveOption } from '../../contract/records/movement.js';
import { failure } from '../../contract/errors.js';
import { exactBox, sceneBox, targetKey, type Box } from './capture/boxes.js';
import { expectedBoxes } from './movement-intent.js';
import { collectResults, mapResults } from './results.js';

type GeometryPreview = MoveOption['preview'];

/** One preview box: the target and where it ended up. */
type PreviewBox = GeometryPreview['boxes'][number];

/** The preview indexed by target key: every captured target, exactly once, boxes only. */
export function completePreview(
  document: RenderDocument,
  preview: GeometryPreview,
): Result<ReadonlyMap<string, Box>> {
  const expected = expectedKeys(document);
  const actual = indexCompletePreview(preview, expected);
  if (!actual.ok) return actual;
  return verifyComplete(actual.value, expected);
}

/** The geometry changes of a preview: each expected box checked against the captured one. */
export function geometryChanges(
  document: RenderDocument,
  entries: readonly PlacementIntent['entries'][number][],
  preview: GeometryPreview,
): Result<readonly GeometryChange[]> {
  const expected = expectedBoxes(document, entries);
  if (!expected.ok) return expected;
  return inspectGeometry(document, expected.value, preview);
}

/** Two coordinates are equal within a hundredth of a unit. */
function near(
  a: number,
  b: number,
): boolean {
  return Math.abs(a - b) < 0.01;
}

/** Two boxes have the same width and height. */
function sameSize(
  expected: Box,
  actual: Box,
): boolean {
  return near(actual.width, expected.width) && near(actual.height, expected.height);
}

/** Every scene section key and every scene node key. */
function expectedKeys(document: RenderDocument): readonly string[] {
  const sections = document.scene.sections.map((section) =>
    targetKey({ kind: 'section', id: section.id }),
  );
  const nodes = document.scene.sections.flatMap((section) =>
    section.nodes.map((node) => targetKey({ kind: 'node', section: section.id, id: node.id })),
  );
  return [...sections, ...nodes];
}

/** The preview keyed by target; unexpected or duplicate keys are rejected. */
function indexCompletePreview(
  preview: GeometryPreview,
  expected: readonly string[],
): Result<ReadonlyMap<string, Box>> {
  const entries = mapResults(preview.boxes, (item) => completeEntry(expected, item));
  if (!entries.ok) return entries;
  return uniqueKeys(entries.value);
}

/** One expected preview entry as a key/box pair. */
function completeEntry(
  expected: readonly string[],
  item: PreviewBox,
): Result<readonly [string, Box]> {
  const key = targetKey(item.target);
  if (!expected.includes(key)) {
    return failure(
      'invalid-edit',
      'Movement preview contains an unexpected or duplicate geometry target',
    );
  }
  return { ok: true, value: [key, item.box] };
}

/** The entries as a map; a repeated key is rejected. */
function uniqueKeys<V>(entries: readonly (readonly [string, V])[]): Result<ReadonlyMap<string, V>> {
  const keys = entries.map(([key]) => key);
  if (new Set(keys).size !== keys.length) {
    return failure(
      'invalid-edit',
      'Movement preview contains an unexpected or duplicate geometry target',
    );
  }
  return { ok: true, value: new Map(entries) };
}

/** The whole captured set is present in the preview. */
function verifyComplete(
  actual: ReadonlyMap<string, Box>,
  expected: readonly string[],
): Result<ReadonlyMap<string, Box>> {
  const complete = actual.size === expected.length && expected.every((key) => actual.has(key));
  if (!complete) {
    return failure(
      'invalid-edit',
      'Movement preview did not preserve the complete captured target set',
    );
  }
  return { ok: true, value: actual };
}

/** The preview indexed by target key; duplicates are rejected. */
function inspectGeometry(
  document: RenderDocument,
  expected: ReadonlyMap<string, Box>,
  preview: GeometryPreview,
): Result<readonly GeometryChange[]> {
  const actual = indexMovePreview(preview);
  if (!actual.ok) return actual;
  return inspectGeometryTargets(document, expected, actual.value, preview);
}

/** The preview keyed by target, keeping each target's identity. */
function indexMovePreview(preview: GeometryPreview): Result<ReadonlyMap<string, PreviewBox>> {
  const entries = mapResults(preview.boxes, movePreviewEntry);
  if (!entries.ok) return entries;
  const keyed = uniqueKeys(entries.value);
  return keyed;
}

/** One preview entry as a key/box pair. */
function movePreviewEntry(item: PreviewBox): Result<readonly [string, PreviewBox]> {
  return { ok: true, value: [targetKey(item.target), item] };
}

/** The preview's target set matches the captured set exactly. */
function inspectGeometryTargets(
  document: RenderDocument,
  expected: ReadonlyMap<string, Box>,
  actual: ReadonlyMap<string, PreviewBox>,
  preview: GeometryPreview,
): Result<readonly GeometryChange[]> {
  const targetSet = validateMoveTargetSet(actual, expected);
  if (!targetSet.ok) return targetSet;
  return inspectExpectedGeometry(document, expected, actual, preview);
}

/** The target sets match in size, then key by key. */
function validateMoveTargetSet(
  actual: ReadonlyMap<string, PreviewBox>,
  expected: ReadonlyMap<string, Box>,
): Result<void> {
  if (actual.size !== expected.size)
    return failure('invalid-edit', 'Movement preview contains an unexpected geometry target set');
  return expectedKeysComplete(actual, expected);
}

/** Every expected key is present in the preview. */
function expectedKeysComplete(
  actual: ReadonlyMap<string, PreviewBox>,
  expected: ReadonlyMap<string, Box>,
): Result<void> {
  const missing = [...expected.keys()].find((key) => !actual.has(key));
  if (missing !== undefined) {
    return failure('invalid-edit', 'Movement preview omitted a captured geometry target');
  }
  return { ok: true, value: undefined };
}

/** Every expected box, checked against its preview box. */
function inspectExpectedGeometry(
  document: RenderDocument,
  expected: ReadonlyMap<string, Box>,
  actual: ReadonlyMap<string, PreviewBox>,
  preview: GeometryPreview,
): Result<readonly GeometryChange[]> {
  return collectResults([...expected.entries()], ([key, before]) =>
    inspectExpectedItem(document, before, actual.get(key), preview),
  );
}

/** One expected box; its preview entry must exist. */
function inspectExpectedItem(
  document: RenderDocument,
  expected: Box,
  item: PreviewBox | undefined,
  preview: GeometryPreview,
): Result<GeometryChange | undefined> {
  if (item === undefined) {
    return failure('invalid-edit', 'Movement preview omitted a captured geometry target');
  }
  return inspectGeometryItem(document, expected, item, preview);
}

/** One box: an allowed movement, an exact match, or a mismatch failure. */
function inspectGeometryItem(
  document: RenderDocument,
  expected: Box,
  item: PreviewBox,
  preview: GeometryPreview,
): Result<GeometryChange | undefined> {
  if (matchesAllowedMovement(document, item, expected, preview)) {
    return inspectMatchedGeometry(document, item, preview);
  }
  return inspectExactGeometry(document, expected, item, preview);
}

/** The box moved by a rule the canvas allows. */
function matchesAllowedMovement(
  document: RenderDocument,
  item: PreviewBox,
  expected: Box,
  preview: GeometryPreview,
): boolean {
  return (
    grewToHold(document, item.target, expected, item.box) ||
    pushedAside(document, item.target, expected, item.box, preview) ||
    stoppedShort(document, item.target, expected, item.box) ||
    refitted(item.target, expected, item.box)
  );
}

/** Not an allowed movement: only an exact box match passes. */
function inspectExactGeometry(
  document: RenderDocument,
  expected: Box,
  item: PreviewBox,
  preview: GeometryPreview,
): Result<GeometryChange | undefined> {
  const exact = validateExpectedBox(expected, item.box);
  if (!exact.ok) return exact;
  return inspectMatchedGeometry(document, item, preview);
}

/** The requested and preview boxes match dimension for dimension. */
function validateExpectedBox(
  expected: Box,
  actual: Box,
): Result<void> {
  if (exactBox(expected, actual)) return { ok: true, value: undefined };
  return failure('invalid-edit', 'Movement preview does not match the requested geometry');
}

/** A section fits its content, so it may shrink or grow when a child moves; it never drifts. */
function refitted(
  target: Target,
  expected: Box,
  actual: Box,
): boolean {
  return target.kind === 'section' && near(actual.x, expected.x) && near(actual.y, expected.y);
}

/** A group or section may grow to hold a moved child; it never shrinks or drifts away. */
function grewToHold(
  document: RenderDocument,
  target: Target,
  expected: Box,
  actual: Box,
): boolean {
  return isContainerTarget(document, target) && holdsExpected(expected, actual);
}

/** A section, or a node inside a group, may grow to hold a moved child. */
function isContainerTarget(
  document: RenderDocument,
  target: Target,
): boolean {
  if (target.kind === 'section') return true;
  if (target.kind !== 'node') return false;
  return nodeGroupId(document, target) != null;
}

/** The group of a node target, when it sits in one. */
function nodeGroupId(
  document: RenderDocument,
  target: Extract<Target, { kind: 'node' }>,
) {
  return document.scene.sections
    .find((section) => section.id === target.section)
    ?.nodes.find((node) => node.id === target.id)?.measured.groupId;
}

/** The actual box covers the expected box, growing up and left at most. */
function holdsExpected(
  expected: Box,
  actual: Box,
): boolean {
  return (
    actual.x <= expected.x &&
    actual.y <= expected.y &&
    actual.x + actual.width >= expected.x + expected.width &&
    actual.y + actual.height >= expected.y + expected.height
  );
}

/** A grown section or group pushes a later sibling right or down; the pushed container keeps its
 * size and its contents travel with it. */
function pushedAside(
  document: RenderDocument,
  target: Target,
  expected: Box,
  actual: Box,
  preview: GeometryPreview,
): boolean {
  const sectionId = sectionOf(target);
  if (sectionId === null) return false;
  return containerChain(document, target, sectionId).some((container) =>
    pushedContainer(document, preview, container, expected, actual),
  );
}

/** The section a target belongs to. */
function sectionOf(target: Target): string | null {
  if (target.kind === 'section') return target.id;
  if (target.kind === 'node') return target.section;
  return null;
}

/** The target's group chain, innermost first, ending with its section. */
function containerChain(
  document: RenderDocument,
  target: Target,
  sectionId: string,
): readonly Target[] {
  const nodes = document.scene.sections.find((section) => section.id === sectionId)?.nodes ?? [];
  const groups = ancestorNodes(nodes, target).filter((node) => node.measured.groupId != null);
  const groupTargets = groups.map((node) => ({
    kind: 'node' as const,
    section: sectionId,
    id: node.id,
  }));
  return [...groupTargets, { kind: 'section', id: sectionId }];
}

/** The chain of nodes from the target up to the root. */
function ancestorNodes(
  nodes: readonly RenderDocument['scene']['sections'][number]['nodes'][number][],
  target: Target,
) {
  const first = target.kind === 'node' ? nodes.find((item) => item.id === target.id) : undefined;
  if (first === undefined) return [];
  return [first, ...ancestorsOf(nodes, first)];
}

/** The node's ancestors, nearest first. */
function ancestorsOf(
  nodes: readonly RenderDocument['scene']['sections'][number]['nodes'][number][],
  node: RenderDocument['scene']['sections'][number]['nodes'][number],
): readonly RenderDocument['scene']['sections'][number]['nodes'][number][] {
  const parent = node.parent === null ? undefined : nodes.find((item) => item.id === node.parent);
  if (parent === undefined) return [];
  return [parent, ...ancestorsOf(nodes, parent)];
}

/** A container was pushed right or down by an earlier sibling's growth, keeping its size. */
function pushedContainer(
  document: RenderDocument,
  preview: GeometryPreview,
  container: Target,
  expected: Box,
  actual: Box,
): boolean {
  const before = sceneBox(document, container);
  const after = preview.boxes.find((item) => targetKey(item.target) === targetKey(container))?.box;
  if (before === undefined || after === undefined) return false;
  return pushedGeometry(document, preview, container, before, after, expected, actual);
}

/** The container moved by the sibling's growth and matches the expected box after that move. */
function pushedGeometry(
  document: RenderDocument,
  preview: GeometryPreview,
  container: Target,
  before: Box,
  after: Box,
  expected: Box,
  actual: Box,
): boolean {
  const dx = after.x - before.x;
  const dy = after.y - before.y;
  return (
    pushedRightOrDown(dx, dy) &&
    sameSize(before, after) &&
    earlierSiblingGrew(document, preview, container, before, dx, dy) &&
    movedExactly(expected, actual, dx, dy)
  );
}

/** Pushed strictly right or down, and actually moved. */
function pushedRightOrDown(
  dx: number,
  dy: number,
): boolean {
  const moved = !near(dx, 0) || !near(dy, 0);
  return moved && dx >= -0.01 && dy >= -0.01;
}

/** The box moved by exactly dx, dy, keeping its size. */
function movedExactly(
  expected: Box,
  actual: Box,
  dx: number,
  dy: number,
): boolean {
  return (
    near(expected.x + dx, actual.x) && near(expected.y + dy, actual.y) && sameSize(expected, actual)
  );
}

/** Something before the pushed container, beside or above it, got bigger. */
function earlierSiblingGrew(
  document: RenderDocument,
  preview: GeometryPreview,
  pushed: Target,
  at: Box,
  dx: number,
  dy: number,
): boolean {
  return preview.boxes.some((item) => siblingGrewBefore(document, item, pushed, at, dx, dy));
}

/** One earlier sibling of the same kind grew before the pushed container. */
function siblingGrewBefore(
  document: RenderDocument,
  item: PreviewBox,
  pushed: Target,
  at: Box,
  dx: number,
  dy: number,
): boolean {
  if (!isOtherSibling(item, pushed)) return false;
  const was = sceneBox(document, item.target);
  return was !== undefined && grewBefore(item.box, was, at, dx, dy);
}

/** The same kind of target, but not the pushed one. */
function isOtherSibling(
  item: PreviewBox,
  pushed: Target,
): boolean {
  return item.target.kind === pushed.kind && targetKey(item.target) !== targetKey(pushed);
}

/** The sibling grew, and it sat beside or above the pushed container. */
function grewBefore(
  box: Box,
  was: Box,
  at: Box,
  dx: number,
  dy: number,
): boolean {
  return grewBy(box, was) && satBefore(was, at, dx, dy);
}

/** The box grew in width or height. */
function grewBy(
  box: Box,
  was: Box,
): boolean {
  return box.width > was.width + 0.01 || box.height > was.height + 0.01;
}

/** The box sat beside the pushed container (when pushed right) or above it (when pushed down). */
function satBefore(
  was: Box,
  at: Box,
  dx: number,
  dy: number,
): boolean {
  return (
    (dx > 0.01 && was.x + was.width <= at.x + 0.01) ||
    (dy > 0.01 && was.y + was.height <= at.y + 0.01)
  );
}

/** A dragged node may stop at its group's inset, between where it was and where it was dropped. */
function stoppedShort(
  document: RenderDocument,
  target: Target,
  expected: Box,
  actual: Box,
): boolean {
  if (target.kind !== 'node') return false;
  return stoppedBetween(sceneBox(document, target), expected, actual);
}

/** The node kept its size and sits between its captured and requested positions. */
function stoppedBetween(
  before: Box | undefined,
  expected: Box,
  actual: Box,
): boolean {
  if (before === undefined) return false;
  return sameSize(expected, actual) && betweenBoxes(before, expected, actual);
}

/** Both coordinates of the actual box sit between the captured and requested ones. */
function betweenBoxes(
  before: Box,
  expected: Box,
  actual: Box,
): boolean {
  return between(before.x, expected.x, actual.x) && between(before.y, expected.y, actual.y);
}

/** v sits between a and b, within a hundredth of a unit. */
function between(
  a: number,
  b: number,
  v: number,
): boolean {
  return v >= Math.min(a, b) - 0.01 && v <= Math.max(a, b) + 0.01;
}

/** The matched preview box becomes a change when it differs from the captured one. */
function inspectMatchedGeometry(
  document: RenderDocument,
  item: PreviewBox,
  preview: GeometryPreview,
): Result<GeometryChange | undefined> {
  const matched = preview.boxes.find(
    (candidate) => targetKey(candidate.target) === targetKey(item.target),
  );
  if (matched === undefined) {
    return failure('invalid-edit', 'Movement preview omitted a captured target identity');
  }
  return inspectCapturedGeometry(document, matched.target, item.box);
}

/** A change when the preview box differs from the captured box; nothing when equal. */
function inspectCapturedGeometry(
  document: RenderDocument,
  target: Target,
  after: Box,
): Result<GeometryChange | undefined> {
  const captured = sceneBox(document, target);
  if (captured === undefined) {
    return failure('stale-target', 'Movement preview target is not captured');
  }
  if (exactBox(captured, after)) return { ok: true, value: undefined };
  return { ok: true, value: { target, before: captured, after } };
}
