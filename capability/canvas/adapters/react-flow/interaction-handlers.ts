import type { KeyboardEvent } from 'react';
import type { NodeChange, EdgeChange, Connection } from '@xyflow/react';
import type {
  InteractionOwners,
  Interactions,
  FlowNode,
  FlowEdge,
  ViewActions,
} from '../../contract/react-types.js';
import type { Target } from '../../contract/records/selection.js';
import type { Box, Point } from '../../contract/records/camera.js';
import type { CanvasEvent } from '../../contract/events.js';
import type { PointerGesture } from '../../contract/ports/session.js';
import type { SessionState } from '../../contract/records/state.js';
/** Incoming selection change carries its scoped node/edge ID; no generated ID parsing is needed. */
function selectedTargets(
  owners: InteractionOwners,
  changes: readonly (NodeChange<FlowNode> | EdgeChange<FlowEdge>)[],
): readonly Target[] {
  const state = owners.session.getSnapshot();
  const selected = new Map(state.selection.map((target) => [targetAddress(target), target]));
  changes.forEach((change) => applySelectionChange(selected, state.index.targets, change));
  return [...selected.values()];
}
/** Apply only selection deltas; geometry dimensions/positions never become canonical React Flow JSON. */
function applySelectionChange(
  selected: Map<string, Target>,
  targets: ReturnType<InteractionOwners['session']['getSnapshot']>['index']['targets'],
  change: NodeChange<FlowNode> | EdgeChange<FlowEdge>,
): void {
  if (change.type !== 'select') return;
  const target = targets[change.id]?.target;
  if (!target) return;
  setSelected(selected, target, change.selected);
}
/** Immutable domain selection is assembled outside the temporary local Map. */
function setSelected(selected: Map<string, Target>, target: Target, enabled: boolean): void {
  if (enabled) {
    selected.set(targetAddress(target), target);
    return;
  }
  selected.delete(targetAddress(target));
}
/** Ignore delayed drag callbacks after Escape, a foreign update or gesture replacement. */
function stillActive(
  owners: InteractionOwners,
  active: PointerGesture | null,
): active is PointerGesture {
  if (active === null) return false;
  return owners.session.getSnapshot().draft?.id === active.id;
}
/** Sequence and tree sections draw from node positions outside the node itself; they keep the full per-frame path. */
function previewable(state: SessionState, targets: readonly Target[]): boolean {
  return targets.every((target) => {
    if (target.kind !== 'node') return false;
    const section = state.scene.sections.find((item) => item.id === target.section);
    return section?.tree === undefined && section?.sequence.lifelines.length === 0;
  });
}
/** True when the key or any of its ancestors is dragged. */
function under(state: SessionState, key: string | null, dragged: ReadonlySet<string>): boolean {
  if (key === null) return false;
  if (dragged.has(key)) return true;
  return under(state, state.index.targets[key]?.parentKey ?? null, dragged);
}
/** Dragged targets plus every descendant; children are separate React Flow nodes and must move too. */
function movedKeys(state: SessionState, dragged: readonly string[]): ReadonlySet<string> {
  const roots = new Set(dragged);
  return new Set(Object.keys(state.index.targets).filter((key) => under(state, key, roots)));
}
/** Translate React Flow events to public Canvas commands. Host drains effects, retains drafts and repairs reported callback failures; canceled pointer IDs never replay. */
export function createInteractions(owners: InteractionOwners): Interactions {
  const hoverSuppression = new Set<'drag' | 'pan' | 'connect'>();
  /** Keys that move with the current drag; null means the full per-frame path. */
  let moved: { readonly id: string; readonly keys: ReadonlySet<string> } | null = null;
  /** Typed failures are reported to the host; they never trigger a fallback save or guessed state change. */
  function dispatch(event: CanvasEvent): void {
    const result = owners.session.dispatch(event);
    dropStalePreview();
    if (!result.ok) {
      owners.onError(result.error);
      return;
    }
    result.value.diagnostics.forEach((diagnostic) => owners.onError(diagnostic));
  }
  /** Escape, a foreign update or drop ends the draft; the live offset goes with it. */
  function dropStalePreview(): void {
    const preview = owners.session.readPreview();
    if (preview !== null && owners.session.getSnapshot().draft?.id !== preview.id)
      owners.session.writePreview(null);
  }
  /** Release applies the last live offset once, then the usual finish. */
  function flushPreview(active: PointerGesture): void {
    const preview = owners.session.readPreview();
    if (preview?.id !== active.id) return;
    dispatch({ kind: 'move', id: active.id, delta: preview.delta });
  }
  /** Gesture suppression is adapter-local because React Flow owns pan/connect lifecycle boundaries. */
  function suppressHover(reason: 'drag' | 'pan' | 'connect'): void {
    hoverSuppression.add(reason);
    clearHover();
  }
  function resumeHover(reason: 'drag' | 'pan' | 'connect'): void {
    hoverSuppression.delete(reason);
  }
  function clearHover(): void {
    const hover = owners.session.getSnapshot().hover;
    if (hover !== null) dispatch({ kind: 'target-leave', target: hover });
  }
  function enterHover(target: Target): void {
    if (hoverSuppression.size > 0) return;
    dispatch({ kind: 'target-enter', target });
  }
  /** Initial geometry comes from the admitted view, not a possibly already-moved callback position. */
  function startDrag(event: MouseEvent | TouchEvent, node: FlowNode, nodes: FlowNode[]): void {
    if (owners.input.ownsNativeInput(event.target)) return;
    suppressHover('drag');
    const id = owners.nextGestureId();
    owners.session.writePointer({
      id,
      target: node.data.view.target,
      start: node.data.view.position,
    });
    const targets = nodes.map((item) => item.data.view.target);
    dispatch({ kind: 'begin', id, gesture: 'move', targets });
    const state = owners.session.getSnapshot();
    const live = previewable(state, targets);
    moved = live
      ? {
          id,
          keys: movedKeys(
            state,
            nodes.map((item) => item.id),
          ),
        }
      : null;
  }
  /** Frame updates carry a total delta from drag start; reducers retain original geometry for recovery. */
  function moveDrag(_event: MouseEvent | TouchEvent, node: FlowNode): void {
    const active = owners.session.readPointer();
    if (!stillActive(owners, active)) return;
    const delta = { x: node.position.x - active.start.x, y: node.position.y - active.start.y };
    livePreview(active.id, delta);
  }
  /** Previewable drags publish only the offset; others take the full per-frame path. */
  function livePreview(id: string, delta: Point): void {
    if (moved?.id === id) owners.session.writePreview({ id, delta, moved: moved.keys });
    else dispatch({ kind: 'move', id, delta });
  }
  /** Release submits exactly one coalesced intent; late duplicate stops are harmless. */
  function finishGeometry(): void {
    const active = owners.session.readPointer();
    if (!stillActive(owners, active)) {
      owners.session.writePointer(null);
      owners.session.writePreview(null);
      resumeHover('drag');
      return;
    }
    flushPreview(active);
    dispatch({ kind: 'finish', id: active.id });
    owners.session.writePointer(null);
    resumeHover('drag');
  }
  /** Pointer cancellation never emits an edit intent; only the active gesture is cleared. */
  function cancelGeometry(): void {
    const active = owners.session.readPointer();
    if (!stillActive(owners, active)) {
      owners.session.writePointer(null);
      owners.session.writePreview(null);
      resumeHover('drag');
      return;
    }
    dispatch({ kind: 'cancel', id: active.id });
    owners.session.writePointer(null);
    resumeHover('drag');
  }
  /** Resize controls operate on one target and retain the same gesture identity through their lifecycle. */
  function beginResize(target: Target): void {
    const id = owners.nextGestureId();
    owners.session.writePointer({ id, target, start: { x: 0, y: 0 } });
    dispatch({ kind: 'begin', id, gesture: 'resize', targets: [target] });
  }
  /** React Flow resize coordinates are parent-relative; add the displayed parent's world origin once. */
  function resize(target: Target, box: Box): void {
    const active = owners.session.readPointer();
    if (!stillActive(owners, active)) return;
    const state = owners.session.getSnapshot();
    const info = Object.values(state.index.targets).find(
      (item) => targetAddress(item.target) === targetAddress(target),
    );
    if (!info) return;
    const parent = state.index.targets[info.parentKey ?? ''];
    const origin = parent?.box ?? { x: 0, y: 0 };
    dispatch({
      kind: 'resize',
      id: active.id,
      box: { x: box.x + origin.x, y: box.y + origin.y, width: box.width, height: box.height },
    });
  }
  /** Selection changes are the only React Flow change records consumed; dimensions/positions remain derived. */
  function selection(changes: readonly (NodeChange<FlowNode> | EdgeChange<FlowEdge>)[]): void {
    if (!changes.some((change) => change.type === 'select')) return;
    dispatch({ kind: 'select', targets: selectedTargets(owners, changes), mode: 'replace' });
  }
  /** Connect callbacks resolve endpoint data through the admitted index and never assume a scene-ID encoding. */
  function connect(connection: Connection): void {
    const state = owners.session.getSnapshot();
    const source = state.index.targets[connection.source]?.target;
    const target = state.index.targets[connection.target]?.target;
    if (source?.kind !== 'node' || target?.kind !== 'node') return;
    const id = owners.nextGestureId();
    dispatch({
      kind: 'connect',
      id,
      endpoint: { section: source.section, node: source.id, member: connection.sourceHandle },
    });
    dispatch({
      kind: 'connect',
      id,
      endpoint: { section: target.section, node: target.id, member: connection.targetHandle },
    });
  }
  /** Canvas handles only its documented key vocabulary; global browser and text-editor shortcuts remain native. */
  function keyboard(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.defaultPrevented || owners.input.ownsNativeInput(event.target)) return;
    const handled = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Enter',
      'Delete',
      'Backspace',
      'Escape',
    ].includes(event.key);
    if (!handled) return;
    event.preventDefault();
    focusKeyboardTarget(owners, event.target, dispatch);
    dispatch({
      kind: 'keyboard',
      id: owners.nextGestureId(),
      key: event.key,
      alt: event.altKey,
      shift: event.shiftKey,
      typing: false,
      modal: false,
    });
  }
  const actions: ViewActions = {
    dispatch,
    beginResize,
    resize,
    finishGeometry,
    cancelGeometry,
    nextId: owners.nextGestureId,
    readPreview: owners.session.readPreview,
    subscribePreview: owners.session.subscribePreview,
  };
  return {
    actions,
    keyboard,
    flow: {
      onNodeDragStart: startDrag,
      onNodeDrag: moveDrag,
      onNodeDragStop: finishGeometry,
      onSelectionDragStart: (event, nodes) => {
        const first = nodes[0];
        if (first) startDrag(event.nativeEvent, first, nodes);
      },
      onSelectionDrag: (event, nodes) => {
        const first = nodes[0];
        if (first) moveDrag(event.nativeEvent, first);
      },
      onSelectionDragStop: finishGeometry,
      onNodeClick: () => undefined,
      onNodeDoubleClick: (event, node) => {
        if (!owners.input.ownsNativeInput(event.target))
          dispatch({ kind: 'inspect', target: node.data.view.target });
      },
      onNodeMouseEnter: (_event, node) => enterHover(node.data.view.target),
      onNodeMouseLeave: (_event, node) =>
        dispatch({ kind: 'target-leave', target: node.data.view.target }),
      onEdgeClick: () => undefined,
      onEdgeDoubleClick: (_event, edge) => {
        if (edge.data) dispatch({ kind: 'inspect', target: edge.data.view.target });
      },
      onEdgeMouseEnter: (_event, edge) => {
        if (edge.data) enterHover(edge.data.view.target);
      },
      onEdgeMouseLeave: (_event, edge) => {
        if (edge.data) dispatch({ kind: 'target-leave', target: edge.data.view.target });
      },
      onPaneClick: () => dispatch({ kind: 'select', targets: [], mode: 'replace' }),
      onPaneMouseLeave: clearHover,
      onNodesChange: selection,
      onEdgesChange: selection,
      onViewportChange: (viewport) =>
        dispatch({
          kind: 'viewport',
          camera: { ...owners.session.getSnapshot().camera, ...viewport },
        }),
      onMoveStart: (event) => {
        if (event) suppressHover('pan');
      },
      onMoveEnd: () => resumeHover('pan'),
      onConnect: connect,
      onConnectStart: () => suppressHover('connect'),
      onConnectEnd: () => resumeHover('connect'),
    },
  };
}
/** Keyboard commands follow the focused diagram item; an already-selected item preserves its multi-selection. */
function focusKeyboardTarget(
  owners: InteractionOwners,
  element: EventTarget | null,
  dispatch: (event: CanvasEvent) => void,
): void {
  const state = owners.session.getSnapshot();
  const target = keyboardTarget(state, owners.input.focusedId(element));
  if (!target) return;
  const selected = state.selection.some((item) => targetAddress(item) === targetAddress(target));
  if (selected) return;
  dispatch({ kind: 'select', targets: [target], mode: 'replace' });
}

/** Resolve browser focus against the admitted index; controls outside graph items have no implicit target. */
function keyboardTarget(
  state: ReturnType<InteractionOwners['session']['getSnapshot']>,
  id: string | null,
): Target | undefined {
  if (!id) return undefined;
  return state.index.targets[id]?.target;
}

/** Opaque structural target identity is shared by adapter comparisons; no generated ID encoding is parsed. */
function targetAddress(target: Target): string {
  return JSON.stringify(target);
}
