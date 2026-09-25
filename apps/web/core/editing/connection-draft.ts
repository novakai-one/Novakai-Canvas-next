/*
 * Connection drafts: which section and endpoints a gesture means, which relationship kinds they
 * allow, and the create request a confirmed draft becomes. Reads the active diagram only; Model's
 * policy tables and ID grammars are injected (`ConnectionPolicy`), and the request goes through
 * the workspace bindings' model input. Authoring owns admission, commit and recovery.
 */
import { diagnostic } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import type { WorkspaceBindings } from '../../contract/ports/workspace.js';
import type {
  Change,
  Collection,
  DiagramObject,
  EditIntent,
  Endpoint,
  Relationship,
  Request,
  Section,
} from '../../contract/records/owners.js';
import type { ActiveDiagram } from '../../contract/records/workspace.js';
import type { MemberEndpointKind } from '../../contract/records/owners.js';
import type {
  Cardinality,
  ConnectionDraft,
  ConnectionEdit,
  ConnectionEndpointView,
  RelationshipKind,
} from '../../contract/records/connection.js';

/** A connection draft awaiting review, with its built request once submission has started. */
export interface ConnectionCapture {
  readonly draft: ConnectionDraft;
  readonly request: Request | null;
}

/** A draft that passed every review check, with the trimmed label to apply. */
export interface ConnectionReview {
  readonly capture: ConnectionCapture;
  readonly label: string;
}

/** A checked ID grammar: `safeParse` brands the value or reports failure. */
export interface IdGrammar<T> {
  readonly safeParse: (
    input: unknown,
  ) => { readonly success: true; readonly data: T } | { readonly success: false };
}

/**
 * Model's connection policy and ID grammars. Web core imports no capability's runtime, so the
 * caller (an adapter) reads Model's tables and injects them here.
 */
export interface ConnectionPolicy {
  /** The relationship kinds each section mode allows; an absent mode allows `allKinds`. */
  readonly compatibleWires: Readonly<Partial<Record<Section['mode'], readonly RelationshipKind[]>>>;
  /** Every relationship kind, for section modes without a `compatibleWires` entry. */
  readonly allKinds: readonly RelationshipKind[];
  /** The member kinds each object kind exposes as endpoints, falling back to `generic`. */
  readonly memberEndpoints: Readonly<
    Partial<Record<DiagramObject['kind'], readonly MemberEndpointKind[]>>
  >;
  /** The member kinds addressable on an object kind with no `memberEndpoints` entry. */
  readonly genericMemberEndpoints: readonly MemberEndpointKind[];
  /** The source object kinds each relationship kind accepts; absent allows any. */
  readonly sourceEndpoints: EndpointKindTable;
  /** The target object kinds each relationship kind accepts; absent allows any. */
  readonly targetEndpoints: EndpointKindTable;
  /** Resolves a callable endpoint on the collection, when one exists. */
  readonly callable: (collection: Collection, endpoint: Endpoint) => unknown;
  /** Model's member-ID grammar. */
  readonly descendantId: IdGrammar<NonNullable<Endpoint['member']>>;
  /** Model's relationship-ID grammar. */
  readonly relationshipId: IdGrammar<Relationship['id']>;
}

/** The object kinds a relationship kind accepts at one end; an absent entry allows any. */
type EndpointKindTable = Readonly<
  Partial<Record<RelationshipKind, readonly DiagramObject['kind'][]>>
>;

/** Applies one panel edit to the draft, clearing its problem. */
export function editedConnection(
  draft: ConnectionDraft,
  edit: ConnectionEdit,
): ConnectionDraft {
  if (edit.kind === 'label') {
    return { ...draft, label: edit.value, problem: null };
  }
  if (edit.kind === 'relationship-kind') {
    return { ...draft, kind: edit.value, problem: null };
  }
  return { ...draft, [edit.side]: edit.value, problem: null };
}

/** The section a connection gesture targets, or why the gesture cannot start. */
export function resolveConnectionSection(
  active: ActiveDiagram,
  intent: ConnectionIntent,
  occupied: boolean,
): Result<Section> {
  if (occupied) {
    return connectionFailure(
      'pending-request',
      'Finish or cancel the current connection first.',
      'Apply or cancel the retained connection draft.',
    );
  }
  return sectionForGesture(active, intent);
}

