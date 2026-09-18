import { useMemo, useRef, useEffect, useState } from 'react';
import type { ComponentType, ReactElement } from 'react';
import { ReactFlow, MiniMap, Background, BackgroundVariant } from '@xyflow/react';
import type { NodeTypes, EdgeTypes } from '@xyflow/react';
import type {
  SurfaceProps,
  SurfaceSlots,
  FlowNode,
  FlowEdge,
  ViewSnapshot,
  ViewActions,
} from '../../contract/react-types.js';
import type { Result } from '../../contract/errors.js';
import styles from './CanvasSurface.module.css';
import themeStyles from './react-flow-theme.module.css';
/** Report a rejected view from an effect, never as a render-time side effect; host retains its last committed data. */
function reportView(result: Result<ViewSnapshot>, onError: SurfaceProps['onError']): void {
  if (!result.ok) onError(result.error);
}
/** Bind stable React Flow registries once. Host retains committed state/drafts and repairs reported rendering or measurement failures before remounting. */
export function createCanvasSurface(slots: SurfaceSlots): ComponentType<SurfaceProps> {
  const nodeTypes: NodeTypes = { scene: slots.SceneNode, section: slots.SectionFrame };
  const edgeTypes: EdgeTypes = { scene: slots.SceneEdge };
  const Fonts = slots.FontDefinitions;
  const Controls = slots.CanvasControls;
  const Outline = slots.DiagramOutline;
  const Sequence = slots.SequenceLayer;
  /** Surface is controlled by Canvas session; native gestures never write React Flow data directly to storage. */
  function CanvasSurface(props: SurfaceProps): ReactElement {
    const result = slots.useScene(props.session, props.reader);
    const interactions = useMemo(
      () => slots.createInteractions(props),
      [props.session, props.nextGestureId, props.onError],
    );
    const ref = useRef<HTMLDivElement>(null);
    const [outlineOpen, setOutlineOpen] = useState(false);
    const [pointer, setPointer] = useState<'fineThreshold' | 'coarseThreshold'>('fineThreshold');
    useEffect(() => reportView(result, props.onError), [result, props.onError]);
    useEffect(
      () =>
        slots.observeSize(ref.current, (width, height) =>
          dispatchSize(interactions.actions, width, height),
        ),
      [interactions.actions],
    );
    const selectGraph = useMemo(() => slots.createGraphSelector(), []);
    const graph = useMemo(
      () => selectGraph(result, interactions.actions, props.paint),
      [selectGraph, result, interactions.actions, props.paint],
    );
    if (!result.ok) return <div role="alert">Canvas unavailable: {result.error.message}</div>;
    const snapshot = result.value;
    const hand = snapshot.view.tool === 'hand';
    return (
      <div
        ref={ref}
        className={`${styles.surface} ${themeStyles.theme}`}
        role="region"
        aria-label={props.label}
        tabIndex={0}
        onKeyDown={interactions.keyboard}
        onPointerCancel={interactions.actions.cancelGeometry}
        onPointerDownCapture={(event) => setPointer(pointerThreshold(event.pointerType))}
      >
        <Fonts />
        <ReactFlow<FlowNode, FlowEdge>
          nodes={graph.nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          viewport={snapshot.view.camera}
          {...interactions.flow}
          onError={(code, message) =>
            props.onError({
              code: 'provider-failure',
              path: `react-flow.${code}`,
              targets: [],
              message,
              recovery: 'Host retains committed data and repairs the Canvas binding.',
            })
          }
          fitView={false}
          minZoom={snapshot.state.profile.zoomMin}
          maxZoom={snapshot.state.profile.zoomMax}
          panOnScroll
          zoomOnScroll={false}
          zoomOnPinch
          zoomOnDoubleClick={false}
          panOnDrag={hand ? true : [0, 1]}
          panActivationKeyCode="Space"
          selectionOnDrag={snapshot.state.profile.blankDrag === 'marquee'}
          selectionKeyCode="Shift"
          multiSelectionKeyCode="Shift"
          deleteKeyCode={null}
          disableKeyboardA11y
          nodeDragThreshold={snapshot.state.profile[pointer]}
          nodeClickDistance={snapshot.state.profile.fineThreshold}
          onlyRenderVisibleElements
        >
          <Background variant={BackgroundVariant.Dots} />
          <MiniMap pannable zoomable ariaLabel="Collection minimap" />
          <Sequence
            sections={snapshot.view.sections}
            nodes={snapshot.view.nodes}
            actions={interactions.actions}
            paint={props.paint}
          />
        </ReactFlow>
        <Controls
          snapshot={snapshot}
          actions={interactions.actions}
          outlineOpen={outlineOpen}
          onOutline={() => setOutlineOpen((value) => !value)}
        />
        {outlineOpen && (
          <Outline
            sections={snapshot.outline}
            actions={interactions.actions}
            editable={snapshot.view.editable}
          />
        )}
      </div>
    );
  }
  return CanvasSurface;
}
/** Hidden/zero-sized elements cannot supply a valid camera viewport; wait for their next visible measurement. */
function dispatchSize(actions: Pick<ViewActions, 'dispatch'>, width: number, height: number): void {
  if (width <= 0 || height <= 0) return;
  actions.dispatch({ kind: 'resize-viewport', viewport: { width, height } });
}

/** Touch input uses the coarse threshold; mouse and pen retain precise manipulation. */
function pointerThreshold(type: string): 'coarseThreshold' | 'fineThreshold' {
  return type === 'touch' ? 'coarseThreshold' : 'fineThreshold';
}
