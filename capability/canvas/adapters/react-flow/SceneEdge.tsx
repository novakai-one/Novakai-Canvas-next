import { memo } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type {
  SceneEdgeProps,
  RenderSlots,
  RouteHandlesProps,
  WireLabelProps,
} from '../../contract/react-types.js';
import type { RoutedWire } from '../../contract/records/scene.js';
import type { Point } from '../../contract/records/camera.js';
import styles from './SceneEdge.module.css';
/** Preview routes may be endpoint-stretched; admitted routes retain the native routing path exactly. */
function wirePath(points: readonly Point[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');
}
/** Marker local +x faces toward its endpoint; source and target have opposite route tangents. */
function endpointTransform(point: Point, neighbor: Point): string {
  const angle = (Math.atan2(point.y - neighbor.y, point.x - neighbor.x) * 180) / Math.PI;
  return `translate(${point.x} ${point.y}) rotate(${angle}) translate(-26 -8)`;
}
/** Dashed routes use the measured theme pattern; solid routes have no dash attribute. */
function wireDash(wire: RoutedWire): string | undefined {
  if (wire.style === 'dashed') return wire.appearance.dash.join(' ');
  return undefined;
}
/** Arc midpoint follows cumulative route length rather than the label's obsolete layout reservation. */
function pathMidpoint(points: readonly Point[]): Point {
  const lengths = points.slice(1).map((point, index) => {
    const prior = points[index] ?? point;
    return Math.hypot(point.x - prior.x, point.y - prior.y);
  });
  const halfway = lengths.reduce((total, length) => total + length, 0) / 2;
  let travelled = 0;
  const index = lengths.findIndex((length) => {
    travelled += length;
    return travelled >= halfway;
  });
  const end = points[index + 1];
  const start = points[index];
  if (!start || !end) return points[0] ?? { x: 0, y: 0 };
  const length = lengths[index] ?? 0;
  const ratio = (halfway - (travelled - length)) / Math.max(length, Number.EPSILON);
  return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
}
/** Binding keeps measured labels/notation outside Canvas policy; host owns content admission and render recovery. */
export function createSceneEdge(
  slots: Pick<RenderSlots, 'MeasuredContent' | 'Marker'> & {
    readonly RouteHandles: ComponentType<RouteHandlesProps>;
    readonly WireLabel: ComponentType<WireLabelProps>;
  },
): ComponentType<SceneEdgeProps> {
  const Marker = slots.Marker;
  const Content = slots.MeasuredContent;
  const Handles = slots.RouteHandles;
  const Label = slots.WireLabel;
  /** Render actual React Flow edge paths with independently positioned measured labels and complete crow's-foot notation. */
  function SceneEdge({ data }: SceneEdgeProps): ReactElement | null {
    if (!data) return null;
    return renderEdge(data);
  }
  /** Admitted routes always have two points; missing geometry stays visibly absent rather than inventing a wire. */
  function renderEdge(data: NonNullable<SceneEdgeProps['data']>): ReactElement | null {
    const { view, actions, editable } = data;
    const wire = view.wire;
    const paint = wire.appearance.paint;
    const first = wire.points[0];
    const second = wire.points[1];
    const last = wire.points.at(-1);
    const penultimate = wire.points.at(-2);
    if (!first || !second || !last || !penultimate) return null;
    const path = view.draft ? wirePath(wire.points) : wire.path;
    const labelAnchor = pathMidpoint(wire.points);
    const label = wire.measuredLabel;
    const labelBottom = labelAnchor.y + label.height / (2 * data.zoom);
    const controlPosition = {
      x: labelAnchor.x - label.width / (2 * data.zoom),
      y: labelBottom + label.height / data.zoom,
    };
    /** Living traces: flow direction gradient spans the actual route endpoints; pulse rides active paths only. */
    const flowId = `nv-flow-${wire.id}`;
    const energized =
      view.hovered === true || view.emphasis === 'primary' || view.emphasis === 'secondary';
    const flowStroke =
      first.x === last.x && first.y === last.y ? paint.stroke : `url(#${flowId}) ${paint.stroke}`;
    /** Selected wires pour light toward their target: accent gathers at the far end. */
    const primaryStroke =
      first.x === last.x && first.y === last.y
        ? 'var(--nv-action-accent)'
        : `url(#${flowId}-accent) var(--nv-action-accent)`;
    const stroke = view.emphasis === 'primary' ? primaryStroke : flowStroke;
    return (
      <g
        className={styles.edge}
        transform={`translate(${view.origin.x} ${view.origin.y})`}
        data-preview={view.draft}
        data-emphasis={view.emphasis}
        data-hovered={view.hovered}
      >
        <defs>
          <linearGradient
            id={flowId}
            gradientUnits="userSpaceOnUse"
            x1={first.x}
            y1={first.y}
            x2={last.x}
            y2={last.y}
          >
            <stop offset="0" style={{ stopColor: 'var(--nv-canvas-wire-flow-from)' }} />
            <stop offset="1" style={{ stopColor: 'var(--nv-canvas-wire-flow-to)' }} />
          </linearGradient>
          <linearGradient
            id={`${flowId}-accent`}
            gradientUnits="userSpaceOnUse"
            x1={first.x}
            y1={first.y}
            x2={last.x}
            y2={last.y}
          >
            <stop offset="0" style={{ stopColor: 'var(--nv-action-accent)', stopOpacity: 0.35 }} />
            <stop offset="1" style={{ stopColor: 'var(--nv-action-accent)', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path className={styles.hit} d={path} />
        <path className={styles.knockout} d={path} />
        <path
          className={styles.underlay}
          d={path}
          strokeDasharray={wireDash(wire)}
          data-emphasis={view.emphasis}
        />
        <path
          className={styles.wire}
          d={path}
          stroke={stroke}
          strokeWidth={wire.appearance.width}
          strokeDasharray={wireDash(wire)}
          data-emphasis={view.emphasis}
          data-style={wire.style}
        />
        {energized && !view.draft && (
          <path className={styles.pulse} d={path} pathLength={100} pointerEvents="none" />
        )}
        {(view.emphasis === 'primary' || view.emphasis === 'secondary') && (
          <>
            <circle
              className={styles.halo}
              cx={first.x}
              cy={first.y}
              data-emphasis={view.emphasis}
              pointerEvents="none"
            />
            <circle
              className={styles.halo}
              cx={last.x}
              cy={last.y}
              data-emphasis={view.emphasis}
              pointerEvents="none"
            />
          </>
        )}
        {wire.labelVisible !== false && (
          <g transform={`translate(${wire.labelBox.x} ${wire.labelBox.y})`}>
            <Content embedFonts={false} content={wire.measuredLabel} />
          </g>
        )}
        <g transform={endpointTransform(first, second)}>
          <g aria-hidden="true" className={styles.markerContrast} data-emphasis={view.emphasis}>
            <Marker kind={wire.sourceMarker} paint={paint} />
          </g>
          <g className={styles.marker} data-emphasis={view.emphasis}>
            <Marker kind={wire.sourceMarker} paint={paint} />
          </g>
        </g>
        <g transform={endpointTransform(last, penultimate)}>
          <g aria-hidden="true" className={styles.markerContrast} data-emphasis={view.emphasis}>
            <Marker kind={wire.targetMarker} paint={paint} />
          </g>
          <g className={styles.marker} data-emphasis={view.emphasis}>
            <Marker kind={wire.targetMarker} paint={paint} />
          </g>
        </g>
        {view.selected && (
          <Handles
            edge={view}
            actions={actions}
            editable={editable}
            nudge={data.nudge}
            controlPosition={controlPosition}
          />
        )}
        {wire.labelVisible === false && view.showLabel && (
          <Label wire={wire} zoom={data.zoom} anchor={labelAnchor} />
        )}
      </g>
    );
  }
  return memo(SceneEdge);
}
