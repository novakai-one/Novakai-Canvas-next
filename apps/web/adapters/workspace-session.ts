import { historyStatusSchema } from '@novakai/canvas-authoring';
import type { GeometryPreview } from '@novakai/canvas-canvas';
import type { ObjectDraft } from '../contract/records/inspector.js';
import type { DiagramObject, Group, Relationship, Section } from '../contract/records/owners.js';
import type {
  AddDiagramDraft,
  AddGroupDraft,
  AddObjectDraft,
} from '../contract/records/creation.js';
import type { ConnectionDraft, ConnectionEdit } from '../contract/records/connection.js';
import {
  compatibleWires,
  memberEndpoints,
  genericMemberEndpoints,
  sourceEndpoints,
  targetEndpoints,
  resolveCallableEndpoint,
} from '@novakai/canvas-model';
import type { DefinitionDraft } from '../contract/records/definitions.js';
import type { Submission } from '../contract/records/submission.js';
import type { Receipt } from '../contract/records/owners.js';
import type {
  WorkspaceController,
  WorkspaceView,
  ActiveDiagram,
} from '../contract/records/workspace.js';
import type { WorkspaceBindings } from '../contract/ports/workspace.js';
import type {
  Request,
  CanvasEffect,
  RenderDocument,
  EditIntent,
} from '../contract/records/owners.js';
import type { Diagnostic, Result } from '../contract/errors.js';
import type { RelationshipKind } from '@novakai/canvas-model';
import type { BinaryResponse } from '../contract/ports/client.js';
import {
  plainMessage,
  emptyRefusalOrder,
  observeRefusals,
  supersededRefusal,
  groupDraftProblem,
  groupCreationChanges,
  chooseMoveOption as chooseReviewedMoveOption,
} from '../contract/api.js';

const creationKinds = ['diagram', 'object', 'group'] as const;
const restingStatuses = new Set([
  'Ready',
  'Saved',
  'Draft not applied',
  'Edit awaiting confirmation',
]);
const allRelationshipKinds: readonly RelationshipKind[] = [
  'flow',
  'association',
  'imports',
  'calls',
  'implements',
  'contains',
  'parent',
  'reference',
  'transition',
];
type CanonicalMemberKind = 'field' | 'member' | 'signature' | 'port' | 'row';

function connectionSection(
  active: ActiveDiagram,
  intent: Extract<EditIntent, { kind: 'connection' }>,
  occupied: boolean,
): Result<Section> {
  const blocker = connectionSectionBlocker(active, intent, occupied);
  if (blocker !== null) return blocker;
  return findConnectionSection(active, intent.source.section);
}

function connectionSectionBlocker(
  active: ActiveDiagram,
  intent: Extract<EditIntent, { kind: 'connection' }>,
  occupied: boolean,
): Result<Section> | null {
  if (occupied)
    return {
      ok: false,
      error: connectionDiagnostic(
        'pending-request',
        'Finish or cancel the current connection first.',
        'Apply or cancel the retained connection draft.',
      ),
    };
  if (intent.base.collectionId !== active.document.collection.id)
    return {
      ok: false,
      error: connectionDiagnostic(
        'stale-gesture',
        'The diagram changed while this connection was being edited.',
        'Reconnect the endpoints on the current diagram.',
      ),
    };
  return null;
}

function findConnectionSection(active: ActiveDiagram, sectionId: string): Result<Section> {
  const section = active.document.collection.sections.find((item) => item.id === sectionId);
  if (section === undefined || section.mode === 'sequence')
    return {
      ok: false,
      error: connectionDiagnostic(
        'unsupported-edit',
        'Connections are unavailable in sequence diagrams.',
        'Choose a compatible diagram section.',
      ),
    };
  return { ok: true, value: section };
}

function canonicalMemberKind(
  object: DiagramObject,
  member: string,
): CanonicalMemberKind | undefined {
  return memberPortKind(object, member) ?? contentMemberKind(object, member);
}

function memberPortKind(object: DiagramObject, member: string): CanonicalMemberKind | undefined {
  return object.ports.some((port) => port.id === member) ? 'port' : undefined;
}

function contentMemberKind(object: DiagramObject, member: string): CanonicalMemberKind | undefined {
  const block = object.content.find((item) => item.id === member);
  if (block !== undefined && block.kind !== 'table') return block.kind as CanonicalMemberKind;
  return tableRowKind(object, member);
}

function tableRowKind(object: DiagramObject, member: string): CanonicalMemberKind | undefined {
  const table = object.content.find(
    (item) => item.kind === 'table' && item.rows.some((row) => row.id === member),
  );
  return table === undefined ? undefined : 'row';
}

function canonicalMemberAllowed(object: DiagramObject, member: string): boolean {
  const kind = canonicalMemberKind(object, member);
  const allowed = memberEndpoints[object.kind] ?? genericMemberEndpoints;
  return kind !== undefined && (allowed as readonly string[]).includes(kind);
}

function editedConnection(draft: ConnectionDraft, edit: ConnectionEdit): ConnectionDraft {
  if (edit.kind === 'label') return { ...draft, label: edit.value, problem: null };
  if (edit.kind === 'relationship-kind') return { ...draft, kind: edit.value, problem: null };
  return { ...draft, [edit.side]: edit.value, problem: null };
}

function connectionRequest(
  bindings: WorkspaceBindings,
  draft: ConnectionDraft,
  label: string,
): Result<Request> {
  const id = `relationship-${draft.id}` as Relationship['id'];
  const relationship: Relationship = {
    id,
    kind: draft.kind,
    label,
    source: endpointValue(draft.source),
    target: endpointValue(draft.target),
    ...associationCardinality(draft),
    style: 'solid',
    sources: [],
  };
  const section: Section = {
    ...draft.section,
    wires: [
      ...draft.section.wires,
      {
        ...connectionAppearance(id),
      },
    ],
  };
  return bindings.inputs.model(
    draft.base,
    draft.collection.id,
    [
      { op: 'create', target: 'relationships', value: relationship },
      { op: 'replace', target: 'sections', value: section },
    ],
    draft.id,
  );
}

function associationCardinality(draft: ConnectionDraft): Partial<Relationship> {
  if (draft.kind !== 'association') return {};
  return {
    ...cardinalityEntry('from', draft.from),
    ...cardinalityEntry('to', draft.to),
  };
}

function cardinalityEntry(
  side: 'from' | 'to',
  value: ConnectionDraft['from'],
): Partial<Relationship> {
  return value === 'none' ? {} : { [side]: value };
}

function connectionAppearance(id: Relationship['id']): Section['wires'][number] {
  return {
    relationship: id,
    route: 'orthogonal',
    sourceSide: 'auto',
    targetSide: 'auto',
    locked: false,
  };
}

function connectionKinds(
  mode: Section['mode'],
  collection: ActiveDiagram['document']['collection'],
  source: ConnectionDraft['source']['kind'],
  target: ConnectionDraft['target'],
): readonly RelationshipKind[] {
  const candidates = compatibleWires[mode] ?? allRelationshipKinds;
  return candidates.filter((kind) => connectionKindAllowed(kind, source, target, collection));
}

function connectionKindAllowed(
  kind: RelationshipKind,
  source: ConnectionDraft['source']['kind'],
  target: ConnectionDraft['target'],
  collection: ActiveDiagram['document']['collection'],
): boolean {
  return (
    endpointKindAllowed(sourceEndpoints[kind], source) &&
    endpointKindAllowed(targetEndpoints[kind], target.kind) &&
    (kind !== 'calls' || callableTargetExists(collection, target))
  );
}

function endpointKindAllowed(
  allowed: readonly ConnectionDraft['source']['kind'][] | undefined,
  kind: ConnectionDraft['source']['kind'],
): boolean {
  return allowed === undefined || allowed.includes(kind);
}

function callableTargetExists(
  collection: ActiveDiagram['document']['collection'],
  target: ConnectionDraft['target'],
): boolean {
  return (
    resolveCallableEndpoint(collection, {
      object: target.object,
      ...(target.member === undefined ? {} : { member: target.member }),
    } as Relationship['target']) !== undefined
  );
}

function connectionEndpointNode(
  active: ActiveDiagram,
  endpoint: Extract<EditIntent, { kind: 'connection' }>['source'],
) {
  const sceneSection = active.document.scene.sections.find((item) => item.id === endpoint.section);
  return sceneSection?.nodes.find((item) => item.id === endpoint.node);
}

function connectionEndpointObject(
  active: ActiveDiagram,
  node: ReturnType<typeof connectionEndpointNode>,
) {
  const objectId = node?.measured.objectId;
  return objectId === null || objectId === undefined
    ? undefined
    : active.document.collection.objects.find((item) => item.id === objectId);
}

function connectionEndpointValue(
  object: DiagramObject,
  anchor: { readonly member: string; readonly label: string } | undefined,
): ConnectionDraft['source'] {
  return {
    object: object.id,
    kind: object.kind,
    label: object.label,
    ...(anchor === undefined ? {} : { member: anchor.member, memberLabel: anchor.label }),
  };
}

function connectionEndpointMember(
  object: DiagramObject,
  node: NonNullable<ReturnType<typeof connectionEndpointNode>>,
  member: string | null,
): Result<ConnectionDraft['source']> {
  if (member === null) return { ok: true, value: connectionEndpointValue(object, undefined) };
  return addressConnectionMember(object, node, member);
}

function addressConnectionMember(
  object: DiagramObject,
  node: NonNullable<ReturnType<typeof connectionEndpointNode>>,
  member: string,
): Result<ConnectionDraft['source']> {
  const anchor = node.measured.content.anchors.find((item) => item.member === member);
  if (anchor === undefined)
    return {
      ok: false,
      error: connectionDiagnostic(
        'stale-target',
        'The selected member is no longer available.',
        'Reconnect the current members.',
      ),
    };
  if (!canonicalMemberAllowed(object, anchor.member))
    return {
      ok: false,
      error: connectionDiagnostic(
        'unsupported-edit',
        'The selected member is not a legal connection endpoint for this object.',
        'Choose a field, member, signature, port or row supported by the object.',
      ),
    };
  return { ok: true, value: connectionEndpointValue(object, anchor) };
}

function resolveConnectionEndpoint(
  active: ActiveDiagram,
  endpoint: Extract<EditIntent, { kind: 'connection' }>['source'],
): Result<ConnectionDraft['source']> {
  const node = connectionEndpointNode(active, endpoint);
  const object = connectionEndpointObject(active, node);
  if (node === undefined || object === undefined)
    return {
      ok: false,
      error: connectionDiagnostic(
        'stale-target',
        'The connection endpoint is no longer represented by a canonical object.',
        'Reconnect the current nodes.',
      ),
    };
  return connectionEndpointMember(object, node, endpoint.member);
}

function resolveConnectionEndpoints(
  active: ActiveDiagram,
  intent: Extract<EditIntent, { kind: 'connection' }>,
): Result<{
  readonly source: ConnectionDraft['source'];
  readonly target: ConnectionDraft['target'];
}> {
  const source = resolveConnectionEndpoint(active, intent.source);
  if (!source.ok) return source;
  const target = resolveConnectionEndpoint(active, intent.target);
  if (!target.ok) return target;
  return { ok: true, value: { source: source.value, target: target.value } };
}

function buildConnectionDraft(
  active: ActiveDiagram,
  intent: Extract<EditIntent, { kind: 'connection' }>,
  section: Section,
): Result<ConnectionDraft> {
  const endpoints = resolveConnectionEndpoints(active, intent);
  if (!endpoints.ok) return endpoints;
  const kinds = connectionKinds(
    section.mode,
    active.document.collection,
    endpoints.value.source.kind,
    endpoints.value.target,
  );
  if (kinds.length === 0)
    return {
      ok: false,
      error: connectionDiagnostic(
        'unsupported-edit',
        'These endpoints have no compatible relationship kind.',
        'Choose endpoints supported by this diagram.',
      ),
    };
  return {
    ok: true,
    value: {
      id: intent.id,
      base: active.base,
      generation: active.generation,
      collection: active.document.collection,
      section,
      source: endpoints.value.source,
      target: endpoints.value.target,
      kinds,
      kind: kinds[0] as RelationshipKind,
      label: '',
      from: 'none',
      to: 'none',
      problem: null,
      requestState: 'draft',
    },
  };
}

function connectionCaptureCheck(
  capture: { readonly draft: ConnectionDraft } | null,
): Result<ConnectionDraft> {
  return capture === null
    ? {
        ok: false,
        error: connectionDiagnostic(
          'invalid-edit',
          'No connection is awaiting review.',
          'Connect two compatible endpoints first.',
        ),
      }
    : { ok: true, value: capture.draft };
}

