import type { ObjectDraft } from '../contract/records/inspector.js';
import type { DiagramObject } from '../contract/records/owners.js';
import type { Submission } from '../contract/records/submission.js';
import type { Receipt } from '../contract/records/owners.js';
import type { Result } from '../contract/errors.js';
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
import type { Diagnostic } from '../contract/errors.js';
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
    status: 'Connecting…',
    problem: null,
    connected: false,
    busy: false,
    pending: [],
    ...source.getSnapshot(),
  };
  const listeners = new Set<() => void>();
  const confirmedGestures = new Set<string>();
  let unsubscribe = (): void => undefined;
  let renderJob: AbortController | null = null;
  let rendering: { id: string; revision: number; generation: string } | null = null;
  let snapshotRead = 0;
  let restoredWorkspace: string | null = null;
  const inspector = bindings.inspector({ apply: applyObject, report });
  const wires = bindings.wires({ apply: applyChanges, report });
  const library = bindings.library({ apply: applyLibrary, report });
  const submissions = bindings.submissions({ changed: pendingChanged, confirmed, report });
  /** Transmission status is independent of typing and retained failures. */
  function pendingChanged(pending: readonly Submission[]): void {
    update({ pending, busy: pending.some((item) => item.state === 'sending') });
    updateMutationAvailability();
  }
  /** Listeners receive a new immutable view; Canvas panning has its own narrower subscription. */
  function update(patch: Partial<WorkspaceView>): void {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }
  /** Keep the diagram and draft readable when an operation fails. */
  function report(error: Diagnostic): void {
    update({ problem: error, status: error.message });
  }
  /** Workspace hints are reconciled through a full checked Authoring snapshot. */
  async function refresh(): Promise<void> {
    const read = ++snapshotRead;
    const response = await bindings.client.get('/api/v1/workspace');
    if (read !== snapshotRead) return;
    receiveSnapshot(response);
  }
  /** Only the latest requested snapshot can advance transport generation, even when responses arrive out of order. */
  function receiveSnapshot(
    response: Awaited<ReturnType<WorkspaceBindings['client']['get']>>,
  ): void {
    if (!response.ok) {
      update({ opening: null });
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
    update({
      snapshot: latest.snapshot,
      collections: latest.collections,
      generation,
      connected: true,
    });
    restoreEdits();
    library.refresh(latest.snapshot, latest.collections);
    source.reconcile(latest.snapshot, generation);
    updateMutationAvailability();
    refreshActive();
  }
  /** Foreign commits request a new render only when the active collection revision changed. No update performs Fit. */
  function refreshActive(): void {
    const active = state.active;
    if (active === null) return;
    refreshDisplayed(active);
  }
  /** Missing collections return to the library; changed render inputs retain the viewing session. */
  function refreshDisplayed(active: ActiveDiagram): void {
    const current = state.collections.find((item) => item.id === active.document.collection.id);
    if (current === undefined) {
      active.session.dispose();
      update({ active: null, opening: null, status: 'Collection is no longer available' });
      return;
    }
    const requested = rendering;
    if (
      requested?.id === current.id &&
      requested.revision === current.revision &&
      requested.generation === state.generation
    )
      return;
    if (renderChanged(active, current.revision, state.generation))
      void open(active.document.collection.id);
  }
  /** One latest render request owns delivery. Cancelled/superseded jobs cannot mount their results. */
  async function open(id: string): Promise<void> {
    renderJob?.abort();
    const job = new AbortController();
    renderJob = job;
    const generation = state.generation;
    rendering = {
      id,
      revision: state.collections.find((item) => item.id === id)?.revision ?? -1,
      generation,
    };
    update({ opening: id, status: 'Rendering diagram…', problem: null });
    const response = await bindings.client.get(
      `/api/v1/render?id=${encodeURIComponent(id)}`,
      job.signal,
    );
    if (job.signal.aborted) return;
    if (generation !== state.generation) return;
    rendering = null;
    receiveRender(response, id, generation);
  }
  /** Successful HTTP payloads require owner validation before Canvas sees them. */
  function receiveRender(
    response: Awaited<ReturnType<WorkspaceBindings['client']['get']>>,
    id: string,
    generation: string,
  ): void {
    if (!response.ok) {
      update({ opening: null });
      report(response.error);
      return;
    }
    receiveCurrentRender(response.value, id, generation);
  }
  /** A restart response requires a fresh workspace snapshot before any diagram can become editable. */
  function receiveCurrentRender(
    response: import('../contract/records/owners.js').TransportResponse,
    id: string,
    generation: string,
  ): void {
    if (response.generation !== generation) {
      update({ opening: null, connected: false, status: 'Reconnecting to workspace…' });
      void refresh();
      return;
    }
    if (!response.outcome.ok) {
      update({ opening: null });
      report(response.outcome.error);
      return;
    }
    readRender(response.outcome.value, id);
  }
  /** Selected collection identity must match the requested document, even if a delayed server returns another valid diagram. */
  function readRender(input: unknown, id: string): void {
    const document = bindings.inputs.diagram(input);
    if (!document.ok) {
      report(document.error);
      return;
    }
    if (document.value.collection.id !== id) {
      report({
        code: 'stale-diagram',
        message: 'An unrelated diagram response was ignored',
        recovery: 'Open the intended collection again.',
      });
      return;
    }
    install(document.value);
  }
  /** Reuse the existing Canvas session for edits; only explicit collection switching constructs an initially fitted session. */
  function install(document: RenderDocument): void {
    const base = matchingSnapshot(document);
    if (base === null) return;
    installCurrent(document, base);
  }
  /** Bind the displayed document to its matching canonical snapshot before any edit can use its preconditions. */
  function installCurrent(
    document: RenderDocument,
    base: NonNullable<WorkspaceView['snapshot']>,
  ): void {
    const active = state.active;
    if (updateExisting(active, document, base)) return;
    const session = bindings.sessions.open(document, effects);
    if (!session.ok) {
      report(session.error);
      return;
    }
    retainCamera(active, session.value, document, base);
    active?.session.dispose();
    updateLocation(document.collection.id);
    update({
      opening: null,
      active: {
        generation: state.generation,
        document,
        base,
        canvas: bindings.sessions.canvas,
        session: session.value,
      },
      status: editStatus(),
      problem: null,
    });
    source.refreshReadout();
    updateMutationAvailability();
  }
  /** Reuse is an explicit decision, not a type predicate: a valid active session may belong to another collection. */
  function updateExisting(
    active: ActiveDiagram | null,
    document: RenderDocument,
    base: NonNullable<WorkspaceView['snapshot']>,
  ): boolean {
    if (active === null) return false;
    if (!reusableSession(active, document, base)) return false;
    updateCanvas(active, document, base);
    return true;
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
  ): void {
    const updated = bindings.sessions.update(active.session, document);
    if (!updated.ok) {
      report(updated.error);
      return;
    }
    releaseConfirmed(active.session);
    update({
      opening: null,
      active: { ...active, generation: state.generation, document, base },
      status: editStatus(),
      problem: null,
    });
    source.refreshReadout();
    updateMutationAvailability();
  }
  /** Mutations wait for the scene's own transport generation and any in-flight request; navigation stays available. */
  function updateMutationAvailability(): void {
    state.active?.session.dispatch({
      kind: 'mutation-available',
      value: !state.busy && state.active.generation === state.generation,
    });
  }
  /** Rendering acknowledges geometry only, never an unconfirmed edit. */
  function editStatus(): string {
    if (state.sourceDirty) return 'Draft not applied';
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
  /** A busy client retains subsequent gestures as recoverable drafts; no second browser request is submitted concurrently. */
  async function editCanvas(intent: EditIntent): Promise<void> {
    const active = state.active;
    if (active === null) return;
    const planned = bindings.edits.plan(intent, {
      document: active.document,
      stamp: active.session.getSnapshot().stamp,
    });
    if (!planned.ok) {
      report(planned.error);
      return;
    }
    submitCanvas(intent, planned.value);
    previewRoutes(active, intent);
  }
  /** Preview geometry is local and temporary; the ordinary Authoring transaction still owns acceptance. */
  function previewRoutes(active: ActiveDiagram, intent: EditIntent): void {
    if (intent.kind !== 'placement' || bindings.previewRoutes === undefined) return;
    const start = performance.now();
    const preview = bindings.previewRoutes(active.document, intent);
    if (!preview.ok) return;
    const accepted = active.session.dispatch({
      kind: 'preview-routes',
      id: intent.id,
      wires: preview.value,
    });
    if (!accepted.ok) return;
    if (accepted.value.state.routePreview?.gesture !== intent.id) return;
    performance.measure('canvas:released-route-preview', {
      start,
      end: performance.now(),
      detail: { gesture: intent.id },
    });
  }
  /** Capture the snapshot shown with the gesture; changing versions later is never part of retry. */
  function submitCanvas(
    intent: EditIntent,
    changes: readonly import('../contract/records/owners.js').Change[],
  ): void {
    if (state.active === null) return;
    const request = bindings.inputs.model(
      state.active.base,
      intent.base.collectionId,
      changes,
      intent.id,
    );
    if (!request.ok) {
      report(request.error);
      return;
    }
    void submit(request.value, state.active.generation, state.sourceEdit, intent.id);
  }
  /** Submission owns the durable journal and receipt checks; UI retains all drafts on failure. */
  async function submit(
    request: Request,
    generation: string,
    sourceEdit: number,
    gesture: string | null,
  ): Promise<Result<Receipt>> {
    update({ status: 'Saving…', problem: null });
    const result = await submissions.submit({ request, generation, sourceEdit, gesture });
    if (!result.ok) {
      report(result.error);
      void refresh();
      if (gesture !== null)
        state.active?.session.dispatch({
          kind: 'reject',
          id: gesture,
          message: result.error.message,
        });
    }
    return result;
  }
  /** Only a matching Authoring receipt may acknowledge a gesture or mark its submitted source generation saved. */
  function confirmed(submission: Submission, receipt: Receipt): void {
    source.confirmed(submission, receipt);
    update({ status: editStatus() });
    confirmGesture(submission.gesture);
    void refresh();
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
    for (const retained of snapshot.recovery) {
      if (!confirmedGestures.has(retained.draft.id)) continue;
      if (snapshot.stamp.revision <= retained.draft.base.revision) continue;
      session.dispatch({ kind: 'confirmed', id: retained.draft.id });
      confirmedGestures.delete(retained.draft.id);
    }
  }
  /** A response racing a newer snapshot is discarded; old rendered data never gains new write preconditions. */
  function matchingSnapshot(document: RenderDocument): WorkspaceView['snapshot'] {
    const current = state.collections.find((item) => item.id === document.collection.id);
    if (current?.revision === document.collection.revision) return state.snapshot;
    void refresh();
    return null;
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
  /** Captured Model changes share request assembly; their feature decides the semantic change list. */
  async function applyChanges(
    draft: Pick<ObjectDraft, 'base' | 'collection' | 'generation'>,
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
  /** Library commands use the same durable request journal and captured catalog versions as diagram editing. */
  async function applyLibrary(
    base: import('../contract/records/owners.js').Snapshot,
    changes: readonly import('@novakai/canvas-library').CatalogChange[],
  ): Promise<Result<Receipt>> {
    const request = bindings.inputs.library(base, changes, bindings.nextId());
    if (!request.ok) return request;
    return submit(request.value, state.generation, state.sourceEdit, null);
  }
  /** Returning to discovery retains source and inspector drafts but disposes the old viewing session. */
  function showLibrary(): void {
    renderJob?.abort();
    rendering = null;
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
  async function start(): Promise<void> {
    await refresh();
    restoreEdits();
    await restoreLocation();
    unsubscribe = bindings.client.changes(() => {
      // The local receipt refresh includes every commit made while its submission was in flight.
      if (!state.busy) void refresh();
    }, connection);
    if (!state.sourceDirty) update({ status: 'Ready' });
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
    source.restore(state.snapshot.workspace);
    inspector.restore(state.snapshot.workspace);
    wires.restore(state.snapshot.workspace);
  }
  /** Human-triggered reconciliation is read-only and makes missing confirmation explicit. */
  async function reconcileRequest(id: string): Promise<void> {
    const result = await submissions.reconcile(id);
    if (!result.ok) {
      report(result.error);
      return;
    }
    if (result.value === null)
      update({ status: 'No receipt found — retry remains an explicit action' });
  }
  /** Retry retains the exact request body while using the current authenticated transport session. */
  async function retryRequest(id: string): Promise<void> {
    const result = await submissions.retry(id, state.generation);
    if (!result.ok) report(result.error);
  }
  return {
    inspector,
    wires,
    library,
    showLibrary,
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
    dismissRequest: (id) => {
      const result = submissions.dismiss(id);
      if (!result.ok) report(result.error);
    },
    retryRequest,
    create,
    report,
    dispose: () => {
      unsubscribe();
      renderJob?.abort();
      snapshotRead += 1;
      state.active?.session.dispose();
      listeners.clear();
    },
  };
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
