import type { SessionState } from '../../contract/records/state.js';
import type { DropTarget } from '../../contract/records/intent.js';
import type { TargetInfo } from '../../contract/records/scene.js';
import type { Box, Point } from '../../contract/records/camera.js';

function contains(box: Box, point: Point): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
}
function groupId(state: SessionState, info: TargetInfo): string | null {
  const id = state.index.nodes[info.key]?.measured.groupId;
  return typeof id === 'string' ? id : null;
}
function smallest(items: readonly TargetInfo[]): TargetInfo | undefined {
  return [...items].sort((a, b) => a.box.width * a.box.height - b.box.width * b.box.height)[0];
}
/** The group under the point; groups nest, so the smallest one wins. */
function groupAt(state: SessionState, point: Point): TargetInfo | undefined {
  const infos = Object.values(state.index.targets);
  return smallest(
    infos.filter((info) => groupId(state, info) !== null && contains(info.box, point)),
  );
}
function sectionAt(state: SessionState, point: Point): TargetInfo | undefined {
  const infos = Object.values(state.index.targets);
  return infos.find((info) => info.target.kind === 'section' && contains(info.box, point));
}
function fromGroup(state: SessionState, info: TargetInfo, point: Point): DropTarget | null {
  if (info.target.kind !== 'node') return null;
  const at = { x: point.x - info.box.x, y: point.y - info.box.y };
  return { section: info.target.section, group: groupId(state, info), at };
}
function fromSection(info: TargetInfo | undefined, point: Point): DropTarget | null {
  if (info?.target.kind !== 'section') return null;
  const at = { x: point.x - info.sectionOrigin.x, y: point.y - info.sectionOrigin.y };
  return { section: info.target.id, group: null, at };
}
/** Where a new object dropped at a world point belongs: the innermost group, else the section. */
export function dropTarget(state: SessionState, point: Point): DropTarget | null {
  const group = groupAt(state, point);
  if (group !== undefined) return fromGroup(state, group, point);
  return fromSection(sectionAt(state, point), point);
}