/** Builds the draft from a gesture's two endpoints, with the relationship kinds they allow. */
export function buildConnectionDraft(
  policy: ConnectionPolicy,
  active: ActiveDiagram,
  intent: ConnectionIntent,
  section: Section,
): Result<ConnectionDraft> {
  const endpoints = resolveEndpoints(policy, active, intent);
  if (!endpoints.ok) {
    return endpoints;
  }
  return draftWithKinds(policy, active, intent, section, endpoints.value);
}

/** Every check a draft passes before its request is built: present, current and labelled. */
export function reviewConnection(
  capture: ConnectionCapture | null,
  active: ActiveDiagram | null,
): Result<ConnectionReview> {
  if (capture === null) {
    return connectionFailure(
      'invalid-edit',
      'No connection is awaiting review.',
      'Connect two compatible endpoints first.',
    );
  }
  return reviewCurrent(capture, active);
}

/** Builds the create request for a reviewed draft: one relationship, one wire appearance. */
export function connectionRequest(
  policy: ConnectionPolicy,
  bindings: WorkspaceBindings,
  draft: ConnectionDraft,
  label: string,
): Result<Request> {
  const relationship = relationshipFor(policy, draft, label);
  if (!relationship.ok) {
    return relationship;
  }
  return bindings.inputs.model(
    draft.base,
    draft.collection.id,
    relationshipChanges(draft, relationship.value),
    draft.id,
  );
}

/** A connection gesture's intent. */
type ConnectionIntent = Extract<EditIntent, { kind: 'connection' }>;

/** Both gesture endpoints resolved to canonical addresses. */
interface ResolvedEndpoints {
  readonly source: ConnectionEndpointView;
  readonly target: ConnectionEndpointView;
}

/** The runtime form of `MemberEndpointKind` (Model exports the type only). */
const memberEndpointKinds: readonly MemberEndpointKind[] = [
  'field',
  'member',
  'signature',
  'port',
  'row',
];

/** One connection failure with the recovery text the panel shows. */
function connectionFailure<T>(
  code: string,
  message: string,
  recovery: string,
): Result<T> {
  return { ok: false, error: diagnostic(code, message, recovery) };
}

/** The gesture's section: the gesture must belong to the active collection. */
function sectionForGesture(
  active: ActiveDiagram,
  intent: ConnectionIntent,
): Result<Section> {
  if (intent.base.collectionId !== active.document.collection.id) {
    return connectionFailure(
      'stale-gesture',
      'The diagram changed while this connection was being edited.',
      'Reconnect the endpoints on the current diagram.',
    );
  }
  return findConnectionSection(active, intent.source.section);
}

/** The named section, which must exist and not be a sequence diagram. */
function findConnectionSection(
  active: ActiveDiagram,
  sectionId: string,
): Result<Section> {
  const section = active.document.collection.sections.find((item) => item.id === sectionId);
  if (section === undefined || section.mode === 'sequence') {
    return connectionFailure(
      'unsupported-edit',
      'Connections are unavailable in sequence diagrams.',
      'Choose a compatible diagram section.',
    );
  }
  return { ok: true, value: section };
}

/** The draft with its allowed kinds; no compatible kind means these endpoints cannot connect. */
function draftWithKinds(
  policy: ConnectionPolicy,
  active: ActiveDiagram,
  intent: ConnectionIntent,
  section: Section,
  endpoints: ResolvedEndpoints,
): Result<ConnectionDraft> {
  const kinds = connectionKinds(
    policy,
    section.mode,
    active.document.collection,
    endpoints.source.kind,
    endpoints.target,
  );
  const [kind] = kinds;
  if (kind === undefined) {
    return connectionFailure(
      'unsupported-edit',
      'These endpoints have no compatible relationship kind.',
      'Choose endpoints supported by this diagram.',
    );
  }
  return { ok: true, value: draftRecord(active, intent, section, endpoints, kinds, kind) };
}

