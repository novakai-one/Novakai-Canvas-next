import type { SessionState } from '../../contract/records/state.js';
import type { ViewWire } from '../../contract/records/view.js';
import type { PlacedSection, RoutedWire } from '../../contract/records/scene.js';
import type { Point } from '../../contract/records/camera.js';
import { targetInfo, targetKey } from './address.js';
import { previewBox, previewOrigin, hiddenByReading } from './preview.js';
/** Endpoint deltas exclude section translation, because that is applied once by the wire's origin. */
function nodeDelta(
  state: SessionState,
  section: PlacedSection,
  id: string,
  sectionDelta: Point,
): Point {
  const info = targetInfo(state.index, { kind: 'node', section: section.id, id });
  const preview = previewBox(state, info);
  return { x: preview.x - info.box.x - sectionDelta.x, y: preview.y - info.box.y - sectionDelta.y };
}
/** Temporary endpoint stretch is explicitly preview-only; Layout must produce the next feasible route. */
function endpointPoints(points: readonly Point[], source: Point, target: Point): readonly Point[] {
  const translated = points.map((point) => ({ ...point }));
  const first = points[0];
  const last = points.at(-1);
  if (first) translated[0] = { x: first.x + source.x, y: first.y + source.y };
  if (last) translated[translated.length - 1] = { x: last.x + target.x, y: last.y + target.y };
  return translated;
}
/** When both endpoints move together, translate the complete route and label, preserving their shape. */
function movedWire(wire: RoutedWire, source: Point, target: Point): RoutedWire {
  const same = source.x === target.x && source.y === target.y;
  if (!same) return { ...wire, points: endpointPoints(wire.points, source, target) };
  return {
    ...wire,
    points: wire.points.map((point) => ({ x: point.x + source.x, y: point.y + source.y })),
    labelBox: { ...wire.labelBox, x: wire.labelBox.x + source.x, y: wire.labelBox.y + source.y },
  };
}
/** Active route handles supply a draft path; other wires preserve their admitted route unless an endpoint moves. */
function projectedWire(
  state: SessionState,
  wire: RoutedWire,
  key: string,
  section: string,
  source: Point,
  target: Point,
): RoutedWire {
  if (isRouteTarget(state, key)) return { ...wire, points: routePoints(state, wire.points) };
  const preview =
    state.draft === null
      ? state.routePreview?.wires.find((item) => item.section === section && item.id === wire.id)
      : undefined;
  if (preview !== undefined)
    return {
      ...wire,
      source: preview.source,
      target: preview.target,
      points: preview.points,
      labelBox: preview.labelBox,
    };
  const unchanged = [source.x, source.y, target.x, target.y].every((delta) => delta === 0);
  if (unchanged) return wire;
  return movedWire(wire, source, target);
}
/** Wire view reuses labels/markers and marks endpoint-stretched paths as previews, never feasible committed geometry. */
export function viewWire(state: SessionState, wire: RoutedWire, section: PlacedSection): ViewWire {
  const target = { kind: 'wire' as const, section: section.id, id: wire.id };
  const key = targetKey(target);
  const sectionInfo = targetInfo(state.index, { kind: 'section', id: section.id });
  const sectionBox = previewBox(state, sectionInfo);
  const delta = { x: sectionBox.x - sectionInfo.box.x, y: sectionBox.y - sectionInfo.box.y };
  const sourceInfo = targetInfo(state.index, {
    kind: 'node',
    section: section.id,
    id: wire.source.node,
  });
  const targetData = targetInfo(state.index, {
    kind: 'node',
    section: section.id,
    id: wire.target.node,
  });
  const projected = projectedWire(
    state,
    wire,
    key,
    section.id,
    nodeDelta(state, section, wire.source.node, delta),
    nodeDelta(state, section, wire.target.node, delta),
  );
  return {
    id: key,
    target,
    sourceId: sourceInfo.key,
    targetId: targetData.key,
    wire: projected,
    origin: previewOrigin(state, section.id) ?? {
      x: section.origin.x + delta.x,
      y: section.origin.y + delta.y,
    },
    selected: state.selection.some((value) => targetKey(value) === key),
    hidden: hiddenByReading(state, sourceInfo) || hiddenByReading(state, targetData),
    draft: projected !== wire,
  };
}

/** Narrow active route identity before choosing its section-local preview. */
function isRouteTarget(state: SessionState, key: string): boolean {
  if (state.draft?.kind !== 'route') return false;
  return targetKey(state.draft.target) === key;
}
/** Safe fallback is the admitted path; narrowing never casts another gesture into a route. */
function routePoints(state: SessionState, fallback: readonly Point[]): readonly Point[] {
  if (state.draft?.kind !== 'route') return fallback;
  return state.draft.current.points;
}
