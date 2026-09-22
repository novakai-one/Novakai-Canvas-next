import type { PlacementIntent, RenderDocument, Target } from '../../contract/records/owners.js';
import type { Result } from '../../contract/errors.js';
import type { GeometryChange, MoveOption } from '../../contract/records/movement.js';
import { failure } from '../../contract/errors.js';
import { exactBox, sceneBox, targetKey, type Box } from './movement-capture.js';
import { expectedBoxes } from './movement-intent.js';

type GeometryPreview = MoveOption['preview'];

export function completePreview(
  document: RenderDocument,
  preview: GeometryPreview,
): Result<ReadonlyMap<string, Box>> {
  const expected = [
    ...document.scene.sections.map((section) =>
      targetKey({ kind: 'section' as const, id: section.id }),
    ),
    ...document.scene.sections.flatMap((section) =>
      section.nodes.map((node) => targetKey({ kind: 'node', section: section.id, id: node.id })),
    ),
  ];
  const actualResult = indexCompletePreview(preview, expected);
  if (!actualResult.ok) return actualResult;
  const actual = actualResult.value;
  if (actual.size !== expected.length || !expected.every((key) => actual.has(key)))
    return failure(
      'invalid-edit',
      'Movement preview did not preserve the complete captured target set',
    );
  return { ok: true, value: actual };
}

function indexCompletePreview(
  preview: GeometryPreview,
  expected: readonly string[],
): Result<ReadonlyMap<string, Box>> {
  const actual = new Map<string, Box>();
  let result: Result<void> = { ok: true, value: undefined };
  preview.boxes.some((item) => {
    result = addPreviewItem(actual, expected, item.target, item.box);
    return !result.ok;
  });
  return result.ok ? { ok: true, value: actual } : result;
}

function addPreviewItem(
  actual: Map<string, Box>,
  expected: readonly string[],
  target: Target,
  box: Box,
): Result<void> {
  const key = targetKey(target);
  if (!expected.includes(key) || actual.has(key))
    return failure(
      'invalid-edit',
      'Movement preview contains an unexpected or duplicate geometry target',
    );
  actual.set(key, box);
  return { ok: true, value: undefined };
}

export function geometryChanges(
  document: RenderDocument,
  entries: readonly PlacementIntent['entries'][number][],
  preview: GeometryPreview,
): Result<readonly GeometryChange[]> {
  const expected = expectedBoxes(document, entries);
  return expected.ok ? inspectGeometry(document, expected.value, preview) : expected;
}

function inspectGeometry(
  document: RenderDocument,
  expected: ReadonlyMap<string, Box>,
  preview: GeometryPreview,
): Result<readonly GeometryChange[]> {
  const actual = indexMovePreview(preview);
  return actual.ok ? inspectGeometryTargets(document, expected, actual.value, preview) : actual;
}

function inspectGeometryTargets(
  document: RenderDocument,
  expected: ReadonlyMap<string, Box>,
  actual: ReadonlyMap<string, { target: Target; box: Box }>,
  preview: GeometryPreview,
): Result<readonly GeometryChange[]> {
  const targetSet = validateMoveTargetSet(actual, expected);
  return targetSet.ok ? inspectExpectedGeometry(document, expected, actual, preview) : targetSet;
}

function indexMovePreview(
  preview: GeometryPreview,
): Result<ReadonlyMap<string, { target: Target; box: Box }>> {
  const actual = new Map<string, { target: Target; box: Box }>();
  let result: Result<void> = { ok: true, value: undefined };
  preview.boxes.some((item) => {
    result = addMovePreviewItem(actual, item.target, item.box);
    return !result.ok;
  });
  return result.ok ? { ok: true, value: actual } : result;
}

function addMovePreviewItem(
  actual: Map<string, { target: Target; box: Box }>,
  target: Target,
  box: Box,
): Result<void> {
  const key = targetKey(target);
  if (actual.has(key))
    return failure('invalid-edit', 'Movement preview contains duplicate geometry targets');
  actual.set(key, { target, box });
  return { ok: true, value: undefined };
}

function validateMoveTargetSet(
  actual: ReadonlyMap<string, { target: Target; box: Box }>,
  expected: ReadonlyMap<string, Box>,
): Result<void> {
  if (actual.size !== expected.size)
    return failure('invalid-edit', 'Movement preview contains an unexpected geometry target set');
  return expectedKeysComplete(actual, expected);
}

function expectedKeysComplete(
  actual: ReadonlyMap<string, { target: Target; box: Box }>,
  expected: ReadonlyMap<string, Box>,
): Result<void> {
  const missing = [...expected.keys()].find((key) => !actual.has(key));
  return missing === undefined
    ? { ok: true, value: undefined }
    : failure('invalid-edit', 'Movement preview omitted a captured geometry target');
}

function inspectExpectedGeometry(
  document: RenderDocument,
  expected: ReadonlyMap<string, Box>,
  actual: ReadonlyMap<string, { target: Target; box: Box }>,
  preview: GeometryPreview,
): Result<readonly GeometryChange[]> {
  const changes: GeometryChange[] = [];
  let result: Result<GeometryChange | undefined> = { ok: true, value: undefined };
  [...expected.entries()].some(([key, before]) => {
    result = inspectExpectedItem(document, before, actual.get(key), preview);
    if (result.ok && result.value !== undefined) changes.push(result.value);
    return !result.ok;
  });
  return result.ok ? { ok: true, value: changes } : result;
}

