import { useRef } from 'react';
import type { ReactElement, PointerEvent, KeyboardEvent, ChangeEvent } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { RouteHandlesProps } from '../../contract/react-types.js';
import type { Point } from '../../contract/records/camera.js';
import type { AttachmentSide } from '../../contract/records/draft.js';
import styles from './RouteHandles.module.css';
/** Bends expose equivalent pointer/keyboard controls; typed events leave feasibility with Layout/Authoring. */
export function RouteHandles({
  edge,
  actions,
  editable,
  nudge,
  controlPosition,
}: RouteHandlesProps): ReactElement | null {
  const flow = useReactFlow();
  const active = useRef<string | null>(null);
  /** Begin a single route gesture; capture is on the handle so leaving its tiny visible dot does not lose the drag. */
  function start(event: PointerEvent<SVGCircleElement>): void {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const id = actions.nextId();
    active.current = id;
    actions.dispatch({ kind: 'begin', id, gesture: 'route', targets: [edge.target] });
  }
  /** Translate browser client coordinates into the section-local route coordinate system exactly once. */
  function move(event: PointerEvent<SVGCircleElement>, index: number): void {
    const id = active.current;
    if (id === null) return;
    const world = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const points = edge.wire.points.map((point, position) =>
      position === index ? { x: world.x - edge.origin.x, y: world.y - edge.origin.y } : point,
    );
    update(id, points);
  }
  /** One release finishes one route intent; duplicate pointer-up/lost capture callbacks see no active ID. */
  function finish(): void {
    const id = active.current;
    if (id === null) return;
    active.current = null;
    actions.dispatch({ kind: 'finish', id });
  }
  /** Cancellation restores committed geometry; no partial route is submitted. */
  function cancel(): void {
    const id = active.current;
    if (id === null) return;
    active.current = null;
    actions.dispatch({ kind: 'cancel', id });
  }
  /** Coordinate editing preserves the current displayed sides until the explicit side controls choose otherwise. */
  function update(
    id: string,
    points: readonly Point[],
    sourceSide: AttachmentSide = 'preserve',
    targetSide: AttachmentSide = 'preserve',
  ): void {
    actions.dispatch({ kind: 'route', id, points, sourceSide, targetSide, locked: 'preserve' });
  }
  /** Keyboard/form changes use the same begin-update-finish route lifecycle as pointer edits. */
  function commit(
    points: readonly Point[],
    source: AttachmentSide = 'preserve',
    target: AttachmentSide = 'preserve',
  ): void {
    const id = actions.nextId();
    actions.dispatch({ kind: 'begin', id, gesture: 'route', targets: [edge.target] });
    update(id, points, source, target);
    actions.dispatch({ kind: 'finish', id });
  }
  /** Interior points can move or be removed; endpoints remain owned by their chosen attachment sides. */
  function key(event: KeyboardEvent<SVGCircleElement>, index: number): void {
    event.stopPropagation();
    const direction: Readonly<Record<string, Point>> = {
      ArrowLeft: { x: -nudge, y: 0 },
      ArrowRight: { x: nudge, y: 0 },
      ArrowUp: { x: 0, y: -nudge },
      ArrowDown: { x: 0, y: nudge },
    };
    const delta = direction[event.key];
    if (delta) {
      event.preventDefault();
      commit(
        edge.wire.points.map((point, position) =>
          position === index ? { x: point.x + delta.x, y: point.y + delta.y } : point,
        ),
      );
      return;
    }
    deleteBend(event, index);
  }
  /** Delete is confined to the focused bend; it cannot propagate as appearance deletion. */
  function deleteBend(event: KeyboardEvent<SVGCircleElement>, index: number): void {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    event.preventDefault();
    commit(edge.wire.points.filter((_point, position) => position !== index));
  }
  /** Add a bend at the first segment midpoint; keyboard access needs no pixel-coordinate authoring. */
  function addBend(): void {
    const first = edge.wire.points[0];
    const second = edge.wire.points[1];
    if (!first || !second) return;
    commit([
      first,
      { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
      ...edge.wire.points.slice(1),
    ]);
  }
  /** Only the named finite side vocabulary is admitted from a DOM select. */
  function side(event: ChangeEvent<HTMLSelectElement>, which: 'source' | 'target'): void {
    const value = event.target.value;
    if (!isSide(value)) return;
    if (which === 'source') {
      commit(edge.wire.points, value);
      return;
    }
    commit(edge.wire.points, 'preserve', value);
  }
  if (!editable) return null;
  return (
    <g className={styles.handles}>
      {edge.wire.points.slice(1, -1).map((point, index) => (
        <circle
          key={index + 1}
          className={styles.bend}
          cx={point.x}
          cy={point.y}
          tabIndex={0}
          role="button"
          aria-label={`Route bend ${index + 1}; arrow keys move, Delete removes`}
          onPointerDown={start}
          onPointerMove={(event) => move(event, index + 1)}
          onPointerUp={finish}
          onPointerCancel={cancel}
          onLostPointerCapture={cancel}
          onKeyDown={(event) => key(event, index + 1)}
        />
      ))}
      <foreignObject x={controlPosition.x} y={controlPosition.y} className={styles.toolBox}>
        <div className={`nodrag nopan nowheel ${styles.tools}`}>
          <button type="button" onClick={addBend}>
            Add bend
          </button>
          <label>
            Source side
            <select value="preserve" onChange={(event) => side(event, 'source')}>
              {sides.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Target side
            <select value="preserve" onChange={(event) => side(event, 'target')}>
              {sides.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
      </foreignObject>
    </g>
  );
}
const sides = ['preserve', 'auto', 'top', 'right', 'bottom', 'left'] as const;
/** Literal membership narrows DOM input without an unchecked type assertion. */
function isSide(value: string): value is AttachmentSide {
  return sides.some((side) => side === value);
}
