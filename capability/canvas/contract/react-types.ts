import type {
  ComponentType,
  ReactElement,
  ReactNode,
  KeyboardEvent,
  MouseEventHandler,
} from 'react';
import type { Node, Edge, NodeProps, EdgeProps, ReactFlowProps } from '@xyflow/react';
import type {
  NodeContentProps,
  MeasuredContentProps,
  MarkerProps,
  Paint,
} from '@novakai/canvas-presentation';
import type { Canvas } from './types.js';
import type { SessionStore } from './ports/session.js';
import type { SessionState } from './records/state.js';
import type {
  CanvasView,
  ViewNode,
  ViewSection,
  ViewWire,
  OutlineSection,
} from './records/view.js';
import type { CanvasEvent } from './events.js';
import type { Target } from './records/selection.js';
import type { Point, Box } from './records/camera.js';
import type { Emphasis } from './records/focus.js';
import type { Diagnostic, Result } from './errors.js';
export type SurfaceSession = Pick<
  SessionStore,
  'getSnapshot' | 'subscribe' | 'dispatch' | 'readPointer' | 'writePointer'
>;
export type ViewReader = Pick<Canvas, 'present' | 'describeAccessibility'>;
export interface ButtonProps {
  readonly label: string;
  readonly title?: string | undefined;
  readonly icon?: ReactNode;
  readonly iconOnly?: boolean;
  readonly onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
  readonly disabled?: boolean | undefined;
  readonly selected?: boolean;
}
export type ControlIconName = 'select' | 'hand' | 'connect' | 'minus' | 'plus' | 'outline';
export interface ControlIconProps {
  readonly name: ControlIconName;
}
/** Required stable renderer slots keep diagram notation and design-system button policy out of Canvas. */
export interface RenderSlots {
  readonly FontDefinitions: ComponentType;
  readonly NodeContent: ComponentType<NodeContentProps>;
  readonly MeasuredContent: ComponentType<MeasuredContentProps>;
  readonly Marker: ComponentType<MarkerProps>;
  readonly Button: ComponentType<ButtonProps>;
}
export interface WireLabelProps {
  readonly wire: ViewWire['wire'];
  readonly zoom: number;
  readonly anchor: Point;
}
export interface SurfaceProps {
  readonly session: SurfaceSession;
  readonly reader: ViewReader;
  readonly nextGestureId: () => string;
  readonly onError: (diagnostic: Diagnostic) => void;
  readonly paint: Paint;
  readonly label: string;
}
export interface ViewSnapshot {
  readonly state: SessionState;
  readonly view: CanvasView;
  readonly outline: readonly OutlineSection[];
}
export type UseScene = (session: SurfaceSession, reader: ViewReader) => Result<ViewSnapshot>;
/** View actions translate user gestures to typed events only; host drains/submits effects outside rendering. */
export interface ViewActions {
  dispatch(event: CanvasEvent): void;
  beginResize(target: Target): void;
  resize(target: Target, box: Box): void;
  finishGeometry(): void;
  cancelGeometry(): void;
  nextId(): string;
}
export interface NodeData extends Record<string, unknown> {
  readonly view: ViewNode;
  readonly actions: Pick<ViewActions, 'beginResize' | 'resize' | 'finishGeometry'>;
  readonly editable: boolean;
}
export interface SectionData extends Record<string, unknown> {
  readonly view: ViewSection;
  readonly paint: Paint;
}
export interface EdgeData extends Record<string, unknown> {
  readonly view: ViewWire;
  readonly actions: Pick<ViewActions, 'dispatch' | 'nextId'>;
  readonly editable: boolean;
  readonly paint: Paint;
  readonly nudge: number;
  readonly zoom: number;
}
export type FlowNode = Node<NodeData, 'scene'> | Node<SectionData, 'section'>;
export type FlowEdge = Edge<EdgeData, 'scene'>;
export type SceneNodeProps = NodeProps<Node<NodeData, 'scene'>>;
export type SectionFrameProps = NodeProps<Node<SectionData, 'section'>>;
export type SceneEdgeProps = EdgeProps<FlowEdge> & {
  readonly type: 'scene';
  readonly data: EdgeData;
};
export interface ControlsProps {
  readonly snapshot: ViewSnapshot;
  readonly actions: Pick<ViewActions, 'dispatch'>;
  readonly outlineOpen: boolean;
  readonly onOutline: () => void;
}
export interface OutlineProps {
  readonly sections: readonly OutlineSection[];
  readonly actions: Pick<ViewActions, 'dispatch' | 'nextId'>;
  readonly editable: boolean;
}
export interface SequenceProps {
  readonly sections: readonly ViewSection[];
  readonly nodes: readonly ViewNode[];
  readonly actions: Pick<ViewActions, 'dispatch'>;
  readonly paint: Paint;
}
export interface RouteHandlesProps {
  readonly edge: ViewWire;
  readonly actions: Pick<ViewActions, 'dispatch' | 'nextId'>;
  readonly editable: boolean;
  readonly nudge: number;
  readonly controlPosition: Point;
}
export interface Interactions {
  readonly actions: ViewActions;
  readonly flow: Pick<
    ReactFlowProps<FlowNode, FlowEdge>,
    | 'onNodeDragStart'
    | 'onNodeDrag'
    | 'onNodeDragStop'
    | 'onSelectionDragStart'
    | 'onSelectionDrag'
    | 'onSelectionDragStop'
    | 'onNodeClick'
    | 'onNodeDoubleClick'
    | 'onNodeMouseEnter'
    | 'onNodeMouseLeave'
    | 'onEdgeClick'
    | 'onEdgeDoubleClick'
    | 'onEdgeMouseEnter'
    | 'onEdgeMouseLeave'
    | 'onPaneClick'
    | 'onNodesChange'
    | 'onEdgesChange'
    | 'onViewportChange'
    | 'onMoveStart'
    | 'onMoveEnd'
    | 'onConnect'
    | 'onConnectStart'
    | 'onConnectEnd'
    | 'onPaneMouseLeave'
  >;
  keyboard(event: KeyboardEvent<HTMLDivElement>): void;
}
export interface InteractionOwners {
  readonly session: Pick<SessionStore, 'getSnapshot' | 'dispatch' | 'readPointer' | 'writePointer'>;
  readonly input: BrowserInput;
  readonly nextGestureId: () => string;
  readonly onError: (diagnostic: Diagnostic) => void;
}
export interface BrowserInput {
  ownsNativeInput(target: EventTarget | null): boolean;
  focusedId(target: EventTarget | null): string | null;
}
export type CreateInteractions = (owners: Omit<InteractionOwners, 'input'>) => Interactions;
export type GraphSelector = (
  result: Result<ViewSnapshot>,
  actions: ViewActions,
  paint: Paint,
) => { nodes: FlowNode[]; edges: FlowEdge[] };
export interface SurfaceSlots {
  readonly FontDefinitions: ComponentType;
  readonly createGraphSelector: () => GraphSelector;
  readonly useScene: UseScene;
  readonly createInteractions: CreateInteractions;
  readonly observeSize: (
    element: HTMLDivElement | null,
    resize: (width: number, height: number) => void,
  ) => () => void;
  readonly SceneNode: ComponentType<SceneNodeProps>;
  readonly SceneEdge: ComponentType<SceneEdgeProps>;
  readonly SectionFrame: ComponentType<SectionFrameProps>;
  readonly CanvasControls: ComponentType<ControlsProps>;
  readonly DiagramOutline: ComponentType<OutlineProps>;
  readonly SequenceLayer: ComponentType<SequenceProps>;
}
export interface ReactBindings {
  readonly CanvasSurface: ComponentType<SurfaceProps>;
}
export type CanvasElement = (props: SurfaceProps) => ReactElement;
export type ScreenPoint = Point;
export type ViewEmphasis = Emphasis;
