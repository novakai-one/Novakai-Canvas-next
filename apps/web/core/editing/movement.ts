import type { Change, PlacementIntent, SceneStamp } from '../../contract/records/owners.js';
import type { Diagnostic, Result } from '../../contract/errors.js';
import type {
  GeometryChange,
  MoveOption,
  MoveReview,
  MovementPreviewContext,
} from '../../contract/records/movement.js';
import { failure } from '../../contract/errors.js';
import { changes, plannedSections } from './movement-capture.js';
import { droppedAway, droppedOnto } from './movement-drop.js';
import { normalizedEntries, validateMoveIntent } from './movement-intent.js';
import { geometryChanges } from './movement-preview.js';

type GeometryPreview = MoveOption['preview'];
type PreparedMove = {
  readonly intent: PlacementIntent;
  readonly changes: readonly Change[];
};

export function buildMoveReview(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<MoveReview> {
  const prepared = prepareMove(intent, context);
  return prepared.ok ? reviewPrepared(prepared.value, context) : prepared;
}

function reviewPrepared(
  prepared: PreparedMove,
  context: MovementPreviewContext,
): Result<MoveReview> {
  const previewed = previewMove(prepared, context);
  const reviewed = previewed.ok ? inspectMove(prepared, context, previewed.value) : previewed;
  return reviewed.ok ? reviewed : plainFailure(reviewed.error, prepared.intent, context);
}

function prepareMove(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<PreparedMove> {
  const validation = validateMoveIntent(intent, context);
  if (!validation.ok) return validation;
  if (context.preview === undefined)
    return failure('invalid-edit', 'Movement preview is not available');
  return prepareMovePlan(intent, context);
}

function prepareMovePlan(
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<PreparedMove> {
  const normalized = normalizedEntries(context.document, intent);
  if (!normalized.ok) return normalized;
  const preparedIntent = { ...intent, entries: normalized.value };
  let sections: readonly import('../../contract/records/owners.js').Section[];
  try {
    sections = plannedSections(context.document, preparedIntent);
  } catch {
    return failure('stale-target', 'The movement target is no longer available');
  }
  return {
    ok: true,
    value: {
      intent: preparedIntent,
      changes: changes(context.document, sections),
    },
  };
}

function previewMove(
  prepared: PreparedMove,
  context: MovementPreviewContext,
): Result<GeometryPreview | null> {
  if (context.preview === undefined)
    return failure('invalid-edit', 'Movement preview is not available');
  return context.preview(context.document, prepared.intent, prepared.changes);
}

const REASONS: readonly (readonly [RegExp, string])[] = [
  [/overlap/i, 'it would overlap another box'],
  [/no route|no room/i, 'its wires would have no room to route'],
  [/exceeds measured section envelope/i, "it wouldn't fit inside its section"],
  [/group cannot grow/i, 'its group has no room to grow that way'],
];
/** Layout speaks in its own terms; the person moving a box reads what went wrong and where. */
function plainFailure(
  error: Diagnostic,
  intent: PlacementIntent,
  context: MovementPreviewContext,
): Result<never> {
  const onto = droppedOnto(context.document, intent.entries);
  const reason = REASONS.find(([pattern]) => pattern.test(error.message))?.[1];
  const message =
    onto === undefined
      ? `Can't move ${movedLabel(intent, context)} there: ${reason ?? "the layout can't fit it"}`
      : `Can't drop on top of ${onto}`;
  return { ok: false, error: { ...error, message } };
}
function movedLabel(intent: PlacementIntent, context: MovementPreviewContext): string {
  const target = intent.entries[0]?.target;
  const section = context.document.scene.sections.find(
    (item) => target?.kind === 'node' && item.id === target.section,
  );
  const node = section?.nodes.find((item) => target?.kind === 'node' && item.id === target.id);
  return node?.measured.label ?? 'this';
}

function inspectMove(
  prepared: PreparedMove,
  context: MovementPreviewContext,
  preview: GeometryPreview | null,
): Result<MoveReview> {
  if (preview === null) return failure('invalid-edit', 'Movement preview produced no geometry');
  const inspected = checkedChanges(prepared, context, preview);
  return inspected.ok
    ? createMoveReview(prepared.intent, context, prepared.changes, inspected.value, preview)
    : inspected;
}

/** Nothing moved although the person dropped the node elsewhere: its group could not follow. */
function checkedChanges(
  prepared: PreparedMove,
  context: MovementPreviewContext,
  preview: GeometryPreview,
): Result<readonly GeometryChange[]> {
  const inspected = geometryChanges(context.document, prepared.intent.entries, preview);
  const stuck =
    inspected.ok &&
    inspected.value.length === 0 &&
    droppedAway(context.document, prepared.intent.entries);
  return stuck ? failure('invalid-edit', 'The group cannot grow to hold this position') : inspected;
}

function createMoveReview(
  intent: PlacementIntent,
  context: MovementPreviewContext,
  plannedChanges: readonly Change[],
  inspected: readonly GeometryChange[],
  preview: GeometryPreview,
): Result<MoveReview> {
  if (inspected.length === 0)
    return {
      ok: true,
      value: {
        id: intent.id,
        intent,
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
    geometryChanges: inspected,
    preview,
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
    return failure('stale-gesture', 'The diagram changed while this move was under review');
  const selected = review.options.find((option) => option.id === optionId);
  if (selected === undefined)
    return failure('invalid-edit', 'That movement option is no longer available');
  return { ok: true, value: selected };
}

export { buildExpandOption } from './movement-expand.js';
export { buildRearrangeOption } from './movement-rearrange.js';