function inspectExpectedItem(
  document: RenderDocument,
  expected: Box,
  item: { target: Target; box: Box } | undefined,
  preview: GeometryPreview,
): Result<GeometryChange | undefined> {
  return item === undefined
    ? failure('invalid-edit', 'Movement preview omitted a captured geometry target')
    : inspectGeometryItem(document, expected, item, preview);
}

function inspectGeometryItem(
  document: RenderDocument,
  expected: Box,
  item: { target: Target; box: Box },
  preview: GeometryPreview,
): Result<GeometryChange | undefined> {
  const expectedMatch =
    grewToHold(document, item.target, expected, item.box) ||
    pushedAside(document, item.target, expected, item.box, preview) ||
    stoppedShort(document, item.target, expected, item.box)
      ? { ok: true as const, value: undefined }
      : validateExpectedBox(expected, item.box);
  return expectedMatch.ok ? inspectMatchedGeometry(document, item, preview) : expectedMatch;
}

/** A group or section may grow to hold a moved child; it never shrinks or drifts away. */
function grewToHold(document: RenderDocument, target: Target, expected: Box, actual: Box): boolean {
  const container =
    target.kind === 'section' ||
    (target.kind === 'node' &&
      document.scene.sections
        .find((section) => section.id === target.section)
        ?.nodes.find((node) => node.id === target.id)?.measured.groupId != null);
  return (
    container &&
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
  const sectionId =
    target.kind === 'section' ? target.id : target.kind === 'node' ? target.section : null;
  if (sectionId === null) return false;
  const nodes = document.scene.sections.find((section) => section.id === sectionId)?.nodes ?? [];
  const chain: Target[] = [];
  for (let id: string | null = target.kind === 'node' ? target.id : null; id !== null;) {
    const node = nodes.find((item) => item.id === id);
    if (node === undefined) break;
    if (node.measured.groupId != null)
      chain.push({ kind: 'node', section: sectionId, id: node.id });
    id = node.parent;
  }
  chain.push({ kind: 'section', id: sectionId });
  const near = (a: number, b: number) => Math.abs(a - b) < 0.01;
  return chain.some((container) => {
    const before = sceneBox(document, container);
    const after = preview.boxes.find(
      (item) => targetKey(item.target) === targetKey(container),
    )?.box;
    if (before === undefined || after === undefined) return false;
    const dx = after.x - before.x,
      dy = after.y - before.y;
    if (dx < -0.01 || dy < -0.01 || (near(dx, 0) && near(dy, 0))) return false;
    if (!near(after.width, before.width) || !near(after.height, before.height)) return false;
    if (!earlierSiblingGrew(document, preview, container, before, dx, dy)) return false;
    return (
      near(expected.x + dx, actual.x) &&
      near(expected.y + dy, actual.y) &&
      near(expected.width, actual.width) &&
      near(expected.height, actual.height)
    );
  });
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
  return preview.boxes.some((item) => {
    if (item.target.kind !== pushed.kind || targetKey(item.target) === targetKey(pushed))
      return false;
    const was = sceneBox(document, item.target);
    if (was === undefined) return false;
    const grew = item.box.width > was.width + 0.01 || item.box.height > was.height + 0.01;
    const before =
      (dx > 0.01 && was.x + was.width <= at.x + 0.01) ||
      (dy > 0.01 && was.y + was.height <= at.y + 0.01);
    return grew && before;
  });
}

/** A dragged node may stop at its group's inset, between where it was and where it was dropped. */
function stoppedShort(
  document: RenderDocument,
  target: Target,
  expected: Box,
  actual: Box,
): boolean {
  const before = sceneBox(document, target);
  if (target.kind !== 'node' || before === undefined) return false;
  const between = (a: number, b: number, v: number) =>
    v >= Math.min(a, b) - 0.01 && v <= Math.max(a, b) + 0.01;
  return (
    Math.abs(actual.width - expected.width) < 0.01 &&
    Math.abs(actual.height - expected.height) < 0.01 &&
    between(before.x, expected.x, actual.x) &&
    between(before.y, expected.y, actual.y)
  );
}

function validateExpectedBox(expected: Box, actual: Box): Result<void> {
  return exactBox(expected, actual)
    ? { ok: true, value: undefined }
    : failure('invalid-edit', 'Movement preview does not match the requested geometry');
}

function inspectMatchedGeometry(
  document: RenderDocument,
  item: { target: Target; box: Box },
  preview: GeometryPreview,
): Result<GeometryChange | undefined> {
  const matched = preview.boxes.find(
    (candidate) => targetKey(candidate.target) === targetKey(item.target),
  );
  return matched === undefined
    ? failure('invalid-edit', 'Movement preview omitted a captured target identity')
    : inspectCapturedGeometry(document, matched.target, item.box);
}

function inspectCapturedGeometry(
  document: RenderDocument,
  target: Target,
  after: Box,
): Result<GeometryChange | undefined> {
  const captured = sceneBox(document, target);
  if (captured === undefined)
    return failure('stale-target', 'Movement preview target is not captured');
  return exactBox(captured, after)
    ? { ok: true, value: undefined }
    : { ok: true, value: { target, before: captured, after } };
}
