import type { ReactElement } from 'react';
import type {
  DrawingSlots,
  MarkerDrawing,
  RoutedWire,
  Paint,
} from '../../contract/render-types.js';
type Point = RoutedWire['points'][number];
/** Point halfway along the route, measured by length. */
function midpoint(points: readonly Point[]): Point {
  const lengths = points.slice(1).map((point, index) => {
    const prior = points[index] ?? point;
    return Math.hypot(point.x - prior.x, point.y - prior.y);
  });
  let left = lengths.reduce((total, length) => total + length, 0) / 2;
  const index = lengths.findIndex((length) => (left -= length) <= 0);
  const start = points[index];
  const end = points[index + 1];
  if (!start || !end) return points[0] ?? { x: 0, y: 0 };
  const ratio = 1 + left / Math.max(lengths[index] ?? 0, Number.EPSILON);
  return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
}
/** Hidden labels sit centred on the route midpoint when the host asks for all labels. */
function hiddenLabelPoint(item: RoutedWire): Point {
  const centre = midpoint(item.points);
  return {
    x: centre.x - item.measuredLabel.width / 2,
    y: centre.y - item.measuredLabel.height / 2,
  };
}
/** Labelled wires use the admitted route path, attachment tangent and shared marker renderer. */
export function createWireDrawing(
  label: DrawingSlots['label'],
  Marker: MarkerDrawing,
  allLabels = false,
): (wire: RoutedWire, paint: Paint) => ReactElement {
  /** Export adds no interactive hit targets, routing corrections or unlabelled inferred wires. */
  function wire(item: RoutedWire): ReactElement {
    const paint = item.appearance.paint;
    const dash = item.style === 'dashed' ? item.appearance.dash.join(' ') : undefined;
    return (
      <g key={item.id} data-wire={item.id}>
        <path
          d={item.path}
          fill="none"
          stroke={paint.stroke}
          strokeWidth={item.appearance.width}
          strokeDasharray={dash}
        />
        {item.labelVisible !== false && label(item.measuredLabel, item.labelBox)}
        {item.labelVisible === false &&
          allLabels &&
          label(item.measuredLabel, hiddenLabelPoint(item))}
        <Marker kind={item.sourceMarker} points={item.points} at="source" paint={paint} />
        <Marker kind={item.targetMarker} points={item.points} at="target" paint={paint} />
      </g>
    );
  }
  return wire;
}
