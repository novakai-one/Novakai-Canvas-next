import { memo } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { SceneEdgeProps, RenderSlots, RouteHandlesProps } from '../../contract/react-types.js';
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
/** Binding keeps measured labels/notation outside Canvas policy; host owns content admission and render recovery. */
export function createSceneEdge(
  slots: Pick<RenderSlots, 'MeasuredContent' | 'Marker'> & {
    readonly RouteHandles: ComponentType<RouteHandlesProps>;
  },
): ComponentType<SceneEdgeProps> {
  const Content = slots.MeasuredContent;
  const Marker = slots.Marker;
  const Handles = slots.RouteHandles;
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
    return (
      <g
        className={styles.edge}
        transform={`translate(${view.origin.x} ${view.origin.y})`}
        data-preview={view.draft}
      >
        <path className={styles.hit} d={path} />
        <path
          className={styles.wire}
          d={path}
          stroke={paint.stroke}
          strokeWidth={wire.appearance.width}
          strokeDasharray={wireDash(wire)}
          data-selected={view.selected}
          data-style={wire.style}
        />
        {wire.labelVisible !== false && (
          <g transform={`translate(${wire.labelBox.x} ${wire.labelBox.y})`}>
            <Content embedFonts={false} content={wire.measuredLabel} />
          </g>
        )}
        <g transform={endpointTransform(first, second)}>
          <Marker kind={wire.sourceMarker} paint={paint} />
        </g>
        <g transform={endpointTransform(last, penultimate)}>
          <Marker kind={wire.targetMarker} paint={paint} />
        </g>
        {view.selected && (
          <Handles edge={view} actions={actions} editable={editable} nudge={data.nudge} />
        )}
      </g>
    );
  }
  return memo(SceneEdge);
}
