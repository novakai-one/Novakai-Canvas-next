import type { GeometryPreview } from '@novakai/canvas-canvas';
import type { ObjectDraft } from '../contract/records/inspector.js';
import type { DiagramObject } from '../contract/records/owners.js';
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
interface RenderRequest {
  readonly token: number;
  readonly id: string;
  readonly revision: number;
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
    const installed = install(document);
    if (!installed.ok) return settleFailure(request, installed.error);
    settleSuccess(request);
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
    if (generation !== state.generation) return generationMismatch();
    return response.outcome.ok ? readRender(response.outcome.value, id) : response.outcome;
  }
  function generationMismatch(): Result<RenderDocument> {
    void refresh();
    return {
      ok: false,
      error: diagnostic(
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
  }
  /** Failed chooser attempts are recoverable and never replace the retained active diagram. */
  function settleFailure(request: RenderRequest, error: Diagnostic): void {
    if (!currentRequest(request)) return;
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
    submitFeasibleCanvas(active, intent, planned.value);
  }
  /** Reject infeasible local geometry before any Authoring submission; retain the human draft. */
  function submitFeasibleCanvas(
    active: ActiveDiagram,
    intent: EditIntent,
    changes: readonly import('../contract/records/owners.js').Change[],
  ): void {
    const start = performance.now();
    const preview = bindings.previewRoutes?.(active.document, intent, changes) ?? {
      ok: true,
      value: null,
    };
    if (!preview.ok) {
      active.session.dispatch({ kind: 'reject', id: intent.id, message: preview.error.message });
      report(preview.error);
      return;
    }
    submitCanvas(intent, changes);
    if (preview.value === null) return;
    publishPreview(active, intent, preview.value, start);
  }
  /** Measure only inspected routes accepted by the Canvas gesture currently awaiting confirmation. */
  function publishPreview(
    active: ActiveDiagram,
    intent: EditIntent,
    geometry: GeometryPreview,
    start: number,
  ): void {
    const accepted = active.session.dispatch({
      kind: 'preview-routes',
      id: intent.id,
      ...geometry,
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
    if (!result.ok) handleSubmitFailure(result.error, gesture);
    return result;
  }
  function handleSubmitFailure(error: Diagnostic, gesture: string | null): void {
    report(error);
    void refresh();
    if (gesture !== null) rejectGesture(gesture, error.message);
  }
  function rejectGesture(gesture: string, message: string): void {
    state.active?.session.dispatch({ kind: 'reject', id: gesture, message });
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
  /** Opening the chooser is a presentation intent; it never disposes the retained Canvas session. */
  function beginCollectionSwitch(): void {
    if (state.collectionSwitch.phase !== 'idle') return;
    update({ collectionSwitch: { phase: 'choosing', activeId: activeId() } });
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
    dismissRequest: (id) => {
      const result = submissions.dismiss(id);
      if (!result.ok) report(result.error);
    },
    retryRequest,
    create,
    report,
    dispose: () => {
      disposed = true;
      unsubscribe();
      invalidateRender();
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