function connectionActiveCheck(
  active: ActiveDiagram | null,
  draft: Result<ConnectionDraft>,
): Result<void> {
  if (!draft.ok) return draft;
  return active === null ||
    active.document.collection.id !== draft.value.collection.id ||
    active.generation !== draft.value.generation
    ? {
        ok: false,
        error: connectionDiagnostic(
          'stale-gesture',
          'The connection belongs to another collection or generation.',
          'Return to the captured collection and retry, or cancel this draft.',
        ),
      }
    : { ok: true, value: undefined };
}

function connectionLabelCheck(draft: Result<ConnectionDraft>): Result<string> {
  if (!draft.ok) return draft;
  const label = draft.value.label.trim();
  return label.length === 0
    ? {
        ok: false,
        error: connectionDiagnostic(
          'invalid-edit',
          'Give the connection a label before applying it.',
          'Enter a short relationship label.',
        ),
      }
    : { ok: true, value: label };
}

function connectionChecks(
  capture: { readonly draft: ConnectionDraft } | null,
  active: ActiveDiagram | null,
): readonly Result<unknown>[] {
  const draft = connectionCaptureCheck(capture);
  return [draft, connectionActiveCheck(active, draft), connectionLabelCheck(draft)];
}

function endpointValue(endpoint: ConnectionDraft['source']): Relationship['source'] {
  return endpoint.member === undefined
    ? { object: endpoint.object as Relationship['source']['object'] }
    : {
        object: endpoint.object as Relationship['source']['object'],
        member: endpoint.member as Relationship['source']['member'],
      };
}

function definitionChanges(
  draft: DefinitionDraft,
): readonly import('../contract/records/owners.js').Change[] {
  if (draft.operation === 'remove')
    return [{ op: 'remove', target: 'definitions', id: draft.definition.id }];
  return [{ op: draft.operation, target: 'definitions', value: draft.definition }];
}

