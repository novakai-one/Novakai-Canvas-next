import type {
  Change,
  Endpoint,
  Relationship,
  WireAppearance,
} from '../../contract/records/owners.js';
import type {
  WireDraft,
  WireEdit,
  EditedWire,
  NewFunction,
} from '../../contract/records/wire-editor.js';
import { newFunctionChange } from './wire-functions.js';
/** Shared relationship plus local section identify a wire form without parsing generated scene IDs. */
export function wireDraftKey(collection: string, section: string, relationship: string): string {
  return JSON.stringify([collection, section, relationship]);
}
/** Replay against the captured version, even after an agent changes the displayed collection. */
export function editedWire(draft: WireDraft): EditedWire {
  const replay = (current: EditedWire, edit: WireEdit): EditedWire =>
    operations[edit.kind](current, edit, draft.relationship);
  return draft.edits.reduce(replay, {
    relationship: draft.relationship,
    wire: draft.wire,
    created: null,
    naming: null,
  });
}
/** A closed command registry separates semantic edits from local appearance edits. */
const operations: Readonly<
  Record<
    WireEdit['kind'],
    (current: EditedWire, edit: WireEdit, original: Relationship) => EditedWire
  >
> = {
  label: text,
  guard: text,
  effect: text,
  'relationship-kind': relationshipKind,
  style,
  endpoint,
  cardinality,
  route,
  side,
  locked,
  'automatic-route': automatic,
  function: chooseFunction,
  'function-name': functionName,
};
/** A blank label can be typed and recovered; Model rejects it at apply. */
function text(current: EditedWire, edit: WireEdit): EditedWire {
  if (edit.kind !== 'label' && edit.kind !== 'guard' && edit.kind !== 'effect') return current;
  return { ...current, relationship: { ...current.relationship, [edit.kind]: edit.value } };
}
/** Changing notation does not silently discard cardinalities or other semantics. */
function relationshipKind(current: EditedWire, edit: WireEdit, original: Relationship): EditedWire {
  if (edit.kind !== 'relationship-kind') return current;
  const relationship = { ...current.relationship, kind: edit.value };
  if (functionKinds.includes(edit.value)) return { ...current, relationship };
  return { ...droppedFunction({ ...current, relationship }, original), naming: null };
}
/**
 * A dropped staged function no longer exists, so the wire goes back to the target and label it
 * had when the draft started instead of pointing at a missing member.
 */
function droppedFunction(current: EditedWire, original: Relationship): EditedWire {
  if ((current.created ?? null) === null) return current;
  const restored = withLabel(current.relationship, original.label);
  return { ...current, relationship: { ...restored, target: original.target }, created: null };
}
/** An absent original label stays absent; the key is omitted rather than set to undefined. */
function withLabel(relationship: Relationship, label: string | undefined): Relationship {
  if (label !== undefined) return { ...relationship, label };
  const { label: dropped, ...unlabelled } = relationship;
  void dropped;
  return unlabelled;
}
/** Only these kinds name a module function; switching away abandons a staged new function. */
const functionKinds: readonly Relationship['kind'][] = ['imports', 'calls'];
/** Line style belongs to the shared relationship and is visible in every appearance. */
function style(current: EditedWire, edit: WireEdit): EditedWire {
  if (edit.kind !== 'style') return current;
  return { ...current, relationship: { ...current.relationship, style: edit.value } };
}
/** Endpoints are stable object/member identities; layout chooses their pixel anchors. */
function endpoint(current: EditedWire, edit: WireEdit, original: Relationship): EditedWire {
  if (edit.kind !== 'endpoint') return current;
  if (edit.side === 'source')
    return { ...current, relationship: { ...current.relationship, source: edit.value } };
  return targetMoved(current, edit.value, original);
}
/**
 * Retargeting keeps a staged function only when the new target is that function. Anywhere else
 * the staged function is dropped and the draft's original label comes back.
 */
