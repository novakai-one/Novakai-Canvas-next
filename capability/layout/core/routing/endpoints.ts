import type { PlacedNode, Point, ResolvedEndpoint, Side } from '../../contract/records/geometry.js';
import type { VisualWire } from '../../contract/records/input.js';
import { center } from '../geometry/bounds.js';
import { reject } from '../validation/outcomes.js';
export interface Attachments {
  readonly source: ResolvedEndpoint;
  readonly target: ResolvedEndpoint;
}
/** Resolve the physical visible node; callers never substitute an absent member/object. */
export function visible(id: string, nodes: readonly PlacedNode[]): PlacedNode {
  const found = nodes.find((node) => node.id === id);
  if (!found) return reject('invalid-input', id, 'Wire attachment node is not visible');
  return found;
}
/** Automatic sides follow centre separation, with a stable horizontal tie break. */
function facing(source: PlacedNode, target: PlacedNode): Side {
  const a = center(source.box);
  const b = center(target.box);
  if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) return horizontalSide(a.x, b.x);
  return verticalSide(a.y, b.y);
}
/** Positive horizontal separation exits on the right; ties use the same stable side. */
function horizontalSide(from: number, to: number): Side {
  return to >= from ? 'right' : 'left';
}
/** Positive vertical separation exits below the source. */
function verticalSide(from: number, to: number): Side {
  return to >= from ? 'bottom' : 'top';
}
/** Named sides are hard intent; row members default to a lateral attachment at the measured row. */
function chooseSide(
  requested: VisualWire['route']['sourceSide'],
  member: string | null,
  source: PlacedNode,
  target: PlacedNode,
): Side {
  if (requested !== 'auto') return requested;
  return automaticSide(member, source, target);
}
/** A table/interface member must connect at its row height, not the centre of the object. */
function automaticSide(member: string | null, source: PlacedNode, target: PlacedNode): Side {
  if (member === null) return facing(source, target);
  return center(target.box).x >= center(source.box).x ? 'right' : 'left';
}
/** Orthogonal attachment points lie on the chosen box edge. */
function edge(node: PlacedNode, side: Side): Point {
  const box = node.box;
  const middle = center(box);
  const points = {
    top: { x: middle.x, y: box.y },
    bottom: { x: middle.x, y: box.y + box.height },
    left: { x: box.x, y: middle.y },
    right: { x: box.x + box.width, y: middle.y },
  };
  return points[side];
}
/** Measured member coordinates are node-local and cannot be approximated by row indices. */
function attachment(node: PlacedNode, member: string | null, side: Side): Point {
  if (member === null) return edge(node, side);
  return memberPoint(node, member, side);
}
/** Vertical member-side requests have no row-edge interpretation and are rejected with the member identity. */
function memberPoint(node: PlacedNode, member: string, side: Side): Point {
  if (side === 'top' || side === 'bottom')
    return reject('constraint-conflict', member, 'Member ports require a left or right side', [
      node.id,
      member,
    ]);
  const anchor = node.measured.content.anchors.find((item) => item.member === member);
  if (!anchor)
    return reject('invalid-input', member, 'Measured member anchor is missing', [node.id, member]);
  return { ...edge(node, side), y: node.box.y + anchor.y };
}
/** Resolve both ends before invoking native routing; automatic self-loops leave on different sides. */
export function endpoints(wire: VisualWire, nodes: readonly PlacedNode[]): Attachments {
  const source = visible(wire.source.node, nodes);
  const target = visible(wire.target.node, nodes);
  const sourceSide = chooseSide(wire.route.sourceSide, wire.source.member, source, target);
  const targetSide = selfTarget(wire, source, target);
  return {
    source: {
      ...wire.source,
      side: sourceSide,
      point: attachment(source, wire.source.member, sourceSide),
    },
    target: {
      ...wire.target,
      side: targetSide,
      point: attachment(target, wire.target.member, targetSide),
    },
  };
}
/** A whole-object self-loop's automatic target uses its bottom; explicit sides remain unchanged. */
function selfTarget(wire: VisualWire, source: PlacedNode, target: PlacedNode): Side {
  if (
    wire.source.node === wire.target.node &&
    wire.route.targetSide === 'auto' &&
    wire.target.member === null
  )
    return 'bottom';
  return chooseSide(wire.route.targetSide, wire.target.member, target, source);
}
/** Native checkpoints enforce departure/arrival direction despite the wrapper lacking directed ConnEnd constructors. */
export function approach(endpoint: ResolvedEndpoint, distance: number): Point {
  const vectors = {
    top: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  };
  const vector = vectors[endpoint.side];
  return { x: endpoint.point.x + vector.x * distance, y: endpoint.point.y + vector.y * distance };
}