function definitionRequest(draft: DefinitionDraft, bindings: WorkspaceBindings): Result<Request> {
  if (draft.request !== undefined) return { ok: true, value: draft.request };
  return bindings.inputs.model(
    draft.base,
    draft.collection.id,
    definitionChanges(draft),
    bindings.nextId(),
  );
}
interface RenderRequest {
  readonly token: number;
  readonly id: string;
  readonly revision: number;
  readonly workspace: string;
  readonly generation: string;
  readonly mode: 'navigation' | 'chooser';
  readonly job: AbortController;
}
/** Ephemeral orchestration state contains immutable snapshots. Authoring is the sole owner of committed diagram data. */
export function createWorkspaceController(bindings: WorkspaceBindings): WorkspaceController {
  const source = bindings.source({
    changed: (view) => update(view),
    report,
    submit,
    current: () => ({
      active: state.active,
      generation: state.active?.generation ?? state.generation,
    }),
  });
  let state: WorkspaceView = {
    snapshot: null,
    generation: '',
    collections: [],
    active: null,
    opening: null,
    collectionSwitch: { phase: 'idle', activeId: null },
    status: 'Connecting…',
    problem: null,
    connected: false,
    busy: false,
    pending: [],
    movementReview: null,
    connection: null,
    creation: {
      diagram: { title: '', mode: 'grid' },
      object: { section: '', label: '', kind: 'module', reuseObject: null, group: null },
      group: { section: '', title: '' },
      problem: null,
      busy: false,
    },
    history: { status: null, busy: false },
    ...source.getSnapshot(),
  };
  const listeners = new Set<() => void>();
  const confirmedGestures = new Set<string>();
  let unsubscribe = (): void => undefined;
  let renderJob: AbortController | null = null;
  let rendering: RenderRequest | null = null;
  let requestToken = 0;
  let disposed = false;
  let snapshotRead = 0;
  let restoredWorkspace: string | null = null;
  let historyGate = false;
  let movementCapture: {
    active: ActiveDiagram;
    intent: Extract<EditIntent, { kind: 'placement' }>;
    review: import('../contract/records/movement.js').MoveReview;
    workspace: string;
  } | null = null;
  let movementApplying = false;
  let connectionCapture: { draft: ConnectionDraft; request: Request | null } | null = null;
  let historyRead = 0;
  let historyRefreshing = false;
  let diagramCapture: {
    readonly id: Section['id'];
    readonly base: NonNullable<WorkspaceView['snapshot']>;
    readonly collection: ActiveDiagram['document']['collection'];
    readonly generation: string;
    request: Request | null;
  } | null = null;
  let objectCapture: {
    readonly id: DiagramObject['id'];
    readonly base: NonNullable<WorkspaceView['snapshot']>;
    readonly collection: ActiveDiagram['document']['collection'];
    readonly generation: string;
    request: Request | null;
  } | null = null;
  let groupCapture: {
    readonly id: Group['id'];
    readonly base: NonNullable<WorkspaceView['snapshot']>;
    readonly collection: ActiveDiagram['document']['collection'];
    readonly generation: string;
    request: Request | null;
  } | null = null;
  let historySequence = 0;
  let historySnapshotReady = false;
  let removeHistoryKeys = (): void => undefined;
  const inspector = bindings.inspector({ apply: applyObject, report });
  const definitions = bindings.definitions({ apply: applyDefinition, report });
  const wires = bindings.wires({ apply: applyChanges, report });
  const library = bindings.library({ apply: applyLibrary, report });
  const stopEditorStatus = [inspector, wires, definitions].map((editor) =>
    editor.subscribe(refreshRestingStatus),
  );
  let refusalOrder = emptyRefusalOrder;
  const submissions = bindings.submissions({ changed: pendingChanged, confirmed, report });
  function holdConfirmedHistory(pending: readonly Submission[]): void {
    const finished = state.pending.some(
      (item) =>
        item.request.intent.kind !== 'change' &&
        item.state !== 'rejected' &&
        !pending.some((other) => other.request.request === item.request.request),
    );
    if (finished) setHistoryGate(true);
  }
  /** Transmission status is independent of typing and retained failures. */
  function pendingChanged(pending: readonly Submission[]): void {
    // One refusal is visible: the latest, until another edit starts. Dismissing republishes the journal.
    refusalOrder = observeRefusals(refusalOrder, pending);
    const superseded = supersededRefusal(refusalOrder);
    if (superseded !== undefined) dismissRequest(superseded);
    // Publish even if that dismissal failed, so the journal view never stalls on a hidden refusal.
    const shown = pending.filter((item) => item.request.request !== superseded);
    releaseRefusedDefinitions(shown);
    publishPending(shown);
  }
  /** A refused definition changed nothing; its draft becomes editable now, so a reload cannot leave it locked. */
  function releaseRefusedDefinitions(pending: readonly Submission[]): void {
    pending
      .filter((item) => item.state === 'rejected')
      .forEach((item) => definitions.released(item.request.request));
  }
  function publishPending(pending: readonly Submission[]): void {
    holdConfirmedHistory(pending);
    const connection = pendingConnectionView(pending);
    update({
      pending,
      busy: pending.some((item) => item.state === 'sending'),
      creation: { ...state.creation, busy: creationLocked() },
      ...(connection === undefined ? {} : { connection }),
    });
    updateMutationAvailability();
    if (movementCapture?.intent.id !== undefined) updateMovementRecovery(movementCapture.intent.id);
  }
  function pendingConnectionView(pending: readonly Submission[]): ConnectionDraft | undefined {
    if (connectionCapture?.request === null || connectionCapture === null) return undefined;
    const item = pending.find(
      (entry) => entry.request.request === connectionCapture?.request?.request,
    );
    if (item === undefined) return undefined;
    const requestState = item.state;
    connectionCapture.draft = { ...connectionCapture.draft, requestState };
    return connectionCapture.draft;
  }
  /** Listeners receive a new immutable view; Canvas panning has its own narrower subscription. */
  function update(patch: Partial<WorkspaceView>): void {
    const cleared = problemCleared(patch);
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
    if (cleared) dismissRefusals();
  }
  function problemCleared(patch: Partial<WorkspaceView>): boolean {
    return state.problem !== null && patch.problem === null;
  }
  /** A refusal is shown only as the error bar, so once that bar is gone the refused request goes too. */
  function dismissRefusals(): void {
    state.pending
      .filter((item) => item.state === 'rejected')
      .forEach((item) => dismissRequest(item.request.request));
  }
  /** Keep the diagram and draft readable when an operation fails. */
  function report(error: Diagnostic): void {
    // The error bar carries the reason; the status line only points to it.
    update({ problem: error, status: 'Action failed. See the error above.' });
  }
  function dismissRequest(id: string): void {
    const result = submissions.dismiss(id);
    if (!result.ok) return report(result.error);
    releaseDismissedCreation(id);
    definitions.released(id);
  }
  /** Workspace hints are reconciled through a full checked Authoring snapshot. */
  async function refresh(): Promise<void> {
    const read = ++snapshotRead;
    const response = await bindings.client.get('/api/v1/workspace?history=versions');
    if (read !== snapshotRead) return;
    receiveSnapshot(response);
  }
  /** Only the latest requested snapshot can advance transport generation, even when responses arrive out of order. */
  function receiveSnapshot(
    response: Awaited<ReturnType<WorkspaceBindings['client']['get']>>,
  ): void {
    if (!response.ok) {
      report(response.error);
      return;
    }
    if (!response.value.outcome.ok) {
      report(response.value.outcome.error);
      return;
    }
    acceptSnapshot(response.value.outcome.value, response.value.generation);
  }
  /** Snapshot sequence prevents out-of-order reads from moving the sidebar backward. */
  function acceptSnapshot(input: unknown, generation: string): void {
    const checked = bindings.inputs.snapshot(input);
    if (!checked.ok) {
      report(checked.error);
      return;
    }
    const latest = checked.value;
    acceptCurrent(latest, generation);
  }
  /** A restarted service keeps drafts visible; new-generation data never silently advances a draft's captured preconditions. */
  function acceptCurrent(
    latest: {
      readonly snapshot: import('../contract/records/owners.js').Snapshot;
      readonly collections: WorkspaceView['collections'];
    },
    generation: string,
  ): void {
    if (
      state.generation === generation &&
      latest.snapshot.sequence < (state.snapshot?.sequence ?? 0)
    )
      return;
    settleChangedRender(latest, generation);
    update({
      snapshot: latest.snapshot,
      collections: latest.collections,
      generation,
      connected: true,
    });
    observeHistorySnapshot(latest.snapshot.sequence);
    restoreEdits();
    library.refresh(latest.snapshot, latest.collections);
    source.reconcile(latest.snapshot, generation);
    updateMutationAvailability();
    refreshActive();
    void refreshHistory();
  }
  function observeHistorySnapshot(sequence: number): void {
    if (historyRefreshing && sequence >= historySequence) historySnapshotReady = true;
  }
  /** A checked snapshot can invalidate the current request before it is allowed to install. */
  function settleChangedRender(
    latest: {
      readonly snapshot: import('../contract/records/owners.js').Snapshot;
      readonly collections: WorkspaceView['collections'];
    },
    generation: string,
  ): void {
    const request = rendering;
    if (request === null || !currentRequest(request)) return;
    const target = latest.collections.find((item) => item.id === request.id);
    if (
      request.workspace !== latest.snapshot.workspace ||
      request.generation !== generation ||
      request.revision !== (target?.revision ?? -1)
    )
      settleFailure(
        request,
        diagnostic(
          'render-input-changed',
          'The workspace changed while opening this collection',
          'Choose the collection again to retry.',
        ),
      );
  }
  /** Foreign commits request a new render only when the active collection revision changed. No update performs Fit. */
  function refreshActive(): void {
    const active = state.active;
    if (active === null) return;
    if (state.collectionSwitch.phase !== 'idle') return;
    refreshDisplayed(active);
  }
  /** Missing collections return to the library; changed render inputs retain the viewing session. */
  function refreshDisplayed(active: ActiveDiagram): void {
    const current = state.collections.find((item) => item.id === active.document.collection.id);
    if (current === undefined) return clearMissingActive(active);
    if (shouldSkipRefresh(active, current)) return;
    void open(active.document.collection.id);
  }
  function clearMissingActive(active: ActiveDiagram): void {
    active.session.dispose();
    update({ active: null, opening: null, status: 'Collection is no longer available' });
  }
  function requestMatches(current: WorkspaceView['collections'][number]): boolean {
    const requested = rendering;
    return (
      requested?.id === current.id &&
      requested.revision === current.revision &&
      requested.generation === state.generation
    );
  }
  function shouldSkipRefresh(
    active: ActiveDiagram,
    current: WorkspaceView['collections'][number],
  ): boolean {
    return requestMatches(current) || !renderChanged(active, current.revision, state.generation);
  }
  /** One latest render request owns delivery. Cancelled/superseded jobs cannot mount their results. */
  async function open(id: string): Promise<void> {
    await requestOpen(id, 'navigation');
  }
  /** Explicit choices supersede every older render; token checks decide delivery after transport aborts. */
  async function requestOpen(id: string, mode: RenderRequest['mode']): Promise<void> {
    const request = beginRender(id, mode);
    if (request === null) return;
    const response = await bindings.client.get(
      `/api/v1/render?id=${encodeURIComponent(id)}`,
      request.job.signal,
    );
    deliverResponse(request, id, response);
  }
  function deliverResponse(
    request: RenderRequest,
    id: string,
    response: Awaited<ReturnType<WorkspaceBindings['client']['get']>>,
  ): void {
    const document = currentRequest(request) ? receiveRender(response, id, request) : null;
    if (document === null) return;
    settleDocument(request, document);
  }
  function settleDocument(request: RenderRequest, document: Result<RenderDocument>): void {
    if (!document.ok) return settleFailure(request, document.error);
    finishRequest(request, document.value);
  }
  function finishRequest(request: RenderRequest, document: RenderDocument): void {
    if (!currentRequest(request)) return;
    const installed = installAdmitted(request, document);
    if (!installed.ok) return settleFailure(request, installed.error);
    settleSuccess(request);
  }
  function installAdmitted(request: RenderRequest, document: RenderDocument): Result<void> {
    const admission = admitRender(request, document);
    if (!admission.ok) return admission;
    return install(document);
  }
  function admitRender(request: RenderRequest, document: RenderDocument): Result<void> {
    const current = state.collections.find((item) => item.id === request.id);
    const changed =
      state.snapshot?.workspace !== request.workspace ||
      state.generation !== request.generation ||
      current?.revision !== request.revision ||
      document.collection.revision !== request.revision;
    if (changed) void refresh();
    if (changed)
      return {
        ok: false,
        error: diagnostic(
          'render-input-changed',
          'The workspace changed while opening this collection',
          'Choose the collection again to retry.',
        ),
      };
    return { ok: true, value: undefined };
  }
  /** A request captures the checked revision and service generation used for its admission. */
  function beginRender(id: string, mode: RenderRequest['mode']): RenderRequest | null {
    if (disposed) return null;
    invalidateRender();
    const job = new AbortController();
    const request: RenderRequest = {
      token: ++requestToken,
      id,
      revision: state.collections.find((item) => item.id === id)?.revision ?? -1,
      workspace: state.snapshot?.workspace ?? '',
      generation: state.generation,
      mode,
      job,
    };
    renderJob = job;
    rendering = request;
    update(renderPatch(id, mode));
    return request;
  }
  function renderPatch(id: string, mode: RenderRequest['mode']): Partial<WorkspaceView> {
    if (mode === 'chooser')
      return {
        opening: id,
        status: `Opening ${collectionTitle(id)}…`,
        collectionSwitch: { phase: 'loading', activeId: activeId(), targetId: id },
        ...renderProblemUpdate(),
      };
    return { opening: id, status: 'Rendering diagram…', ...renderProblemUpdate() };
  }
  /** Successful HTTP payloads require owner validation before Canvas sees them. */
  function receiveRender(
    response: Awaited<ReturnType<WorkspaceBindings['client']['get']>>,
    id: string,
    request: RenderRequest,
  ): Result<RenderDocument> {
    if (!response.ok) return response;
    return transportDocument(response.value, id, request.generation);
  }
  function transportDocument(
    response: import('../contract/records/owners.js').TransportResponse,
    id: string,
    generation: string,
  ): Result<RenderDocument> {
    if (response.generation !== generation || generation !== state.generation)
      return generationMismatch();
    return response.outcome.ok ? readRender(response.outcome.value, id) : response.outcome;
  }
  function generationMismatch(): Result<RenderDocument> {
    void refresh();
    return {
      ok: false,
      error: connectionDiagnostic(
        'workspace-generation',
        'The workspace changed while opening this collection',
        'Refresh the workspace, then try again.',
      ),
    };
  }
  /** Selected collection identity must match the requested document, even if a delayed server returns another valid diagram. */
  function readRender(input: unknown, id: string): Result<RenderDocument> {
    const document = bindings.inputs.diagram(input);
    if (!document.ok) return document;
    if (document.value.collection.id !== id)
      return {
        ok: false,
        error: diagnostic(
          'stale-diagram',
          'The response was for a different collection',
          'Choose the collection again to retry.',
        ),
      };
    return document;
  }
  /** Reuse the existing Canvas session for edits; only admitted documents may replace the retained scene. */
  function install(document: RenderDocument): Result<void> {
    const base = matchingSnapshot(document);
    if (!base.ok) return base;
    return installCurrent(document, base.value);
  }
  /** Bind the displayed document to its matching canonical snapshot before any edit can use its preconditions. */
  function installCurrent(
    document: RenderDocument,
    base: NonNullable<WorkspaceView['snapshot']>,
  ): Result<void> {
    const active = state.active;
    const reused = updateExisting(active, document, base);
    if (!reused.ok) return reused;
    if (reused.value) return { ok: true, value: undefined };
    return installNew(active, document, base);
  }
  function installNew(
    active: ActiveDiagram | null,
    document: RenderDocument,
    base: NonNullable<WorkspaceView['snapshot']>,
  ): Result<void> {
    const session = bindings.sessions.open(document, effects);
    if (!session.ok) return session;
    retainCamera(active, session.value, document, base);
    update({
      active: {
        generation: state.generation,
        document,
        base,
        canvas: bindings.sessions.canvas,
        session: session.value,
      },
      status: editStatus(),
      creation: creationForOpenedCollection(active, document),
      ...renderProblemUpdate(),
    });
    active?.session.dispose();
    updateLocation(document.collection.id);
    source.refreshReadout();
    updateMutationAvailability();
    return { ok: true, value: undefined };
  }
  /** Reuse is an explicit decision, not a type predicate: a valid active session may belong to another collection. */
  function updateExisting(
    active: ActiveDiagram | null,
    document: RenderDocument,
    base: NonNullable<WorkspaceView['snapshot']>,
  ): Result<boolean> {
    if (active === null) return { ok: true, value: false };
    if (!reusableSession(active, document, base)) return { ok: true, value: false };
    return updateExistingSession(active, document, base);
  }
  function updateExistingSession(
    active: ActiveDiagram,
    document: RenderDocument,
    base: NonNullable<WorkspaceView['snapshot']>,
  ): Result<boolean> {
    const updated = updateCanvas(active, document, base);
    if (!updated.ok) return updated;
    return { ok: true, value: true };
  }
  /** A navigation failure is visible but does not undo a successfully opened diagram. */
  function updateLocation(id: string): void {
    library.visit(id);
    const result = bindings.navigation.opened(id);
    if (!result.ok) report(result.error);
  }
  /** Canvas admission and generation checks run before replacing the UI's document reference. */
  function updateCanvas(
    active: ActiveDiagram,
    document: RenderDocument,
    base: NonNullable<WorkspaceView['snapshot']>,
  ): Result<void> {
    const updated = bindings.sessions.update(active.session, document);
    if (!updated.ok) return updated;
    releaseConfirmed(active.session);
    update({
      opening: null,
      active: { ...active, generation: state.generation, document, base },
      status: editStatus(),
      ...renderProblemUpdate(),
    });
    source.refreshReadout();
    updateMutationAvailability();
    return { ok: true, value: undefined };
  }
  /** A settled request clears only its own pending metadata and leaves a newer request untouched. */
  function settleSuccess(request: RenderRequest): void {
    if (!currentRequest(request)) return;
    rendering = null;
    renderJob = null;
    update({
      opening: null,
      collectionSwitch: { phase: 'idle', activeId: activeId() },
      status: editStatus(),
    });
    releaseHistory();
  }
  /** Failed chooser attempts are recoverable and never replace the retained active diagram. */
  function settleFailure(request: RenderRequest, error: Diagnostic): void {
    if (!currentRequest(request)) return;
    request.job.abort();
    rendering = null;
    renderJob = null;
    const problem = owned(error);
    update(failurePatch(request, problem));
  }
  function failurePatch(request: RenderRequest, problem: Diagnostic): Partial<WorkspaceView> {
    const basePatch: Partial<WorkspaceView> = {
      opening: null,
      problem,
      status:
        request.mode === 'chooser'
          ? `Could not open ${collectionTitle(request.id)}`
          : problem.message,
    };
    return request.mode === 'chooser'
      ? {
          ...basePatch,
          collectionSwitch: {
            phase: 'failed',
            activeId: activeId(),
            targetId: request.id,
            problem,
          },
        }
      : basePatch;
  }
  /** Transport aborts are an optimization; invalidation is the ownership boundary. */
  function invalidateRender(): void {
    requestToken += 1;
    renderJob?.abort();
    renderJob = null;
    rendering = null;
  }
  function currentRequest(request: RenderRequest): boolean {
    return (
      !disposed &&
      requestToken === request.token &&
      rendering === request &&
      !request.job.signal.aborted
    );
  }
  function activeId(): string | null {
    return state.active?.document.collection.id ?? null;
  }
  function collectionTitle(id: string): string {
    return state.collections.find((item) => item.id === id)?.title ?? 'this collection';
  }
  function owned(error: Diagnostic): Diagnostic {
    return error.owner === undefined ? { ...error, owner: 'workspace' } : error;
  }
  function diagnostic(code: string, message: string, recovery: string): Diagnostic {
    return { code, message, recovery, owner: 'workspace' };
  }
  /** A panel-owned migration notice survives diagram navigation; load failures clear on the next render attempt. */
  function renderProblemUpdate(): Partial<WorkspaceView> {
    if (state.problem?.owner === 'panel-preferences') return {};
    return { problem: null };
  }
  /** Mutations wait for the scene's own transport generation and any in-flight request; navigation stays available. */
  function updateMutationAvailability(): void {
    state.active?.session.dispatch({
      kind: 'mutation-available',
      value:
        movementCapture === null &&
        !movementApplying &&
        !historyBlocked() &&
        state.active.generation === state.generation,
    });
  }
  /** Rendering acknowledges geometry only, never an unconfirmed edit. */
  /** An open, unapplied editor form in this collection means "Draft not applied", never "Saved". */
  function openDraftCount(): number {
    const open = state.active?.document.collection.id;
    return [inspector, wires, definitions]
      .flatMap(
        (editor): readonly { readonly collection: { readonly id: string } }[] =>
          editor.getSnapshot().drafts,
      )
      .filter((draft) => draft.collection.id === open).length;
  }
  function hasUnappliedDraft(): boolean {
    return state.sourceDirty || openDraftCount() > 0;
  }
  /** Opening, editing or discarding a form moves a resting status; progress and failure messages stay. */
  function refreshRestingStatus(): void {
    const next = editStatus();
    if (restingStatuses.has(state.status) && next !== state.status) update({ status: next });
  }
  function editStatus(): string {
    if (hasUnappliedDraft()) return 'Draft not applied';
    if (state.pending.some((item) => item.state !== 'rejected'))
      return 'Edit awaiting confirmation';
    return 'Saved';
  }
  /** Interaction effects are consumed exactly once; semantic/appearance editing still goes through Model then Authoring. */
  function effects(items: readonly CanvasEffect[]): void {
    items.forEach(effect);
  }
  /** Inspect requests open the existing panel explicitly; ordinary selection never changes its visibility or camera. */
  function effect(item: CanvasEffect): void {
    if (item.kind === 'inspect-request') {
      bindings.panels.open('right', true);
      return;
    }
    if (item.kind === 'edit-intent') void editCanvas(item.intent);
  }

  function supportsMoveReview(
    document: RenderDocument,
    intent: Extract<EditIntent, { kind: 'placement' }>,
  ): boolean {
    if (
      intent.entries.some(
        (entry) => entry.placement.width !== undefined || entry.placement.height !== undefined,
      )
    )
      return false;
    const moduleTargets = intent.entries.filter((entry) =>
      entry.target.kind === 'section'
        ? document.projection.sections.some(
            (section) => section.id === entry.target.id && section.mode === 'modules',
          )
        : entry.target.kind === 'node' &&
          document.projection.sections.some(
            (section) =>
              section.id === ('section' in entry.target ? entry.target.section : '') &&
              section.mode === 'modules',
          ),
    );
    return moduleTargets.length > 0;
  }
  function movementOption(
    review: import('../contract/records/movement.js').MoveReview,
  ): import('../contract/records/movement.js').MoveOption | undefined {
    return review.options.find((item) => item.kind === 'expand' || item.kind === 'rearrange');
  }
  function movementBaseError(
    review: import('../contract/records/movement.js').MoveReview,
  ): Diagnostic {
    return {
      code: 'unsupported-edit',
      message:
        review.reason ?? 'This movement has no valid move-only option; keep the draft for review.',
      recovery: 'Adjust the position or use the inspector.',
      owner: 'workspace',
    };
  }
  async function handleMovementReview(
    active: ActiveDiagram,
    intent: Extract<EditIntent, { kind: 'placement' }>,
  ): Promise<boolean> {
    const moveReview = bindings.moveReview;
    if (moveReview === undefined) return false;
    return reviewMovement(active, intent, moveReview);
  }
  async function reviewMovement(
    active: ActiveDiagram,
    intent: Extract<EditIntent, { kind: 'placement' }>,
    moveReview: NonNullable<WorkspaceBindings['moveReview']>,
  ): Promise<boolean> {
    if (!canReviewMovement(active.document, intent)) return false;
    const reviewed = moveReview(active.document, intent, active.session.getSnapshot().stamp);
    if (!reviewed.ok) return rejectMovement(active, intent, reviewed.error);
    return handleReviewedMovement(active, intent, reviewed.value);
  }
  function handleReviewedMovement(
    active: ActiveDiagram,
    intent: Extract<EditIntent, { kind: 'placement' }>,
    review: import('../contract/records/movement.js').MoveReview,
  ): boolean {
    // Nothing changed (e.g. dropped back in place): the node returns quietly.
    if (review.options.length === 0 && review.reason !== undefined) {
      active.session.dispatch({ kind: 'discard', id: intent.id });
      return true;
    }
    const option = movementOption(review);
    if (option !== undefined) return retainMovementReview(active, intent, review, option);
    const selected = review.options[0];
    if (review.options.length !== 1 || selected === undefined)
      return rejectMovement(active, intent, movementBaseError(review));
    void submitFeasibleCanvas(active, intent, selected.changes, selected.preview);
    return true;
  }
  function canReviewMovement(
    document: RenderDocument,
    intent: Extract<EditIntent, { kind: 'placement' }>,
  ): boolean {
    return bindings.moveReview !== undefined && supportsMoveReview(document, intent);
  }
  function rejectMovement(
    active: ActiveDiagram,
    intent: Extract<EditIntent, { kind: 'placement' }>,
    error: Diagnostic,
  ): boolean {
    active.session.dispatch({ kind: 'reject', id: intent.id, message: error.message });
    report(error);
    return true;
  }
  function retainMovementReview(
    active: ActiveDiagram,
    intent: Extract<EditIntent, { kind: 'placement' }>,
    review: import('../contract/records/movement.js').MoveReview,
    option: import('../contract/records/movement.js').MoveOption,
  ): boolean {
    movementCapture = { active, intent, review, workspace: state.snapshot?.workspace ?? '' };
    const accepted = active.session.dispatch({
      kind: 'preview-routes',
      id: intent.id,
      ...option.preview,
    });
    if (!accepted.ok || accepted.value.state.routePreview?.gesture !== intent.id) {
      movementCapture = null;
      return rejectMovement(active, intent, {
        code: 'invalid-edit',
        message: 'The movement preview could not be accepted.',
        recovery: 'Keep the draft and try the gesture again.',
        owner: 'workspace',
      });
    }
    update({
      movementReview: { review, optionId: option.id, phase: 'review', document: active.document },
      status: 'Review movement options',
    });
    updateMutationAvailability();
    return true;
  }
  function rejectWhileMovementActive(intent: EditIntent): void {
    const error = {
      code: 'pending-request',
      message: 'Review or cancel the current movement before starting another.',
      recovery: 'Apply or cancel the retained movement review.',
      owner: 'workspace' as const,
    };
    if (intent.kind === 'placement' && state.active !== null)
      state.active.session.dispatch({ kind: 'reject', id: intent.id, message: error.message });
    report(error);
  }
  function planAndSubmit(active: ActiveDiagram, intent: EditIntent): void {
    const planned = bindings.edits.plan(intent, {
      document: active.document,
      stamp: active.session.getSnapshot().stamp,
    });
    if (!planned.ok) return report(planned.error);
    void submitFeasibleCanvas(active, intent, planned.value);
  }
  /** A busy client retains subsequent gestures as recoverable drafts; no second browser request is submitted concurrently. */
  async function editCanvas(intent: EditIntent): Promise<void> {
    if (movementCapture !== null) {
      rejectWhileMovementActive(intent);
      return;
    }
    const active = state.active;
    if (active === null) return;
    await continueCanvasEdit(active, intent);
  }
  async function continueCanvasEdit(active: ActiveDiagram, intent: EditIntent): Promise<void> {
    if (intent.kind === 'connection') {
      beginConnection(active, intent);
      return;
    }
    if (await reviewPlacementIfSupported(active, intent)) return;
    planAndSubmit(active, intent);
  }
  function beginConnection(
    active: ActiveDiagram,
    intent: Extract<EditIntent, { kind: 'connection' }>,
  ): void {
    const section = connectionSection(active, intent, connectionCapture !== null);
    if (!section.ok) return report(section.error);
    const draft = buildConnectionDraft(active, intent, section.value);
    if (!draft.ok) return report(draft.error);
    connectionCapture = { draft: draft.value, request: null };
    bindings.panels.open('right', true);
    update({ connection: draft.value, status: 'Review new connection', problem: null });
  }
  async function reviewPlacementIfSupported(
    active: ActiveDiagram,
    intent: EditIntent,
  ): Promise<boolean> {
    if (intent.kind !== 'placement') return false;
    return handleMovementReview(active, intent);
  }
  /** Reject infeasible local geometry before any Authoring submission; retain the human draft. */
  function movementPreview(
    active: ActiveDiagram,
    intent: EditIntent,
    changes: readonly import('../contract/records/owners.js').Change[],
    acceptedPreview?: GeometryPreview,
  ): Result<GeometryPreview | null> {
    return previewAcceptedOrRoutes(active, intent, changes, acceptedPreview);
  }
  function previewAcceptedOrRoutes(
    active: ActiveDiagram,
    intent: EditIntent,
    changes: readonly import('../contract/records/owners.js').Change[],
    acceptedPreview: GeometryPreview | undefined,
  ): Result<GeometryPreview | null> {
    if (acceptedPreview !== undefined) return { ok: true, value: acceptedPreview };
    return previewMovementRoutes(active, intent, changes);
  }
  function previewMovementRoutes(
    active: ActiveDiagram,
    intent: EditIntent,
    changes: readonly import('../contract/records/owners.js').Change[],
  ): Result<GeometryPreview | null> {
    return bindings.previewRoutes?.(active.document, intent, changes) ?? { ok: true, value: null };
  }
  function rejectPreview(
    active: ActiveDiagram,
    intent: EditIntent,
    preview: Extract<Result<GeometryPreview | null>, { ok: false }>,
  ): Result<Receipt> {
    active.session.dispatch({ kind: 'reject', id: intent.id, message: preview.error.message });
    report(preview.error);
    rejectMovementPreview(intent.id);
    return { ok: false, error: preview.error };
  }
  function rejectMovementPreview(intentId: string): void {
    if (movementCapture?.intent.id !== intentId) return;
    movementApplying = false;
    update({
      movementReview: state.movementReview ? { ...state.movementReview, phase: 'rejected' } : null,
    });
    updateMutationAvailability();
  }
  function retainInitialPreview(
    active: ActiveDiagram,
    intent: EditIntent,
    preview: GeometryPreview | null,
    start: number,
  ): void {
    if (preview !== null) publishPreview(active, intent, preview, start);
  }
  function updateFailedMovement(
    intent: EditIntent,
    active: ActiveDiagram,
    preview: GeometryPreview | null,
    start: number,
  ): void {
    if (intent.kind !== 'placement') return;
    const retained = state.pending.find((item) => item.request.request === intent.id);
    if (isPendingMovement(retained)) {
      retainUncertainMovementReview(intent.id);
      return;
    }
    settleFailedMovement(intent, active, preview, start, retained?.state === 'rejected');
  }
  function isPendingMovement(item: Submission | undefined): boolean {
    return item?.state === 'uncertain' || item?.state === 'sending';
  }
  function retainUncertainMovementReview(requestId: string): void {
    update({
      movementReview: state.movementReview
        ? { ...state.movementReview, phase: 'uncertain', requestId }
        : null,
    });
  }
  function settleFailedMovement(
    intent: Extract<EditIntent, { kind: 'placement' }>,
    active: ActiveDiagram,
    preview: GeometryPreview | null,
    start: number,
    rejected: boolean,
  ): void {
    movementApplying = false;
    const phase = failedMovementPhase(active, intent, preview, start, rejected);
    update({ movementReview: state.movementReview ? { ...state.movementReview, phase } : null });
    updateMutationAvailability();
  }
  function failedMovementPhase(
    active: ActiveDiagram,
    intent: Extract<EditIntent, { kind: 'placement' }>,
    preview: GeometryPreview | null,
    start: number,
    rejected: boolean,
  ): 'rejected' | 'review' {
    const restored = restoreMovementPreview(active, intent, preview, start);
    return rejected || !restored ? 'rejected' : 'review';
  }
  function restoreMovementPreview(
    active: ActiveDiagram,
    intent: Extract<EditIntent, { kind: 'placement' }>,
    preview: GeometryPreview | null,
    start: number,
  ): boolean {
    return preview !== null && publishPreview(active, intent, preview, start);
  }
  async function submitFeasibleCanvas(
    active: ActiveDiagram,
    intent: EditIntent,
    changes: readonly import('../contract/records/owners.js').Change[],
    acceptedPreview?: GeometryPreview,
  ): Promise<Result<Receipt> | null> {
    const start = performance.now();
    const preview = movementPreview(active, intent, changes, acceptedPreview);
    if (!preview.ok) return rejectPreview(active, intent, preview);
    const submission = submitCanvas(active, intent, changes);
    const retainedAtStart = state.pending.find(
      (item) => item.request.request === intent.id && item.state === 'sending',
    );
    if (retainedAtStart !== undefined) retainInitialPreview(active, intent, preview.value, start);
    const result = await submission;
    updateMovementAfterSubmission(result, intent, active, preview.value, start);
    return result;
  }
  function updateMovementAfterSubmission(
    result: Result<Receipt>,
    intent: EditIntent,
    active: ActiveDiagram,
    preview: GeometryPreview | null,
    start: number,
  ): void {
    if (intent.kind !== 'placement') return;
    if (result.ok || movementCapture?.intent.id !== intent.id) return;
    updateFailedMovement(intent, active, preview, start);
  }
  /** Measure only inspected routes accepted by the Canvas gesture currently awaiting confirmation. */
  function publishPreview(
    active: ActiveDiagram,
    intent: EditIntent,
    geometry: GeometryPreview,
    start: number,
  ): boolean {
    const accepted = active.session.dispatch({
      kind: 'preview-routes',
      id: intent.id,
      ...geometry,
    });
    if (!accepted.ok) return false;
    if (accepted.value.state.routePreview?.gesture !== intent.id) return false;
    performance.measure('canvas:released-route-preview', {
      start,
      end: performance.now(),
      detail: { gesture: intent.id },
    });
    return true;
  }
  /** Capture the snapshot shown with the gesture; changing versions later is never part of retry. */
  async function submitCanvas(
    active: ActiveDiagram,
    intent: EditIntent,
    changes: readonly import('../contract/records/owners.js').Change[],
  ): Promise<Result<Receipt>> {
    const request = bindings.inputs.model(
      active.base,
      intent.base.collectionId,
      changes,
      intent.id,
    );
    if (!request.ok) {
      report(request.error);
      return request;
    }
    return submit(request.value, active.generation, state.sourceEdit, intent.id);
  }
  function allowSubmission(request: Request): Result<void> {
    if (blockedByHistory(request))
      return {
        ok: false,
        error: diagnostic(
          'pending-request',
          'Wait for undo or redo to finish',
          'Your draft is retained.',
        ),
      };
    return { ok: true, value: undefined };
  }
  function blockedByHistory(request: Request): boolean {
    if (historyGate && request.intent.kind === 'change') return true;
    return state.pending.some(unresolvedInverse);
  }
  function unresolvedInverse(item: Submission): boolean {
    return item.state !== 'rejected' && item.request.intent.kind !== 'change';
  }
  function rejectBlocked(request: Request, gesture: string | null): Result<void> {
    const allowed = allowSubmission(request);
    if (allowed.ok) return allowed;
    report(allowed.error);
    if (gesture !== null) rejectGesture(gesture, allowed.error.message);
    return allowed;
  }
  /** Submission owns the durable journal and receipt checks; UI retains all drafts on failure. */
  async function submit(
    request: Request,
    generation: string,
    sourceEdit: number,
    gesture: string | null,
  ): Promise<Result<Receipt>> {
    const allowed = rejectBlocked(request, gesture);
    if (!allowed.ok) return allowed;
    update({ status: 'Saving…', problem: null });
    const result = await submissions.submit({ request, generation, sourceEdit, gesture });
    if (!result.ok) handleSubmitFailure(result.error, gesture);
    return result;
  }
  function handleSubmitFailure(error: Diagnostic, gesture: string | null): void {
    report(error);
    void refresh();
    if (gesture !== null) handleGestureFailure(error, gesture);
  }
  function handleGestureFailure(error: Diagnostic, gesture: string): void {
    const retained = state.pending.find((item) => item.request.request === gesture);
    if (isUncertainMovement(gesture, retained)) return retainUncertainMovement(gesture);
    clearMovementApplying(gesture);
    rejectGesture(gesture, error.message);
    settleGestureFailure(gesture, retained?.state === 'rejected');
  }
  function isUncertainMovement(gesture: string, retained: Submission | undefined): boolean {
    return movementCapture?.intent.id === gesture && isPendingMovement(retained);
  }
  function clearMovementApplying(gesture: string): void {
    if (movementCapture?.intent.id === gesture) movementApplying = false;
  }
  function settleGestureFailure(gesture: string, rejected: boolean): void {
    if (movementCapture?.intent.id !== gesture) return;
    const phase = gestureFailurePhase(rejected);
    update({ movementReview: state.movementReview ? { ...state.movementReview, phase } : null });
    updateMutationAvailability();
  }
  function gestureFailurePhase(rejected: boolean): 'rejected' | 'review' {
    return rejected ? 'rejected' : 'review';
  }
  function retainUncertainMovement(gesture: string): void {
    movementApplying = true;
    update({
      movementReview: state.movementReview
        ? { ...state.movementReview, phase: 'uncertain', requestId: gesture }
        : null,
    });
  }
  function rejectGesture(gesture: string, message: string): void {
    state.active?.session.dispatch({ kind: 'reject', id: gesture, message });
  }
  /** Only a matching Authoring receipt may acknowledge a gesture or mark its submitted source generation saved. */
  function confirmed(submission: Submission, receipt: Receipt): void {
    source.confirmed(submission, receipt);
    update({ status: editStatus() });
    definitions.confirmed(submission.request.request);
    confirmGesture(submission.gesture);
    clearConfirmedMovement(submission.gesture);
    settleConfirmedCreation(submission.request.request);
    finishConfirmedSubmission(submission, receipt);
  }
  function settleConfirmedCreation(requestId: string): void {
    const diagramCleared = diagramCapture?.request?.request === requestId;
    const objectCleared = objectCapture?.request?.request === requestId;
    const groupCleared = groupCapture?.request?.request === requestId;
    settleDiagramCapture(requestId);
    settleObjectCapture(requestId);
    settleGroupCapture(requestId);
    settleConnectionCapture(requestId);
    if (!diagramCleared && !objectCleared && !groupCleared) return;
    update({ creation: settledCreationView(diagramCleared, objectCleared, groupCleared) });
  }
  function settledCreationView(
    diagramCleared: boolean,
    objectCleared: boolean,
    groupCleared: boolean,
  ): WorkspaceView['creation'] {
    return {
      diagram: settledDiagramDraft(diagramCleared),
      object: settledObjectDraft(objectCleared),
      group: settledGroupDraft(groupCleared),
      problem: null,
      busy: creationLocked(),
    };
  }
  function settledDiagramDraft(cleared: boolean): AddDiagramDraft {
    return cleared ? resetDiagramDraft('diagram', state.creation.diagram) : state.creation.diagram;
  }
  function settledObjectDraft(cleared: boolean): AddObjectDraft {
    return cleared ? resetObjectDraft('object', state.creation.object) : state.creation.object;
  }
  function settledGroupDraft(cleared: boolean): AddGroupDraft {
    return cleared ? resetGroupDraft('group', state.creation.group) : state.creation.group;
  }
  function settleDiagramCapture(requestId: string): void {
    if (diagramCapture?.request?.request === requestId) diagramCapture = null;
  }
  function settleObjectCapture(requestId: string): void {
    if (objectCapture?.request?.request === requestId) objectCapture = null;
  }
  function settleGroupCapture(requestId: string): void {
    if (groupCapture?.request?.request === requestId) groupCapture = null;
  }
  function settleConnectionCapture(requestId: string): void {
    if (connectionCapture?.request?.request !== requestId) return;
    connectionCapture = null;
    update({ connection: null });
  }
  function clearConfirmedMovement(gesture: string | null): void {
    if (movementCapture === null || submissionGestureMatches(gesture) === false) return;
    movementCapture = null;
    movementApplying = false;
    update({ movementReview: null });
    updateMutationAvailability();
  }
  function submissionGestureMatches(gesture: string | null): boolean {
    return gesture === movementCapture?.intent.id;
  }
  function finishConfirmedSubmission(submission: Submission, receipt: Receipt): void {
    if (submission.request.intent.kind !== 'change') void finishHistory(receipt.sequence);
    else void refresh();
  }
  /** Canvas is notified only when the receipt belongs to a submitted gesture. */
  function confirmGesture(gesture: string | null): void {
    if (gesture === null) return;
    confirmedGestures.add(gesture);
    if (state.active !== null) releaseConfirmed(state.active.session);
  }
  /** Receipt alone cannot remove a drag preview while the canvas still displays the old revision. */
  function releaseConfirmed(session: ActiveDiagram['session']): void {
    const snapshot = session.getSnapshot();
    const retained = snapshot.recovery.filter(
      (item) =>
        confirmedGestures.has(item.draft.id) && snapshot.stamp.revision > item.draft.base.revision,
    );
    for (const item of retained) {
      session.dispatch({ kind: 'confirmed', id: item.draft.id });
      confirmedGestures.delete(item.draft.id);
    }
  }
  /** A response racing a newer snapshot is discarded; old rendered data never gains new write preconditions. */
  function matchingSnapshot(
    document: RenderDocument,
  ): Result<NonNullable<WorkspaceView['snapshot']>> {
    if (snapshotMatches(document))
      return { ok: true, value: state.snapshot as NonNullable<WorkspaceView['snapshot']> };
    void refresh();
    return {
      ok: false,
      error: diagnostic(
        'snapshot-mismatch',
        'The collection changed while it was opening',
        'Refresh the library, then try the collection again.',
      ),
    };
  }
  function snapshotMatches(document: RenderDocument): boolean {
    const current = state.collections.find((item) => item.id === document.collection.id);
    return state.snapshot !== null && current?.revision === document.collection.revision;
  }
  /** Human creation is an ordinary DSL creation with absent collection and observed catalog preconditions. */
  async function create(title: string): Promise<void> {
    if (state.snapshot === null) return;
    const id = `collection-${bindings.nextId()}`;
    const request = bindings.inputs.dsl(
      state.snapshot,
      id,
      bindings.inputs.newSource(id, title),
      'create',
      bindings.nextId(),
    );
    if (!request.ok) {
      report(request.error);
      return;
    }
    await createSubmitted(request.value, id);
  }
  /** Open only after a confirmed creation and matching snapshot; a failed create keeps the current canvas. */
  async function createSubmitted(request: Request, id: string): Promise<void> {
    const result = await submit(request, state.generation, state.sourceEdit, null);
    if (!result.ok) return;
    await refresh();
    await open(id);
  }
  /** The inspector supplies a captured base and typed replacement; the same Authoring request journal owns its write. */
  async function applyObject(draft: ObjectDraft, object: DiagramObject): Promise<Result<Receipt>> {
    return applyChanges(draft, [{ op: 'replace', target: 'objects', value: object }]);
  }
  function retainDefinitionRequest(draft: DefinitionDraft, request: Request): Result<Request> {
    if (draft.request !== undefined) return { ok: true, value: request };
    const retained = definitions.bindRequest(draft.key, request);
    if (!retained.ok) return retained;
    return { ok: true, value: request };
  }
  async function applyDefinition(draft: DefinitionDraft): Promise<Result<Receipt>> {
    const request = definitionRequest(draft, bindings);
    if (!request.ok) {
      definitions.unlockWithoutRequest(draft.key);
      return request;
    }
    const retained = retainDefinitionRequest(draft, request.value);
    if (!retained.ok) {
      definitions.unlockWithoutRequest(draft.key);
      return retained;
    }
    return submit(retained.value, draft.generation, state.sourceEdit, null);
  }
  /** Captured Model changes share request assembly; their feature decides the semantic change list. */
  async function applyChanges(
    draft: Pick<ObjectDraft | DefinitionDraft, 'base' | 'collection' | 'generation'>,
    changes: readonly import('../contract/records/owners.js').Change[],
  ): Promise<Result<Receipt>> {
    const request = bindings.inputs.model(
      draft.base,
      draft.collection.id,
      changes,
      bindings.nextId(),
    );
    if (!request.ok) return request;
    return submit(request.value, draft.generation, state.sourceEdit, null);
  }
  /** Add keeps diagram and object creation on the existing Model → Authoring receipt path. */
  async function addDiagram(draft: AddDiagramDraft): Promise<Result<Receipt>> {
    const active = state.active;
    const draftError = diagramDraftError(active, state.snapshot, draft);
    if (draftError !== null) return retainCreationFailure(draftError);
    const title = draft.title.trim();
    const captured = diagramTarget(active as ActiveDiagram);
    if (!captured.ok) return retainCreationFailure(captured);
    const capture = captured.value;
    update({ creation: { ...state.creation, diagram: draft, problem: null, busy: true } });
    const section = {
      id: capture.id,
      title,
      mode: draft.mode,
      order: capture.collection.sections.length,
      layout: {
        algorithm: 'grid' as const,
        direction: 'right' as const,
        gap: 'normal' as const,
        constraints: [],
      },
      appearances: [],
      groups: [],
      wires: [],
      sequence: [],
    };
    const result = await submitCreation(capture, [
      { op: 'create', target: 'sections', value: section },
    ]);
    return finishCreation(result, 'diagram');
  }
  function diagramDraftError(
    active: ActiveDiagram | null,
    snapshot: WorkspaceView['snapshot'],
    draft: AddDiagramDraft,
  ): Extract<Result<never>, { ok: false }> | null {
    if (active === null || snapshot === null) return creationFailure('Open a collection first.');
    return draft.title.trim().length === 0
      ? creationFailure('Give the diagram a name before adding it.')
      : null;
  }
  function diagramTarget(active: ActiveDiagram): Result<NonNullable<typeof diagramCapture>> {
    const capture =
      diagramCapture ??
      (diagramCapture = {
        id: `section-${bindings.nextId()}` as Section['id'],
        base: active.base,
        collection: active.document.collection,
        generation: active.generation,
        request: null,
      });
    const error = captureCollectionError(capture.collection.id, active.document.collection.id);
    return error === null ? { ok: true, value: capture } : error;
  }
  /** New objects are created once; reuse only adds a section-local appearance of the same ID. */
  async function addObject(draft: AddObjectDraft): Promise<Result<Receipt>> {
    const context = creationContext(draft);
    if (!context.ok) return retainCreationFailure(context);
    objectCapture ??= {
      id: `object-${bindings.nextId()}` as DiagramObject['id'],
      base: context.value.active.base,
      collection: context.value.active.document.collection,
      generation: context.value.active.generation,
      request: null,
    };
    update({ creation: { ...state.creation, object: draft, problem: null, busy: true } });
    const payload = creationPayload(context.value, draft);
    if (!payload.ok) return retainCreationFailure(payload);
    const changes = creationChanges(payload.value.object, draft.reuseObject, payload.value.section);
    const result = await submitCreation(objectCapture, changes);
    return finishCreation(result, 'object');
  }
  async function addGroup(draft: AddGroupDraft): Promise<Result<Receipt>> {
    const context = groupContext(draft);
    if (!context.ok) return retainCreationFailure(context);
    groupCapture ??= {
      id: `group-${bindings.nextId()}` as Group['id'],
      base: context.value.active.base,
      collection: context.value.active.document.collection,
      generation: context.value.active.generation,
      request: null,
    };
    const problem = groupDraftProblem(draft, context.value.section);
    if (problem !== null) return retainCreationFailure(creationFailure(problem));
    update({ creation: { ...state.creation, group: draft, problem: null, busy: true } });
    const group: Group = {
      id: groupCapture.id,
      title: draft.title.trim(),
      frame: 'panel' as const,
      role: 'neutral',
      layout: {
        algorithm: context.value.section.layout.algorithm,
        direction: context.value.section.layout.direction,
        gap: context.value.section.layout.gap,
        constraints: [],
      },
    };
    const section = {
      ...context.value.section,
      groups: [...context.value.section.groups, group],
    };
    const result = await submitCreation(
      groupCapture,
      groupCreationChanges(section, draft.findRoom === true),
    );
    return finishCreation(result, 'group');
  }
  async function submitCreation(
    capture: {
      readonly base: NonNullable<WorkspaceView['snapshot']>;
      readonly collection: ActiveDiagram['document']['collection'];
      readonly generation: string;
      request: Request | null;
    },
    changes: readonly import('../contract/records/owners.js').Change[],
  ): Promise<Result<Receipt>> {
    const request =
      capture.request === null
        ? bindings.inputs.model(capture.base, capture.collection.id, changes, bindings.nextId())
        : { ok: true as const, value: capture.request };
    if (!request.ok) return retainCreationFailure(request);
    capture.request ??= request.value;
    return submit(capture.request, capture.generation, state.sourceEdit, null);
  }
  function finishCreation(
    result: Result<Receipt>,
    kind: 'diagram' | 'object' | 'group',
  ): Result<Receipt> {
    const origin = captureOf(kind)?.collection;
    settleCreation(result, kind);
    settleCreationElsewhere(origin, result);
    return result;
  }
  function settleCreation(result: Result<Receipt>, kind: 'diagram' | 'object' | 'group'): void {
    if (!result.ok) return settleRefusedCreation(result.error, kind);
    clearCreationCapture(kind);
    update({ creation: creationAfterSuccess(kind) });
  }
  function settleRefusedCreation(error: Diagnostic, kind: 'diagram' | 'object' | 'group'): void {
    releaseRefusedCreation(kind);
    update({
      creation: { ...state.creation, problem: plainMessage(error.message), busy: creationLocked() },
    });
  }
  /** Another collection opened while this add was in flight: its forms start empty and its refusal is not shown there. */
  function settleCreationElsewhere(
    origin: ActiveDiagram['document']['collection'] | undefined,
    result: Result<Receipt>,
  ): void {
    if (!openedElsewhere(origin)) return;
    update({ creation: freshCreation() });
    if (!result.ok) reportRefusedElsewhere(origin, result.error);
  }
  function openedElsewhere(
    origin: ActiveDiagram['document']['collection'] | undefined,
  ): origin is ActiveDiagram['document']['collection'] {
    return (
      origin !== undefined &&
      origin.id !== state.active?.document.collection.id &&
      !creationLocked()
    );
  }
  function reportRefusedElsewhere(
    origin: ActiveDiagram['document']['collection'],
    error: Diagnostic,
  ): void {
    const reason = plainMessage(error.message);
    update({ problem: null, status: `Add to "${origin.title}" was not applied: ${reason}` });
  }
  function captureOf(kind: 'diagram' | 'object' | 'group') {
    return { diagram: diagramCapture, object: objectCapture, group: groupCapture }[kind];
  }
  /** A refused or unsent creation changed nothing: the next submit builds a fresh request from the current draft.
   * An uncertain request keeps its capture so a retry cannot create the item twice. */
  function releaseRefusedCreation(kind: 'diagram' | 'object' | 'group'): void {
    const id = captureOf(kind)?.request?.request;
    const item = state.pending.find((entry) => entry.request.request === id);
    if (item !== undefined && item.state !== 'rejected') return;
    clearCreationCapture(kind);
  }
  function creationAfterSuccess(kind: 'diagram' | 'object' | 'group'): WorkspaceView['creation'] {
    return {
      diagram: successDiagramDraft(kind),
      object: successObjectDraft(kind),
      group: successGroupDraft(kind),
      problem: null,
      busy: false,
    };
  }
  function successDiagramDraft(kind: 'diagram' | 'object' | 'group'): AddDiagramDraft {
    return kind === 'diagram'
      ? resetDiagramDraft('diagram', state.creation.diagram)
      : state.creation.diagram;
  }
  function successObjectDraft(kind: 'diagram' | 'object' | 'group'): AddObjectDraft {
    return kind === 'object'
      ? resetObjectDraft('object', state.creation.object)
      : state.creation.object;
  }
  function successGroupDraft(kind: 'diagram' | 'object' | 'group'): AddGroupDraft {
    return kind === 'group' ? resetGroupDraft('group', state.creation.group) : state.creation.group;
  }
  function retainCreationFailure<T>(
    result: Extract<Result<T>, { ok: false }>,
  ): Extract<Result<T>, { ok: false }> {
    update({
      creation: { ...state.creation, problem: plainMessage(result.error.message), busy: false },
    });
    return result;
  }
  function setDiagramDraft(draft: AddDiagramDraft): void {
    if (creationLocked()) return;
    captureDiagramDraft();
    update({ creation: { ...state.creation, diagram: draft, problem: null } });
  }
  function setObjectDraft(draft: AddObjectDraft): void {
    if (creationLocked()) return;
    captureObjectDraft();
    update({ creation: { ...state.creation, object: draft, problem: null } });
  }
  function setGroupDraft(draft: AddGroupDraft): void {
    if (creationLocked()) return;
    captureGroupDraft();
    update({ creation: { ...state.creation, group: draft, problem: null } });
  }
  function cancelCreation(kind: 'diagram' | 'object' | 'group'): void {
    if (creationLocked()) return;
    clearCreationCapture(kind);
    update({
      creation: {
        ...state.creation,
        diagram: resetDiagramDraft(kind, state.creation.diagram),
        object: resetObjectDraft(kind, state.creation.object),
        group: resetGroupDraft(kind, state.creation.group),
        problem: null,
        busy: false,
      },
    });
  }
  function editConnection(edit: ConnectionEdit): void {
    if (connectionCapture?.request !== null || connectionCapture === null) return;
    const current = connectionCapture.draft;
    const next = editedConnection(current, edit);
    connectionCapture.draft = next;
    update({ connection: next, problem: null });
  }
  async function applyConnection(): Promise<Result<Receipt>> {
    const capture = connectionCapture;
    const checks = connectionChecks(capture, state.active);
    const failure = checks.find((check) => !check.ok);
    if (failure !== undefined) return retainConnectionFailure(capture?.draft, failure.error);
    const capturedDraft = (checks[0] as Extract<(typeof checks)[number], { ok: true }>)
      .value as ConnectionDraft;
    const label = (checks[2] as Extract<(typeof checks)[number], { ok: true }>).value as string;
    return submitConnectionRequest(
      capture as { draft: ConnectionDraft; request: Request | null },
      capturedDraft,
      label,
    );
  }
  function retainConnectionFailure(
    draft: ConnectionDraft | undefined,
    error: Diagnostic,
  ): Result<Receipt> {
    if (draft !== undefined)
      update({ connection: { ...draft, problem: error.message }, problem: error });
    return { ok: false, error };
  }
  function connectionErrorView(draft: ConnectionDraft, error: Diagnostic): ConnectionDraft {
    const current = state.connection?.id === draft.id ? state.connection : draft;
    return { ...current, problem: error.message };
  }
  async function submitConnectionRequest(
    capture: { draft: ConnectionDraft; request: Request | null },
    draft: ConnectionDraft,
    label: string,
  ): Promise<Result<Receipt>> {
    const request = connectionRequest(bindings, draft, label);
    if (!request.ok) {
      update({
        connection: connectionErrorView(draft, request.error),
        problem: request.error,
      });
      return request;
    }
    capture.request ??= request.value;
    update({ connection: { ...draft, requestState: 'sending' } });
    const result = await submit(capture.request, draft.generation, state.sourceEdit, draft.id);
    if (!result.ok)
      update({
        connection: connectionErrorView(draft, result.error),
        problem: result.error,
      });
    return result;
  }
  function cancelConnection(): void {
    if (connectionCapture?.request !== null) return;
    connectionCapture = null;
    update({ connection: null, problem: null, status: editStatus() });
  }
  function creationLocked(): boolean {
    return (
      captureHasRequest(diagramCapture) ||
      captureHasRequest(objectCapture) ||
      captureHasRequest(groupCapture)
    );
  }
  function captureHasRequest(capture: { readonly request: Request | null } | null): boolean {
    return capture !== null && capture.request !== null;
  }
  function releaseDismissedCreation(requestId: string): void {
    const released =
      releaseDiagramRequest(requestId) ||
      releaseObjectRequest(requestId) ||
      releaseGroupRequest(requestId) ||
      releaseConnectionRequest(requestId);
    if (!released) return;
    clearDismissedCreationView();
  }
  function releaseDiagramRequest(requestId: string): boolean {
    if (diagramCapture?.request?.request !== requestId) return false;
    diagramCapture = null;
    return true;
  }
  function releaseObjectRequest(requestId: string): boolean {
    if (objectCapture?.request?.request !== requestId) return false;
    objectCapture = null;
    return true;
  }
  function releaseGroupRequest(requestId: string): boolean {
    if (groupCapture?.request?.request !== requestId) return false;
    groupCapture = null;
    return true;
  }
  function releaseConnectionRequest(requestId: string): boolean {
    if (connectionCapture?.request?.request !== requestId) return false;
    connectionCapture.request = null;
    connectionCapture.draft = { ...connectionCapture.draft, problem: null, requestState: 'draft' };
    update({ connection: connectionCapture.draft });
    return true;
  }
  function clearDismissedCreationView(): void {
    update({ creation: { ...state.creation, problem: null, busy: false } });
  }
  function captureDiagramDraft(): void {
    const active = state.active;
    if (diagramCapture === null && active !== null)
      diagramCapture = {
        id: `section-${bindings.nextId()}` as Section['id'],
        base: active.base,
        collection: active.document.collection,
        generation: active.generation,
        request: null,
      };
  }
  function captureObjectDraft(): void {
    const active = state.active;
    if (objectCapture === null && active !== null)
      objectCapture = {
        id: `object-${bindings.nextId()}` as DiagramObject['id'],
        base: active.base,
        collection: active.document.collection,
        generation: active.generation,
        request: null,
      };
  }
  function captureGroupDraft(): void {
    const active = state.active;
    if (groupCapture !== null || active === null) return;
    groupCapture = {
      id: `group-${bindings.nextId()}` as Group['id'],
      base: active.base,
      collection: active.document.collection,
      generation: active.generation,
      request: null,
    };
  }
  /** Add forms belong to one collection: a newly opened one starts with empty forms and no error.
   * A newer revision of the same collection keeps them; a creation in flight keeps its form until it settles. */
  function creationForOpenedCollection(
    active: ActiveDiagram | null,
    document: RenderDocument,
  ): WorkspaceView['creation'] {
    if (active?.document.collection.id === document.collection.id) return state.creation;
    return creationLocked() ? state.creation : freshCreation();
  }
  function freshCreation(): WorkspaceView['creation'] {
    creationKinds.forEach(clearCreationCapture);
    return {
      diagram: resetDiagramDraft('diagram', state.creation.diagram),
      object: resetObjectDraft('object', state.creation.object),
      group: resetGroupDraft('group', state.creation.group),
      problem: null,
      busy: false,
    };
  }
  function clearCreationCapture(kind: 'diagram' | 'object' | 'group'): void {
    const clearers: Readonly<Record<typeof kind, () => void>> = {
      diagram: () => {
        diagramCapture = null;
      },
      object: () => {
        objectCapture = null;
      },
      group: () => {
        groupCapture = null;
      },
    };
    clearers[kind]();
  }
  function resetDiagramDraft(
    kind: 'diagram' | 'object' | 'group',
    current: AddDiagramDraft,
  ): AddDiagramDraft {
    return kind === 'diagram' ? { title: '', mode: 'grid' } : current;
  }
  function resetObjectDraft(
    kind: 'diagram' | 'object' | 'group',
    current: AddObjectDraft,
  ): AddObjectDraft {
    return kind === 'object'
      ? { section: '', label: '', kind: 'module', reuseObject: null, group: null }
      : current;
  }
  function resetGroupDraft(
    kind: 'diagram' | 'object' | 'group',
    current: AddGroupDraft,
  ): AddGroupDraft {
    return kind === 'group' ? { section: '', title: '' } : current;
  }
  function creationPayload(
    context: { active: ActiveDiagram; section: Section },
    draft: AddObjectDraft,
  ): Result<{ object: DiagramObject; section: Section }> {
    const object = creationObject(context.active.document.collection.objects, draft);
    if (!object.ok) return object;
    const checked = checkAppearance(context.section, object.value);
    if (!checked.ok) return checked;
    return {
      ok: true,
      value: {
        object: object.value,
        section: {
          ...context.section,
          appearances: [
            ...context.section.appearances,
            appearanceFor(object.value.id, draft.group),
          ],
        },
      },
    };
  }
  function appearanceFor(
    object: DiagramObject['id'],
    group: string | null,
  ): Section['appearances'][number] {
    return group === null
      ? { object, detail: 'full' }
      : { object, detail: 'full', group: group as Group['id'] };
  }
  function creationContext(
    draft: AddObjectDraft,
  ): Result<{ active: ActiveDiagram; section: Section }> {
    const active = state.active;
    if (active === null) return creationFailure('Open a collection first.');
    const captureError = captureCollectionError(
      objectCapture?.collection.id,
      active.document.collection.id,
    );
    if (captureError !== null) return captureError;
    const collection = objectCapture?.collection ?? active.document.collection;
    const section = collection.sections.find((item) => item.id === draft.section);
    return sectionResult(section, active, objectCapture, collection);
  }
  function groupContext(draft: AddGroupDraft): Result<{ active: ActiveDiagram; section: Section }> {
    const active = state.active;
    if (active === null) return creationFailure('Open a collection first.');
    const captureError = captureCollectionError(
      groupCapture?.collection.id,
      active.document.collection.id,
    );
    if (captureError !== null) return captureError;
    const collection = groupCapture?.collection ?? active.document.collection;
    const section = collection.sections.find((item) => item.id === draft.section);
    return sectionResult(section, active, groupCapture, collection);
  }
  function sectionResult(
    section: Section | undefined,
    active: ActiveDiagram,
    capture: NonNullable<typeof objectCapture> | NonNullable<typeof groupCapture> | null,
    collection: ActiveDiagram['document']['collection'],
  ): Result<{ active: ActiveDiagram; section: Section }> {
    if (section === undefined) return creationFailure('Choose an existing diagram.');
    const target =
      capture === null
        ? active
        : {
            ...active,
            base: capture.base,
            generation: capture.generation,
            document: { ...active.document, collection },
          };
    return { ok: true, value: { active: target, section } };
  }
  function captureCollectionError(
    captured: string | undefined,
    current: string,
  ): Extract<Result<never>, { ok: false }> | null {
    return captured !== undefined && captured !== current
      ? creationFailure('This draft belongs to another collection. Reopen it there or cancel it.')
      : null;
  }
  function creationObject(
    objects: readonly DiagramObject[],
    draft: AddObjectDraft,
  ): Result<DiagramObject> {
    if (draft.reuseObject !== null) {
      return existingObject(objects, draft.reuseObject);
    }
    const label = draft.label.trim();
    if (label.length === 0) return creationFailure('Give the object a name before adding it.');
    return {
      ok: true,
      value: newObject(objectCapture?.id ?? bindings.nextId(), draft.kind, label),
    };
  }
  function existingObject(objects: readonly DiagramObject[], id: string): Result<DiagramObject> {
    const object = objects.find((item) => item.id === id);
    return object === undefined
      ? creationFailure('Choose an existing object to reuse.')
      : { ok: true, value: object };
  }
  function newObject(id: string, kind: AddObjectDraft['kind'], label: string): DiagramObject {
    return {
      id: `object-${id}` as DiagramObject['id'],
      kind,
      label,
      role: 'neutral',
      size: 'medium',
      frame: 'auto',
      composition: 'stack',
      content: [],
      ports: [],
      sources: [],
    };
  }
  function checkAppearance(section: Section, object: DiagramObject): Result<void> {
    return section.appearances.some((appearance) => appearance.object === object.id)
      ? creationFailure('That object is already in this diagram.')
      : { ok: true, value: undefined };
  }
  function creationChanges(
    object: DiagramObject,
    reuseObject: string | null,
    section: Section,
  ): readonly import('../contract/records/owners.js').Change[] {
    const appearance = { op: 'replace' as const, target: 'sections' as const, value: section };
    return reuseObject === null
      ? [{ op: 'create' as const, target: 'objects' as const, value: object }, appearance]
      : [appearance];
  }
  function creationFailure<T = never>(message: string): Extract<Result<T>, { ok: false }> {
    return {
      ok: false,
      error: {
        code: 'invalid-creation',
        message,
        recovery: 'Correct the Add form and try again.',
        owner: 'workspace',
      },
    };
  }
  /** Library commands use the same durable request journal and captured catalog versions as diagram editing. */
  async function applyLibrary(
    base: import('../contract/records/owners.js').Snapshot,
    changes: readonly import('@novakai/canvas-library').CatalogChange[],
  ): Promise<Result<Receipt>> {
    const request = bindings.inputs.library(base, changes, bindings.nextId());
    if (!request.ok) return request;
    return submit(request.value, state.generation, state.sourceEdit, null);
  }
  /** Opening the chooser is a presentation intent; it never disposes the retained Canvas session. */
  function beginCollectionSwitch(): void {
    if (state.collectionSwitch.phase === 'loading') return;
    invalidateRender();
    update({
      opening: null,
      collectionSwitch: { phase: 'choosing', activeId: activeId() },
      ...renderProblemUpdate(),
    });
  }
  /** Cancellation invalidates transport ownership before closing the controlled dialog. */
  function cancelCollectionSwitch(): void {
    if (state.collectionSwitch.phase === 'idle') return;
    invalidateRender();
    update({
      opening: null,
      collectionSwitch: { phase: 'idle', activeId: activeId() },
      status: state.active === null ? 'Ready' : editStatus(),
      ...renderProblemUpdate(),
    });
    refreshActive();
    void refreshHistory();
  }
  /** A newer explicit target always supersedes an older target, including an in-flight request. */
  function chooseCollection(id: string): void {
    if (id === activeId()) {
      cancelCollectionSwitch();
      return;
    }
    if (state.collectionSwitch.phase === 'idle') beginCollectionSwitch();
    void requestOpen(id, 'chooser');
  }
  /** Retry uses the failed target but captures the current snapshot and generation again. */
  function retryCollectionSwitch(): void {
    if (state.collectionSwitch.phase !== 'failed') return;
    chooseCollection(state.collectionSwitch.targetId);
  }
  /** Returning to discovery retains source and inspector drafts but disposes the old viewing session. */
  function showLibrary(): void {
    invalidateRender();
    update({ collectionSwitch: { phase: 'idle', activeId: null } });
    state.active?.session.dispose();
    source.close('keep');
    update({ active: null, opening: null });
    const location = bindings.navigation.opened(null);
    if (!location.ok) report(location.error);
  }
  /** Connection hints affect controls, not saved state. A reconnect rereads owners and leaves pending requests untouched. */
  function connection(connected: boolean): void {
    update({ connected });
    state.active?.session.dispatch({ kind: 'connected', value: connected });
  }
  /** Mount and unmount own the event stream; no global listener survives disposal. */
  async function startWorkspace(): Promise<void> {
    await refresh();
    if (disposed) return;
    restoreEdits();
    await restoreLocation();
  }
  function markReady(): void {
    if (!state.sourceDirty) update({ status: 'Ready' });
  }
  async function start(): Promise<void> {
    removeHistoryKeys = bindHistoryKeys(navigateHistory);
    await startWorkspace();
    if (disposed) return;
    unsubscribe = bindings.client.changes(() => {
      // The local receipt refresh includes every commit made while its submission was in flight.
      if (!state.busy) void refresh();
    }, connection);
    markReady();
  }
  /** A saved collection link restores the actual canonical diagram, including human placement records. */
  async function restoreLocation(): Promise<void> {
    const location = bindings.navigation.current();
    if (!location.ok) {
      report(location.error);
      return;
    }
    if (location.value !== null) await open(location.value);
  }
  /** Startup recovery is tied to the checked workspace identity; it makes no mutation request. */
  function restoreEdits(): void {
    if (state.snapshot === null) return;
    if (restoredWorkspace === state.snapshot.workspace) return;
    restoredWorkspace = state.snapshot.workspace;
    bindings.panels.restore(state.snapshot.workspace);
    submissions.restore(state.snapshot.workspace);
    void reconcileHistory();
    source.restore(state.snapshot.workspace);
    inspector.restore(state.snapshot.workspace);
    definitions.restore(state.snapshot.workspace);
    wires.restore(state.snapshot.workspace);
  }
  /** Human-triggered reconciliation is read-only and makes missing confirmation explicit. */
  async function reconcileRequest(id: string): Promise<void> {
    const result = await submissions.reconcile(id);
    if (!result.ok) {
      report(result.error);
      return;
    }
    handleReconciliationResult(result.value, id);
  }
  function handleReconciliationResult(receipt: Receipt | null, id: string): void {
    clearSettledUncertainty();
    if (receipt === null) update({ status: 'No receipt found — retry remains an explicit action' });
    else settleConfirmedCreation(id);
  }
  /** "Could not be confirmed" is stale once no request remains unconfirmed. */
  function clearSettledUncertainty(): void {
    const stale = staleUncertainty();
    if (stale === null) return;
    update({ problem: null, creation: creationWithout(plainMessage(stale.message)) });
  }
  function staleUncertainty(): Diagnostic | null {
    if (state.problem?.code !== 'connection-uncertain') return null;
    return state.pending.some((item) => item.state === 'uncertain') ? null : state.problem;
  }
  function creationWithout(message: string): WorkspaceView['creation'] {
    return state.creation.problem === message
      ? { ...state.creation, problem: null }
      : state.creation;
  }
  /** Retry retains the exact request body while using the current authenticated transport session. */
  async function retryRequest(id: string): Promise<void> {
    const result = await submissions.retry(id, state.generation);
    if (!result.ok) report(result.error);
    else settleRetried(id);
    updateMovementRecovery(id);
  }
  function settleRetried(id: string): void {
    clearSettledUncertainty();
    settleConfirmedCreation(id);
  }
  function updateMovementRecovery(requestId: string): void {
    if (movementCapture?.intent.id !== requestId || state.movementReview === null) return;
    const pending = state.pending.find((item) => item.request.request === requestId);
    applyMovementRecoveryPhase(requestId, pending);
  }
  function applyMovementRecoveryPhase(requestId: string, pending: Submission | undefined): void {
    if (pending?.state === 'rejected') return retainRejectedMovement(requestId);
    if (isPendingMovement(pending)) retainUncertainMovement(requestId);
  }
  function retainRejectedMovement(requestId: string): void {
    movementApplying = false;
    update({
      movementReview: state.movementReview
        ? { ...state.movementReview, phase: 'rejected', requestId }
        : null,
    });
    updateMutationAvailability();
  }
  /** Status reads never change navigation; stale responses cannot replace newer status. */
  async function refreshHistory(): Promise<void> {
    const token = ++historyRead;
    const response = await bindings.client.get('/api/v1/history');
    if (token !== historyRead) return;
    receiveHistory(response);
  }
  function receiveHistory(response: Awaited<ReturnType<WorkspaceBindings['client']['get']>>): void {
    if (!response.ok) return clearHistory();
    receiveHistoryOutcome(response.value.outcome);
  }
  function receiveHistoryOutcome(outcome: Result<unknown>): void {
    if (!outcome.ok) return clearHistory();
    const checked = historyStatusSchema.safeParse(outcome.value);
    if (!checked.success) return clearHistory();
    update({ history: { status: checked.data, busy: historyGate } });
    releaseHistory();
  }
  function clearHistory(): void {
    update({ history: { status: null, busy: historyGate } });
  }
  function historyBlocked(): boolean {
    return historyGate || state.pending.some((item) => item.state !== 'rejected');
  }
  function setHistoryGate(busy: boolean): void {
    historyGate = busy;
    update({ history: { status: state.history?.status ?? null, busy } });
    updateMutationAvailability();
  }
  /** Claim synchronously before any await, then retain the exact selected request through submission recovery. */
  function cannotNavigateHistory(): boolean {
    return historyBlocked() || Boolean(state.active?.session.getSnapshot().draft);
  }
  async function navigateHistory(direction: 'undo' | 'redo'): Promise<void> {
    if (cannotNavigateHistory()) return;
    const status = state.history?.status;
    if (!status) return;
    setHistoryGate(true);
    await submitHistory(status, direction);
  }
  async function submitHistory(
    status: NonNullable<WorkspaceView['history']>['status'],
    direction: 'undo' | 'redo',
  ): Promise<void> {
    try {
      await sendHistory(status, direction);
    } finally {
      releaseNavigationAttempt();
    }
  }
  function releaseNavigationAttempt(): void {
    if (!historyRefreshing) setHistoryGate(false);
  }
  async function sendHistory(status: unknown, direction: 'undo' | 'redo'): Promise<void> {
    const request = bindings.inputs.history(status, direction, bindings.nextId());
    if (!request.ok) return report(request.error);
    if (request.value !== null) await applyHistoryRequest(request.value);
  }
  async function applyHistoryRequest(request: Request): Promise<void> {
    const result = await submit(request, state.generation, state.sourceEdit, null);
    if (!result.ok) await finishHistory();
  }
  async function reconcileHistory(): Promise<void> {
    const inverses = state.pending.filter(
      (item) => item.request.intent.kind !== 'change' && item.state !== 'rejected',
    );
    for (const item of inverses) await reconcileRequest(item.request.request);
  }
  /** A receipt does not release editing until the canonical scene and targets have caught up. */
  async function finishHistory(sequence = state.snapshot?.sequence ?? 0): Promise<void> {
    historyRefreshing = true;
    historySequence = sequence;
    historySnapshotReady = false;
    historyRead += 1;
    clearHistory();
    setHistoryGate(true);
    await refresh();
    await refreshHistory();
    releaseHistory();
  }
  function releaseHistory(): void {
    if (!historyReady()) return;
    historyRefreshing = false;
    setHistoryGate(false);
  }
  function historyReady(): boolean {
    return (
      historyRefreshing &&
      rendering === null &&
      historySnapshotReady &&
      matchingHistoryVersion() &&
      displayedHistoryCurrent()
    );
  }
  function matchingHistoryVersion(): boolean {
    const token = state.history?.status?.navigationVersion;
    if (!token) return false;
    const record = state.snapshot?.records.find(
      (item) => item.key.kind === token.key.kind && item.key.id === token.key.id,
    );
    return record?.version === token.version;
  }
  function displayedHistoryCurrent(): boolean {
    return state.active === null || currentDiagram(state.active);
  }
  function currentDiagram(active: ActiveDiagram): boolean {
    return state.collections.some(
      (item) =>
        item.id === active.document.collection.id &&
        item.revision === active.document.collection.revision,
    );
  }
  function chooseMoveOption(optionId: string): void {
    const capture = movementCapture;
    if (!canChooseMovementOption(capture)) return;
    if (!applyMovementOption(capture, optionId)) return;
    updateChosenMovementOption(optionId);
  }
  function updateChosenMovementOption(optionId: string): void {
    update({ movementReview: state.movementReview ? { ...state.movementReview, optionId } : null });
  }
  function applyMovementOption(
    capture: NonNullable<typeof movementCapture>,
    optionId: string,
  ): boolean {
    const option = capture.review.options.find((item) => item.id === optionId);
    if (option === undefined) return false;
    return acceptMovementOptionPreview(capture, option);
  }
  function canChooseMovementOption(
    capture: typeof movementCapture,
  ): capture is NonNullable<typeof movementCapture> {
    const phase = state.movementReview?.phase;
    return capture !== null && !movementApplying && (phase === 'review' || phase === 'rejected');
  }
  function acceptMovementOptionPreview(
    capture: NonNullable<typeof movementCapture>,
    option: NonNullable<typeof movementCapture>['review']['options'][number],
  ): boolean {
    const accepted = capture.active.session.dispatch({
      kind: 'preview-routes',
      id: capture.intent.id,
      ...option.preview,
    });
    if (accepted.ok && accepted.value.state.routePreview?.gesture === capture.intent.id)
      return true;
    report({
      code: 'invalid-edit',
      message: 'The selected movement preview could not be accepted.',
      recovery: 'Keep the current preview or cancel the draft.',
      owner: 'workspace',
    });
    return false;
  }

  async function applyMove(optionId: string): Promise<void> {
    const prepared = prepareMovementApplication(optionId);
    if (prepared === null) return;
    const { capture, currentStamp } = prepared;
    const selected = resolveMovementSelection(capture, optionId, currentStamp);
    if (selected === undefined || !hasCurrentMovementPreview(capture)) return;
    movementApplying = true;
    update({
      movementReview: {
        review: capture.review,
        optionId,
        phase: 'sending',
        requestId: capture.intent.id,
        document: capture.active.document,
      },
      status: 'Saving…',
    });
    updateMutationAvailability();
    await submitFeasibleCanvas(capture.active, capture.intent, selected.changes, selected.preview);
  }
  function prepareMovementApplication(optionId: string): {
    capture: NonNullable<typeof movementCapture>;
    currentStamp: ReturnType<ActiveDiagram['session']['getSnapshot']>['stamp'];
  } | null {
    const capture = movementCapture;
    if (!canApplyMovement(capture, optionId)) return null;
    if (movementSubmissionBlocked()) {
      reportMovementSubmissionBlocked();
      return null;
    }
    return { capture, currentStamp: capture.active.session.getSnapshot().stamp };
  }
  function canApplyMovement(
    capture: typeof movementCapture,
    optionId: string,
  ): capture is NonNullable<typeof movementCapture> {
    return (
      capture !== null &&
      !movementApplying &&
      state.movementReview?.optionId === optionId &&
      state.movementReview.phase === 'review'
    );
  }
  function movementSubmissionBlocked(): boolean {
    return (
      state.pending.some((item) => item.state !== 'rejected') ||
      historyBlocked() ||
      state.history?.busy === true
    );
  }
  function reportMovementSubmissionBlocked(): void {
    report({
      code: 'pending-request',
      message: 'Wait for the current operation to finish',
      recovery: 'Your movement draft is retained.',
      owner: 'workspace',
    });
  }
  function isCurrentMovementChoice(
    capture: NonNullable<typeof movementCapture>,
    chosen: ReturnType<NonNullable<WorkspaceBindings['chooseMoveOption']>>,
    selected: Extract<typeof chosen, { ok: true }>['value'] | undefined,
    currentStamp: ReturnType<ActiveDiagram['session']['getSnapshot']>['stamp'],
  ): selected is NonNullable<typeof selected> {
    if (movementChoiceMatches(capture, chosen, selected, currentStamp)) return true;
    reportMovementChoiceError(chosen);
    return false;
  }
  function movementChoiceMatches(
    capture: NonNullable<typeof movementCapture>,
    chosen: ReturnType<NonNullable<WorkspaceBindings['chooseMoveOption']>>,
    selected: Extract<typeof chosen, { ok: true }>['value'] | undefined,
    currentStamp: ReturnType<ActiveDiagram['session']['getSnapshot']>['stamp'],
  ): boolean {
    return [
      chosen.ok,
      selected !== undefined,
      capture.active === state.active,
      capture.active.generation === state.generation,
      currentDiagram(capture.active),
      state.snapshot?.workspace === capture.workspace,
      currentStamp.revision === capture.review.stamp.revision,
      currentStamp.inputKey === capture.review.stamp.inputKey,
      currentStamp.generation === capture.review.stamp.generation,
    ].every(Boolean);
  }
  function reportMovementChoiceError(
    chosen: ReturnType<NonNullable<WorkspaceBindings['chooseMoveOption']>>,
  ): void {
    report(
      chosen.ok
        ? {
            code: 'stale-gesture',
            message: 'This movement review is stale; the draft was retained.',
            recovery: 'Reload the diagram before applying it.',
            owner: 'workspace',
          }
        : chosen.error,
    );
  }
  function resolveMovementSelection(
    capture: NonNullable<typeof movementCapture>,
    optionId: string,
    currentStamp: ReturnType<ActiveDiagram['session']['getSnapshot']>['stamp'],
  ):
    | NonNullable<
        Extract<
          ReturnType<NonNullable<WorkspaceBindings['chooseMoveOption']>>,
          { ok: true }
        >['value']
      >
    | undefined {
    const chosen =
      bindings.chooseMoveOption?.(capture.review, optionId, currentStamp) ??
      chooseReviewedMoveOption(capture.review, optionId, currentStamp);
    if (chosen === undefined) return undefined;
    const selected = selectedMovementChoice(chosen);
    return isCurrentMovementChoice(capture, chosen, selected, currentStamp) ? selected : undefined;
  }
  function selectedMovementChoice(
    chosen: ReturnType<NonNullable<WorkspaceBindings['chooseMoveOption']>>,
  ): Extract<typeof chosen, { ok: true }>['value'] | undefined {
    return chosen.ok ? chosen.value : undefined;
  }
  function hasCurrentMovementPreview(capture: NonNullable<typeof movementCapture>): boolean {
    if (capture.active.session.getSnapshot().routePreview?.gesture === capture.intent.id)
      return true;
    report({
      code: 'invalid-edit',
      message: 'The inspected movement preview is no longer displayed.',
      recovery: 'Restore the preview or cancel this retained draft.',
      owner: 'workspace',
    });
    return false;
  }
  function cancelMove(): void {
    const capture = movementCapture;
    if (
      capture === null ||
      movementApplying ||
      (state.movementReview?.phase !== 'review' && state.movementReview?.phase !== 'rejected')
    ) {
      report({
        code: 'pending-request',
        message: 'This movement is already being saved; wait for confirmation before cancelling.',
        recovery: 'Check the retained request for its receipt.',
        owner: 'workspace',
      });
      return;
    }
    capture.active.session.dispatch({ kind: 'discard', id: capture.intent.id });
    movementCapture = null;
    movementApplying = false;
    update({ movementReview: null, status: 'Movement cancelled', problem: null });
    updateMutationAvailability();
  }
  async function exportArtifact(input: unknown): Promise<Result<BinaryResponse>> {
    if (bindings.client.bytes === undefined)
      return {
        ok: false,
        error: {
          code: 'export-unavailable',
          message: 'Export is unavailable in this service session.',
          recovery: 'Reconnect to the workspace and try again.',
        },
      };
    return bindings.client.bytes('/api/v1/export', input);
  }
  return {
    navigateHistory,
    inspector,
    definitions,
    wires,
    library,
    showLibrary,
    beginCollectionSwitch,
    cancelCollectionSwitch,
    chooseCollection,
    retryCollectionSwitch,
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start,
    open,
    refresh,
    showSource: source.show,
    editSource: source.edit,
    applySource: source.apply,
    closeSource: source.close,
    reconcileRequest,
    dismissRequest,
    // Clearing the problem also dismisses the refused request (see update).
    dismissProblem: () => update({ problem: null, status: editStatus() }),
    retryRequest,
    create,
    addDiagram,
    addObject,
    addGroup,
    setDiagramDraft,
    setObjectDraft,
    setGroupDraft,
    cancelCreation,
    editConnection,
    applyConnection,
    cancelConnection,
    exportArtifact,
    report,
    applyMove,
    chooseMoveOption,
    cancelMove,
    dispose: () => {
      disposed = true;
      removeHistoryKeys();
      unsubscribe();
      stopEditorStatus.forEach((stop) => stop());
      invalidateRender();
      snapshotRead += 1;
      state.active?.session.dispose();
      listeners.clear();
    },
  };
}