/** The new draft: the first allowed kind preselected, an empty label and no cardinalities. */
function draftRecord(
  active: ActiveDiagram,
  intent: ConnectionIntent,
  section: Section,
  endpoints: ResolvedEndpoints,
  kinds: readonly RelationshipKind[],
  kind: RelationshipKind,
): ConnectionDraft {
  return {
    id: intent.id,
    base: active.base,
    generation: active.generation,
    collection: active.document.collection,
    section,
    source: endpoints.source,
    target: endpoints.target,
    kinds,
    kind,
    label: '',
    from: 'none',
    to: 'none',
    problem: null,
    requestState: 'draft',
  };
}

/** The draft must belong to the active collection and generation. */
function reviewCurrent(
  capture: ConnectionCapture,
  active: ActiveDiagram | null,
): Result<ConnectionReview> {
  if (active === null || !sameDiagram(active, capture.draft)) {
    return connectionFailure(
      'stale-gesture',
      'The connection belongs to another collection or generation.',
      'Return to the captured collection and retry, or cancel this draft.',
    );
  }
  return reviewLabel(capture);
}

/** Same collection, same generation. */
function sameDiagram(
  active: ActiveDiagram,
  draft: ConnectionDraft,
): boolean {
  return (
    active.document.collection.id === draft.collection.id && active.generation === draft.generation
  );
}

/** The label is required; it is trimmed before applying. */
function reviewLabel(capture: ConnectionCapture): Result<ConnectionReview> {
  const label = capture.draft.label.trim();
  if (label.length === 0) {
    return connectionFailure(
      'invalid-edit',
      'Give the connection a label before applying it.',
      'Enter a short relationship label.',
    );
  }
  return { ok: true, value: { capture, label } };
}

/** The relationship record and the section carrying its appearance. */
function relationshipChanges(
  draft: ConnectionDraft,
  relationship: Relationship,
): readonly Change[] {
  const section: Section = {
    ...draft.section,
    wires: [...draft.section.wires, connectionAppearance(relationship.id)],
  };
  return [
    { op: 'create', target: 'relationships', value: relationship },
    { op: 'replace', target: 'sections', value: section },
  ];
}

/** The relationship a draft describes; its minted ID is checked against the grammar. */
function relationshipFor(
  policy: ConnectionPolicy,
  draft: ConnectionDraft,
  label: string,
): Result<Relationship> {
  const endpoints = relationshipEndpoints(policy, draft);
  if (!endpoints.ok) {
    return endpoints;
  }
  return assembleRelationship(policy, draft, label, endpoints.value);
}

/** Source and target as Model addresses them, each member ID checked against its grammar. */
function relationshipEndpoints(
  policy: ConnectionPolicy,
  draft: ConnectionDraft,
): Result<RelationshipEndpoints> {
  const source = relationshipEndpoint(policy, draft.source);
  if (!source.ok) {
    return source;
  }
  const target = relationshipEndpoint(policy, draft.target);
  if (!target.ok) {
    return target;
  }
  return { ok: true, value: { source: source.value, target: target.value } };
}

/** Both endpoints as Model addresses them. */
interface RelationshipEndpoints {
  readonly source: Endpoint;
  readonly target: Endpoint;
}

/** The assembled relationship, when its minted ID parses against the grammar. */
function assembleRelationship(
  policy: ConnectionPolicy,
  draft: ConnectionDraft,
  label: string,
  endpoints: RelationshipEndpoints,
): Result<Relationship> {
  const id = policy.relationshipId.safeParse(`relationship-${draft.id}`);
  if (!id.success) {
    return connectionFailure(
      'invalid-edit',
      'The connection identity is not readable.',
      'Cancel this connection and reconnect the endpoints.',
    );
  }
  return { ok: true, value: relationshipRecord(draft, label, endpoints, id.data) };
}

/** The relationship record: labelled, solid, without provenance, cardinalities on associations only. */
function relationshipRecord(
  draft: ConnectionDraft,
  label: string,
  endpoints: RelationshipEndpoints,
  id: Relationship['id'],
): Relationship {
  return {
    id,
    kind: draft.kind,
    label,
    source: endpoints.source,
    target: endpoints.target,
    ...associationCardinality(draft),
    style: 'solid',
    sources: [],
  };
}

