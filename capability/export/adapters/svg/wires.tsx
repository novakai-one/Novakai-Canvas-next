import type { ReactElement } from 'react';
import type {
  DrawingSlots,
  MarkerDrawing,
  RoutedWire,
  Paint,
} from '../../contract/render-types.js';
/** Labelled wires use the admitted route path, attachment tangent and shared marker renderer. */
export function createWireDrawing(
  label: DrawingSlots['label'],
  Marker: MarkerDrawing,
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
        <Marker kind={item.sourceMarker} points={item.points} at="source" paint={paint} />
        <Marker kind={item.targetMarker} points={item.points} at="target" paint={paint} />
      </g>
    );
  }
  return wire;
}
