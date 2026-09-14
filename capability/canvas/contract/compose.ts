import type { RenderSlots, ReactBindings } from './react-types.js';
import type { Result } from './errors.js';
import { protectAsync } from '../core/validation/outcomes.js';
import type { Canvas, Dependencies } from './types.js';
import type { SessionState } from './records/state.js';
import type { SessionStore } from './ports/session.js';
import { createCanvas } from './api.js';
import { createStore } from '../adapters/session/store.js';
/** Embedded/headless composition needs only scene admission; host owns effects, display and recovery. */
export function composeCanvas(dependencies: Dependencies): Canvas {
  return createCanvas(dependencies);
}
/** Bind live session storage once; pure Canvas API remains available without a subscription adapter. */
export function createSession(
  canvas: Pick<Canvas, 'transition'>,
  state: SessionState,
): SessionStore {
  return createStore(canvas, state);
}

/** Explicit browser composition loads styles and stable view slots; host keeps previous bindings on failure. */
export function createReactBindings(slots: RenderSlots): Promise<Result<ReactBindings>> {
  return protectAsync(async () => {
    await import('../adapters/react-flow/style-entry.js');
    const [
      surface,
      node,
      edge,
      section,
      controls,
      outline,
      sequence,
      route,
      scene,
      interactions,
      records,
      icons,
    ] = await Promise.all([
      import('../adapters/react-flow/CanvasSurface.js'),
      import('../adapters/react-flow/SceneNode.js'),
      import('../adapters/react-flow/SceneEdge.js'),
      import('../adapters/react-flow/SectionFrame.js'),
      import('../adapters/react-flow/CanvasControls.js'),
      import('../adapters/react-flow/DiagramOutline.js'),
      import('../adapters/react-flow/SequenceLayer.js'),
      import('../adapters/react-flow/RouteHandles.js'),
      import('../adapters/react-flow/use-scene.js'),
      import('../adapters/react-flow/interaction-handlers.js'),
      import('../adapters/react-flow/flow-records.js'),
      import('../adapters/react-flow/ControlIcon.js'),
    ]);
    const CanvasSurface = surface.createCanvasSurface({
      FontDefinitions: slots.FontDefinitions,
      createGraphSelector: records.createGraphSelector,
      useScene: scene.useScene,
      createInteractions: (owners) =>
        interactions.createInteractions({ ...owners, input: { ownsNativeInput, focusedId } }),
      observeSize,
      SceneNode: node.createSceneNode(slots),
      SceneEdge: edge.createSceneEdge({ ...slots, RouteHandles: route.RouteHandles }),
      SectionFrame: section.createSectionFrame(slots),
      CanvasControls: controls.createCanvasControls({ ...slots, Icon: icons.ControlIcon }),
      DiagramOutline: outline.createDiagramOutline(slots),
      SequenceLayer: sequence.createSequenceLayer(slots),
    });
    return { CanvasSurface };
  });
}

/** Browser-native controls and modal descendants retain their own keyboard/pointer gestures. */
function ownsNativeInput(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return (
    target.closest(
      'input,textarea,select,button,a,[contenteditable="true"],dialog,[role="dialog"],[aria-modal="true"]',
    ) !== null
  );
}
/** Browser focus carries an opaque React Flow ID; scene policy resolves it through its admitted index. */
function focusedId(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  return target.closest('.react-flow__node, .react-flow__edge')?.getAttribute('data-id') ?? null;
}
/** Native observation is bound at browser composition, injectable at the surface; cleanup belongs to the React effect. */
function observeSize(
  element: HTMLDivElement | null,
  resize: (width: number, height: number) => void,
): () => void {
  if (element === null) return () => undefined;
  const observer = new ResizeObserver((entries) => {
    const size = entries[0]?.contentRect;
    if (size) resize(size.width, size.height);
  });
  observer.observe(element);
  return () => observer.disconnect();
}