function targetMoved(current: EditedWire, value: Endpoint, original: Relationship): EditedWire {
  if (isStaged(current.created ?? null, value))
    return { ...current, relationship: { ...current.relationship, target: value } };
  const dropped = droppedFunction(current, original);
  return { ...dropped, relationship: { ...dropped.relationship, target: value }, naming: null };
}
function isStaged(created: NewFunction | null, value: Endpoint): boolean {
  return created?.object === value.object && created.id === value.member;
}
/** The wire names the chosen function and attaches to it; a staged function travels with the draft. */
function chooseFunction(current: EditedWire, edit: WireEdit): EditedWire {
  if (edit.kind !== 'function') return current;
  const target = { object: edit.object, member: edit.member };
  const relationship = { ...current.relationship, label: edit.label, target };
  const created = edit.create ? { object: edit.object, id: edit.member, label: edit.label } : null;
  return { ...current, relationship, created, naming: null };
}
/** An unusable name keeps add mode open without staging anything; Apply stays blocked. */
function functionName(current: EditedWire, edit: WireEdit, original: Relationship): EditedWire {
  if (edit.kind !== 'function-name') return current;
  return { ...droppedFunction(current, original), naming: edit.name };
}
/** Clearing multiplicity removes the optional property rather than storing an invalid sentinel. */
function cardinality(current: EditedWire, edit: WireEdit): EditedWire {
  if (edit.kind !== 'cardinality') return current;
  return { ...current, relationship: withCardinality(current.relationship, edit) };
}
/** Both endpoint multiplicities are independent; Model checks whether the chosen relationship permits them. */
function withCardinality(
  relationship: Relationship,
  edit: Extract<WireEdit, { kind: 'cardinality' }>,
): Relationship {
  const { [edit.side]: omitted, ...remaining } = relationship;
  void omitted;
  if (edit.value === 'none') return remaining;
  return { ...remaining, [edit.side]: edit.value };
}
/** Routing style is local to the selected diagram, retaining authored bends until explicitly reset. */
function route(current: EditedWire, edit: WireEdit): EditedWire {
  if (edit.kind !== 'route') return current;
  return { ...current, wire: { ...current.wire, route: edit.value } };
}
/** Attachment sides constrain the local router, not the semantic endpoints. */
function side(current: EditedWire, edit: WireEdit): EditedWire {
  if (edit.kind !== 'side') return current;
  return { ...current, wire: { ...current.wire, [edit.side]: edit.value } };
}
/** A lock is valid only with manual points; the form disables it until bends exist and Model enforces the invariant. */
function locked(current: EditedWire, edit: WireEdit): EditedWire {
  if (edit.kind !== 'locked') return current;
  return { ...current, wire: { ...current.wire, locked: edit.value } };
}
/** Reset removes the complete manual constraint; no stale lock or point list survives. */
function automatic(current: EditedWire): EditedWire {
  const { manual, ...wire } = current.wire;
  void manual;
  return { ...current, wire: { ...wire, locked: false, sourceSide: 'auto', targetSide: 'auto' } };
}
/** Submit one atomic Model change list. Unchanged shared or local records are not needlessly replaced. */
export function wireChanges(draft: WireDraft): readonly Change[] {
  const edited = editedWire(draft);
  return [
    ...newFunctionChange(draft.collection, edited.created ?? null),
    ...relationshipChanges(draft.relationship, edited.relationship),
    ...explicitRouteReset(draft),
    ...routeChanges(draft, edited.wire),
  ];
}
/** Model preserves omitted manual points on replace; its explicit reset operation must precede that replacement. */
function explicitRouteReset(draft: WireDraft): readonly Change[] {
  if (!draft.edits.some((edit) => edit.kind === 'automatic-route')) return [];
  return [{ op: 'reset-route', section: draft.section.id, relationship: draft.relationship.id }];
}
/** Reference identity is retained until a semantic command actually changes the relationship. */
function relationshipChanges(original: Relationship, next: Relationship): readonly Change[] {
  if (original === next) return [];
  return [{ op: 'replace', target: 'relationships', value: next }];
}
/** Only one wire appearance is replaced inside its captured section. */
function routeChanges(draft: WireDraft, next: WireAppearance): readonly Change[] {
  if (draft.wire === next) return [];
  const section = {
    ...draft.section,
    wires: draft.section.wires.map((wire) =>
      wire.relationship === next.relationship ? next : wire,
    ),
  };
  return [{ op: 'replace', target: 'sections', value: section }];
}