/** One endpoint as Model addresses it; the member ID is checked against the grammar. */
function relationshipEndpoint(
  policy: ConnectionPolicy,
  endpoint: ConnectionEndpointView,
): Result<Endpoint> {
  if (endpoint.member === undefined) {
    return { ok: true, value: { object: endpoint.object } };
  }
  const member = policy.descendantId.safeParse(endpoint.member);
  if (!member.success) {
    return connectionFailure(
      'invalid-edit',
      'The member address is not readable.',
      'Reconnect the current members.',
    );
  }
  return { ok: true, value: { object: endpoint.object, member: member.data } };
}

/** Association ends; every other kind forbids cardinalities. */
function associationCardinality(draft: ConnectionDraft): Partial<Relationship> {
  if (draft.kind !== 'association') {
    return {};
  }
  return { ...cardinalityEntry('from', draft.from), ...cardinalityEntry('to', draft.to) };
}

/** One end's cardinality; `none` leaves the key out. */
function cardinalityEntry(
  side: 'from' | 'to',
  value: Cardinality,
): Partial<Relationship> {
  return value === 'none' ? {} : { [side]: value };
}

/** The wire appearance of a new relationship: orthogonal route, automatic sides, unlocked. */
function connectionAppearance(id: Relationship['id']): Section['wires'][number] {
  return {
    relationship: id,
    route: 'orthogonal',
    sourceSide: 'auto',
    targetSide: 'auto',
    locked: false,
  };
}

/** Both gesture endpoints resolved to canonical addresses. */
function resolveEndpoints(
  policy: ConnectionPolicy,
  active: ActiveDiagram,
  intent: ConnectionIntent,
): Result<ResolvedEndpoints> {
  const source = resolveEndpoint(policy, active, intent.source);
  if (!source.ok) {
    return source;
  }
  const target = resolveEndpoint(policy, active, intent.target);
  if (!target.ok) {
    return target;
  }
  return { ok: true, value: { source: source.value, target: target.value } };
}

/** One endpoint: its node and object must still exist, then its member must be addressable. */
function resolveEndpoint(
  policy: ConnectionPolicy,
  active: ActiveDiagram,
  endpoint: ConnectionIntent['source'],
): Result<ConnectionEndpointView> {
  const node = endpointNode(active, endpoint);
  if (node === undefined) {
    return staleTarget();
  }
  const object = endpointObject(active, node);
  if (object === undefined) {
    return staleTarget();
  }
  return endpointMember(policy, object, node, endpoint.member);
}

/** The endpoint vanished from the canonical document while the gesture was in flight. */
function staleTarget(): Result<ConnectionEndpointView> {
  return connectionFailure(
    'stale-target',
    'The connection endpoint is no longer represented by a canonical object.',
    'Reconnect the current nodes.',
  );
}

/** The scene node a gesture endpoint points at. */
function endpointNode(
  active: ActiveDiagram,
  endpoint: ConnectionIntent['source'],
) {
  const section = active.document.scene.sections.find((item) => item.id === endpoint.section);
  return section?.nodes.find((item) => item.id === endpoint.node);
}

/** The canonical object a scene node measures, when it still represents one. */
function endpointObject(
  active: ActiveDiagram,
  node: NonNullable<ReturnType<typeof endpointNode>>,
) {
  const objectId = node.measured.objectId;
  if (objectId === null || objectId === undefined) {
    return undefined;
  }
  return active.document.collection.objects.find((item) => item.id === objectId);
}

/** The member address of an endpoint; no member addresses the whole object. */
function endpointMember(
  policy: ConnectionPolicy,
  object: DiagramObject,
  node: NonNullable<ReturnType<typeof endpointNode>>,
  member: string | null,
): Result<ConnectionEndpointView> {
  if (member === null) {
    return { ok: true, value: endpointView(object, undefined) };
  }
  return addressMember(policy, object, node, member);
}

