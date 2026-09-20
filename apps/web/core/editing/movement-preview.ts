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
  const expectedMatch = validateExpectedBox(expected, item.box);
  return expectedMatch.ok ? inspectMatchedGeometry(document, item, preview) : expectedMatch;
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
