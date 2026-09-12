import type { ReactElement } from 'react';
import type {
  DrawingSlots,
  MarkerDrawing,
  SequenceGeometry,
  Paint,
} from '../../contract/render-types.js';
type Event = SequenceGeometry['events'][number];
type Frame = SequenceGeometry['fragments'][number];
/** Sequence geometry stays Layout-owned; only static SVG composition is performed here. */
export function createSequenceDrawing(
  label: DrawingSlots['label'],
  Marker: MarkerDrawing,
): (geometry: SequenceGeometry, paint: Paint) => ReactElement {
  /** Message labels and arrowheads retain their measured semantic presentation. */
  function message(event: Event, paint: Paint): ReactElement {
    const dash = event.message === 'return' ? '6 4' : undefined;
    return (
      <g key={event.id} data-sequence-event={event.id}>
        <polyline
          points={event.points.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
          strokeDasharray={dash}
        />
        {label(event.content, event.labelBox)}
        <Marker kind={event.marker} points={event.points} at="target" paint={paint} />
      </g>
    );
  }
  /** Branch separators are supplied rectangles, not independently inferred execution semantics. */
  function frame(item: Frame): ReactElement {
    return (
      <g key={item.id}>
        <rect {...item.box} fill="none" />
        {label(item.content, item.labelBox)}
        {item.branches.map((branch) => (
          <g key={branch.id}>
            <line
              x1={branch.box.x}
              y1={branch.box.y}
              x2={branch.box.x + branch.box.width}
              y2={branch.box.y}
            />
            {label(branch.content, branch.labelBox)}
          </g>
        ))}
      </g>
    );
  }
  /** All annotations share their section coordinate frame with participant nodes. */
  function sequence(geometry: SequenceGeometry, paint: Paint): ReactElement {
    return (
      <g stroke={paint.stroke} data-layer="sequence">
        {geometry.lifelines.map((line) => (
          <line
            key={line.participant}
            x1={line.from.x}
            y1={line.from.y}
            x2={line.to.x}
            y2={line.to.y}
            strokeDasharray="6 4"
          />
        ))}
        {geometry.activations.map((item) => (
          <rect key={`${item.participant}:${item.fromEvent}`} {...item.box} fill={paint.fill} />
        ))}
        {geometry.fragments.map(frame)}
        {geometry.events.map((event) => message(event, paint))}
      </g>
    );
  }
  return sequence;
}