/** A member must exist in the node's measured anchors and be a legal endpoint on the object. */
function addressMember(
  policy: ConnectionPolicy,
  object: DiagramObject,
  node: NonNullable<ReturnType<typeof endpointNode>>,
  member: string,
): Result<ConnectionEndpointView> {
  const anchor = node.measured.content.anchors.find((item) => item.member === member);
  if (anchor === undefined) {
    return connectionFailure(
      'stale-target',
      'The selected member is no longer available.',
      'Reconnect the current members.',
    );
  }
  if (!canonicalMemberAllowed(policy, object, anchor.member)) {
    return connectionFailure(
      'unsupported-edit',
      'The selected member is not a legal connection endpoint for this object.',
      'Choose a field, member, signature, port or row supported by the object.',
    );
  }
  return { ok: true, value: endpointView(object, anchor) };
}

/** The view address of an object endpoint, with the anchor's member when one was picked. */
function endpointView(
  object: DiagramObject,
  anchor: { readonly member: string; readonly label: string } | undefined,
): ConnectionEndpointView {
  if (anchor === undefined) {
    return { object: object.id, kind: object.kind, label: object.label };
  }
  return {
    object: object.id,
    kind: object.kind,
    label: object.label,
    member: anchor.member,
    memberLabel: anchor.label,
  };
}

/** The member kind of a port or content block ID, when it is addressable. */
function canonicalMemberKind(
  object: DiagramObject,
  member: string,
): MemberEndpointKind | undefined {
  if (object.ports.some((port) => port.id === member)) {
    return 'port';
  }
  return contentMemberKind(object, member);
}

/** A content block's member kind; table rows are found through their table. */
function contentMemberKind(
  object: DiagramObject,
  member: string,
): MemberEndpointKind | undefined {
  const block = object.content.find((item) => item.id === member);
  if (block === undefined || block.kind === 'table') {
    return tableRowKind(object, member);
  }
  return memberEndpointKinds.find((kind) => kind === block.kind);
}

/** The member is a table row when any table holds a row with this ID. */
function tableRowKind(
  object: DiagramObject,
  member: string,
): MemberEndpointKind | undefined {
  const table = object.content.find(
    (item) => item.kind === 'table' && item.rows.some((row) => row.id === member),
  );
  return table === undefined ? undefined : 'row';
}

/** A member is a legal endpoint when its kind is allowed on this kind of object. */
function canonicalMemberAllowed(
  policy: ConnectionPolicy,
  object: DiagramObject,
  member: string,
): boolean {
  const kind = canonicalMemberKind(object, member);
  const allowed = policy.memberEndpoints[object.kind] ?? policy.genericMemberEndpoints;
  return kind !== undefined && allowed.includes(kind);
}

/** The relationship kinds the section mode and both endpoints allow, in policy order. */
function connectionKinds(
  policy: ConnectionPolicy,
  mode: Section['mode'],
  collection: Collection,
  source: ConnectionEndpointView['kind'],
  target: ConnectionEndpointView,
): readonly RelationshipKind[] {
  const candidates = policy.compatibleWires[mode] ?? policy.allKinds;
  return candidates.filter((kind) =>
    connectionKindAllowed(policy, kind, source, target, collection),
  );
}

/** A kind is allowed when both endpoints' kinds fit its policy and a `calls` target is callable. */
function connectionKindAllowed(
  policy: ConnectionPolicy,
  kind: RelationshipKind,
  source: ConnectionEndpointView['kind'],
  target: ConnectionEndpointView,
  collection: Collection,
): boolean {
  return (
    endpointKindAllowed(policy.sourceEndpoints[kind], source) &&
    endpointKindAllowed(policy.targetEndpoints[kind], target.kind) &&
    (kind !== 'calls' || callableTargetExists(policy, collection, target))
  );
}

/** An absent policy entry allows every kind. */
function endpointKindAllowed(
  allowed: readonly ConnectionEndpointView['kind'][] | undefined,
  kind: ConnectionEndpointView['kind'],
): boolean {
  return allowed === undefined || allowed.includes(kind);
}

/** A `calls` relationship needs a target endpoint Model can resolve as callable. */
function callableTargetExists(
  policy: ConnectionPolicy,
  collection: Collection,
  target: ConnectionEndpointView,
): boolean {
  const endpoint = relationshipEndpoint(policy, target);
  return endpoint.ok && policy.callable(collection, endpoint.value) !== undefined;
}