function connectionDiagnostic(code: string, message: string, recovery: string): Diagnostic {
  return { code, message, recovery } as Diagnostic;
}
/** Same-workspace monotonic revisions can update the existing session without losing its camera or selection. */
function reusableSession(
  active: ActiveDiagram | null,
  document: RenderDocument,
  base: NonNullable<WorkspaceView['snapshot']>,
): boolean {
  if (active === null) return false;
  return (
    sameCollection(active, document, base) &&
    document.collection.revision >= active.document.collection.revision
  );
}
/** A restore may lower revision; a fresh Canvas session can retain the viewing position, but never old edit preconditions. */
function retainCamera(
  active: ActiveDiagram | null,
  session: import('../contract/records/owners.js').SessionStore,
  document: RenderDocument,
  base: NonNullable<WorkspaceView['snapshot']>,
): void {
  if (active === null) return;
  if (sameCollection(active, document, base))
    session.dispatch({ kind: 'viewport', camera: active.session.getSnapshot().camera });
}
/** Collection IDs are meaningful only within their workspace. */
function sameCollection(
  active: ActiveDiagram,
  document: RenderDocument,
  base: NonNullable<WorkspaceView['snapshot']>,
): boolean {
  return (
    active.base.workspace === base.workspace &&
    active.document.collection.id === document.collection.id
  );
}

/** Transport generation is part of the render input even when the collection revision is unchanged. */
function renderChanged(active: ActiveDiagram, revision: number, generation: string): boolean {
  return revision !== active.document.collection.revision || active.generation !== generation;
}

/** Keep browser editing shortcuts native, including composition and nested editable elements. */
function editorOwns(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.isComposing) return true;
  return event.composedPath().some(editableTarget);
}
function editableTarget(target: EventTarget): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches('input, textarea, select'))
  );
}
function direction(event: KeyboardEvent): 'undo' | 'redo' | null {
  if (!historyKey(event) || editorOwns(event)) return null;
  return event.shiftKey ? 'redo' : 'undo';
}
function historyKey(event: KeyboardEvent): boolean {
  return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !event.altKey;
}

/** The host owns shortcuts even when all interface chrome is hidden. */
function bindHistoryKeys(navigate: (direction: 'undo' | 'redo') => Promise<void>): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handle = (event: KeyboardEvent): void => {
    const target = direction(event);
    if (target === null) return;
    event.preventDefault();
    if (!event.repeat) void navigate(target);
  };
  window.addEventListener('keydown', handle);
  return () => window.removeEventListener('keydown', handle);
}
