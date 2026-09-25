/*
 * Settling a captured drag: the dropped node stops short of its siblings, groups grow to hold
 * children dropped past their edges, and only changed sections become replace changes. Pure;
 * Authoring owns commit and recovery.
 */
import type { Result } from '../../../contract/errors.js';
import type {
  Change,
  Placement,
  PlacementIntent,
  RenderDocument,
  Section,
  Target,
} from '../../../contract/records/owners.js';
import { placeEntries } from '../placements.js';
import { pinnedSections } from './pinning.js';
import type { SceneNode, SceneSection } from './scene.js';

/** Every section after the intent: pinned, placed, then settled against the original scene. */
export function plannedSections(
  document: RenderDocument,
  intent: PlacementIntent,
): Result<readonly Section[]> {
  const frozen = pinnedSections(document, intent);
  if (!frozen.ok) {
    return frozen;
  }
  const pinnedDocument = {
    ...document,
    collection: { ...document.collection, sections: frozen.value },
  };
  const targets = intent.entries.map((entry) => entry.target);
  return {
    ok: true,
    value: placeEntries(intent, pinnedDocument).map((section) =>
      settled(section, document, targets),
    ),
  };
}

/** A dropped node stops short of siblings, and its group grows to hold it. */
export function settled(
  section: Section,
  document: RenderDocument,
  targets: readonly Target[],
): Section {
  if (section.mode !== 'modules') return section;
  return growToHold(stopShort(section, document, targets), document);
}

/** Only changed sections become replace changes; Model remains responsible for diagram validity. */
export function changes(
  document: RenderDocument,
  sections: readonly Section[],
): readonly Change[] {
  return sections
    .filter(
      (section) => document.collection.sections.find((item) => item.id === section.id) !== section,
    )
    .map((value) => ({ op: 'replace' as const, target: 'sections' as const, value }));
}

/** A point in group-local coordinates. */
type Point = { readonly x: number; readonly y: number };

/** A size in group-local coordinates. */
type Size = { readonly width: number; readonly height: number };

/** A measured rectangle: x, y, width and height. */
type Box = Point & Size;

/** The dropped node, its appearance and its target placement. */
interface Drop {
  readonly node: SceneNode;
  readonly moved: Section['appearances'][number];
  readonly after: Placement;
}

/** The drag path of a drop and the space its siblings leave. */
interface DropGeometry {
  /** The drop point at fraction t of the path from the node's origin to its target. */
  readonly at: (t: number) => Point;
  /** Whether the point at t keeps a padding-wide gap from every sibling. */
  readonly clear: (t: number) => boolean;
  /** Whether the point p keeps a padding-wide gap from every sibling. */
  readonly free: (p: Point) => boolean;
  /** True when the node enters another group: it has no path inside it. */
  readonly entersGroup: boolean;
}

/** How far a group grows up and left, and the inset its children stay inside. */
interface Growth {
  readonly dx: number;
  readonly dy: number;
  readonly insetX: number;
  readonly insetY: number;
}

/** The groups and appearances of a section being grown, step by step. */
interface GrowthState {
  readonly groups: Section['groups'];
  readonly appearances: Section['appearances'];
}

/** A node dropped onto a sibling stops short along its drag path, keeping a padding-wide gap. */
function stopShort(
  section: Section,
  document: RenderDocument,
  targets: readonly Target[],
): Section {
  const scene = document.scene.sections.find((item) => item.id === section.id);
  if (scene === undefined) return section;
  const appearances = targets.reduce(
    (current, target) => stopOneShort(section, scene, current, target, document.options.padding),
    section.appearances,
  );
  return appearances === section.appearances ? section : { ...section, appearances };
}

/** One dropped node stops short of its siblings along its drag path. */
function stopOneShort(
  section: Section,
  scene: SceneSection,
  appearances: Section['appearances'],
  target: Target,
  space: number,
): Section['appearances'] {
  const drop = dropTarget(section, scene, appearances, target);
  if (drop === undefined) return appearances;
  return stopAt(scene, appearances, drop, space);
}

/** The drop of a target, when it names an ungrouped node of this section with a placement. */
function dropTarget(
  section: Section,
  scene: SceneSection,
  appearances: Section['appearances'],
  target: Target,
): Drop | undefined {
  if (target.kind !== 'node' || target.section !== section.id) return undefined;
  return movedDrop(scene, appearances, target.id);
}

/** The drop of one node: it must exist, sit outside groups and have a placed appearance. */
function movedDrop(
  scene: SceneSection,
  appearances: Section['appearances'],
  id: string,
): Drop | undefined {
  const node = scene.nodes.find((item) => item.id === id);
  if (node === undefined || node.measured.groupId !== null) return undefined;
  const moved = appearances.find((a) => a.object === node.measured.objectId);
  if (moved?.placement == null) return undefined;
  return { node, moved, after: moved.placement };
}

/** Move the dropped appearance to the last clear point of its path. */
function stopAt(
  scene: SceneSection,
  appearances: Section['appearances'],
  drop: Drop,
  space: number,
): Section['appearances'] {
  const geometry = dropGeometry(scene, appearances, drop, space);
  if (geometry.clear(1)) return appearances;
  const spot = dropSpot(drop, geometry);
  return appearances.map((a) =>
    a === drop.moved ? { ...a, placement: { ...drop.after, x: spot.x, y: spot.y } } : a,
  );
}

/** The drag path and the sibling boxes it must not overlap. */
function dropGeometry(
  scene: SceneSection,
  appearances: Section['appearances'],
  drop: Drop,
  space: number,
): DropGeometry {
  const parent = frameOf(scene.nodes, drop.node, drop.moved.group);
  const before = {
    x: drop.node.box.x - (parent?.box.x ?? 0),
    y: drop.node.box.y - (parent?.box.y ?? 0),
  };
  const size = {
    width: drop.after.width ?? drop.node.box.width,
    height: drop.after.height ?? drop.node.box.height,
  };
  const others = siblingBoxes(scene, appearances, drop.moved);
  const at = (t: number): Point => ({
    x: before.x + (drop.after.x - before.x) * t,
    y: before.y + (drop.after.y - before.y) * t,
  });
  const free = (p: Point): boolean => others.every((o) => clearOf(p, size, o, space));
  return { at, free, clear: (t) => free(at(t)), entersGroup: parent?.id !== drop.node.parent };
}

/** The boxes of the dropped appearance's siblings in its new group. */
function siblingBoxes(
  scene: SceneSection,
  appearances: Section['appearances'],
  moved: Section['appearances'][number],
): readonly Box[] {
  const siblings = appearances.filter(
    (a): a is Section['appearances'][number] & { readonly placement: Placement } =>
      a !== moved && a.group === moved.group && a.placement != null,
  );
  return siblings.map((a) => siblingBox(scene, a));
}

/** A sibling's box: its placement, with the node's measured size as fallback. */
function siblingBox(
  scene: SceneSection,
  appearance: Section['appearances'][number] & { readonly placement: Placement },
): Box {
  const node = scene.nodes.find((item) => item.measured.objectId === appearance.object);
  const { placement } = appearance;
  return {
    x: placement.x,
    y: placement.y,
    width: placement.width ?? node?.box.width ?? 0,
    height: placement.height ?? node?.box.height ?? 0,
  };
}

/** Two boxes keep a padding-wide gap, on one axis or the other. */
function clearOf(
  p: Point,
  size: Size,
  other: Box,
  space: number,
): boolean {
  return (
    p.x + size.width + space <= other.x ||
    other.x + other.width + space <= p.x ||
    p.y + size.height + space <= other.y ||
    other.y + other.height + space <= p.y
  );
}

/** Along the path inside the same group; entering another group takes the nearest free spot there. */
function dropSpot(
  drop: Drop,
  geometry: DropGeometry,
): Point {
  if (geometry.entersGroup) return nearestFree(drop.after, geometry.free);
  return backTrack(geometry.at, geometry.clear);
}

/** The last clear point of the path, stepping back in sixty-fourths. */
function backTrack(
  at: (t: number) => Point,
  clear: (t: number) => boolean,
): Point {
  let t = 1;
  while (t > 0 && !clear(t)) t = Math.max(0, t - 1 / 64);
  return at(t);
}

/** Search outward from the drop point, down then right. Never up or left: that would leave the group. */
function nearestFree(
  from: Point,
  free: (p: Point) => boolean,
): Point {
  const ways = [
    [0, 1],
    [1, 0],
  ] as const;
  const steps = Array.from({ length: 256 }, (_, i) => (i + 1) * 8);
  const spots = steps.flatMap((d) =>
    ways.map(([x, y]) => ({ x: from.x + x * d, y: from.y + y * d })),
  );
  return spots.find(free) ?? from;
}

/** The frame the node's placement is measured from: its new group, or the nearest non-group ancestor. */
function frameOf(
  nodes: readonly SceneNode[],
  node: SceneNode,
  group: string | undefined,
): SceneNode | undefined {
  if (group !== undefined) return nodes.find((item) => item.measured.groupId === group);
  return outside(
    nodes,
    nodes.find((item) => item.id === node.parent),
  );
}

/** The nearest ancestor outside any group. */
function outside(
  nodes: readonly SceneNode[],
  from: SceneNode | undefined,
): SceneNode | undefined {
  if (from?.measured.groupId == null) return from;
  return outside(
    nodes,
    nodes.find((item) => item.id === from.parent),
  );
}

/** A child dragged past its group's top or left edge grows the group up or left; the child stays where dropped. */
function growToHold(
  section: Section,
  document: RenderDocument,
): Section {
  const scene = document.scene.sections.find((item) => item.id === section.id);
  if (scene === undefined) return section;
  const grown = deepestFirst(section.groups).reduce(
    (state, group) => growGroup(state, group, scene, document.options.padding),
    { groups: section.groups, appearances: section.appearances } as GrowthState,
  );
  return grown.groups === section.groups ? section : { ...section, ...grown };
}

/** Deepest groups first, so a parent's growth accounts for already-grown children. */
function deepestFirst(groups: Section['groups']): Section['groups'] {
  return groups.toSorted((a, b) => groupDepth(groups, b.id) - groupDepth(groups, a.id));
}

/** The nesting depth of a group; orphan parents count as roots. */
function groupDepth(
  groups: Section['groups'],
  id: string | undefined,
): number {
  const parent = groups.find((g) => g.id === id)?.parent;
  return parent == null ? 0 : 1 + groupDepth(groups, parent);
}

/** One group's growth step; groups without a placement or measured header are left alone. */
function growGroup(
  state: GrowthState,
  group: Section['groups'][number],
  scene: SceneSection,
  padding: number,
): GrowthState {
  const current = state.groups.find((g) => g.id === group.id);
  const header = scene.nodes.find((n) => n.measured.groupId === group.id)?.measured.headerHeight;
  if (current?.placement == null || header === undefined) return state;
  return growMeasured(state, group, current.placement, header, scene, padding);
}

/** A group grows only when it has children. */
function growMeasured(
  state: GrowthState,
  group: Section['groups'][number],
  placement: Placement,
  header: number,
  scene: SceneSection,
  padding: number,
): GrowthState {
  const children = childPlacements(state, group.id);
  if (children.length === 0) return state;
  return applyNeeded(state, group, placement, children, scene, header, padding);
}

/** Growth is applied only when the children sit past the inset. */
function applyNeeded(
  state: GrowthState,
  group: Section['groups'][number],
  placement: Placement,
  children: readonly Placement[],
  scene: SceneSection,
  header: number,
  padding: number,
): GrowthState {
  const growth = neededGrowth(group, placement, children, scene, header, padding);
  if (growth.dx === 0 && growth.dy === 0) return state;
  return applyGrowth(state, group.id, placement, growth);
}

/** The placements of the group's member appearances and child groups. */
function childPlacements(
  state: GrowthState,
  id: string,
): Placement[] {
  const members = state.appearances.filter((a) => a.group === id).map((a) => a.placement);
  const subgroups = state.groups.filter((g) => g.parent === id).map((g) => g.placement);
  return [...members, ...subgroups].filter((p): p is Placement => p != null);
}

/** How far the group must grow so its children sit inside the inset, capped by the free room. */
function neededGrowth(
  group: Section['groups'][number],
  placement: Placement,
  children: readonly Placement[],
  scene: SceneSection,
  header: number,
  padding: number,
): Growth {
  const frame = scene.nodes.find((n) => n.measured.groupId === group.id);
  const inset = groupInset(scene, frame, header, padding);
  const needX = Math.max(0, inset.x - Math.min(...children.map((p) => p.x)));
  const needY = Math.max(0, inset.y - Math.min(...children.map((p) => p.y)));
  const room = frame === undefined ? { x: 0, y: 0 } : freeRoom(scene.nodes, frame);
  const top = group.parent == null;
  return {
    dx: cappedGrowth(needX, room.x, placement.x, top, padding),
    dy: cappedGrowth(needY, room.y, placement.y, top, padding),
    insetX: inset.x,
    insetY: inset.y,
  };
}

/** The inset the layout already gave this group; its frame road runs inside it. */
function groupInset(
  scene: SceneSection,
  frame: SceneNode | undefined,
  header: number,
  padding: number,
): Point {
  const inside = frame === undefined ? [] : scene.nodes.filter((n) => n.parent === frame.id);
  if (frame === undefined || inside.length === 0) return { x: padding, y: header + padding };
  return {
    x: Math.max(padding, Math.min(...inside.map((n) => n.box.x - frame.box.x))),
    y: Math.max(header + padding, Math.min(...inside.map((n) => n.box.y - frame.box.y))),
  };
}

/** Growth along one axis: into free room, and at the top level never past the padding. */
function cappedGrowth(
  need: number,
  room: number,
  position: number,
  topLevel: boolean,
  padding: number,
): number {
  const edge = topLevel ? Math.min(room, position - padding) : room;
  return Math.min(need, Math.max(0, edge));
}

/** Grow the group up and left, shifting its members and child groups back inside the inset. */
function applyGrowth(
  state: GrowthState,
  id: string,
  placement: Placement,
  growth: Growth,
): GrowthState {
  const groups = state.groups.map((g) => grownGroup(g, id, placement, growth));
  const appearances = state.appearances.map((a) =>
    a.group === id ? { ...a, placement: shiftInside(a.placement, growth) } : a,
  );
  return { groups, appearances };
}

/** The group itself grows; its child groups shift; every other group is unchanged. */
function grownGroup(
  g: Section['groups'][number],
  id: string,
  placement: Placement,
  growth: Growth,
): Section['groups'][number] {
  if (g.id === id) return { ...g, placement: grownSelf(placement, growth) };
  if (g.parent === id) return { ...g, placement: shiftInside(g.placement, growth) };
  return g;
}

/** The group grows up and left, wider and taller by the same amount. */
function grownSelf(
  placement: Placement,
  growth: Growth,
): Placement {
  return {
    ...placement,
    x: placement.x - growth.dx,
    y: placement.y - growth.dy,
    width: grownDimension(placement.width, growth.dx),
    height: grownDimension(placement.height, growth.dy),
  };
}

/** A dimension grown by delta; undefined stays unset. */
function grownDimension(
  value: number | undefined,
  delta: number,
): number | undefined {
  return value === undefined ? undefined : value + delta;
}

/** A child shifted right and down by the growth, never past the inset. */
function shiftInside(
  placement: Placement | undefined,
  growth: Growth,
): Placement | undefined {
  if (placement == null) return placement;
  return {
    ...placement,
    x: Math.max(growth.insetX, placement.x + growth.dx),
    y: Math.max(growth.insetY, placement.y + growth.dy),
  };
}

/** Space left of and above a group it may grow into. */
function freeRoom(
  nodes: readonly SceneNode[],
  frame: SceneNode,
): Point {
  const b = frame.box;
  const siblings = nodes.filter((n) => n.parent === frame.parent && n.id !== frame.id);
  const left = siblings.filter(
    (n) => n.box.x + n.box.width <= b.x && n.box.y < b.y + b.height && b.y < n.box.y + n.box.height,
  );
  const above = siblings.filter(
    (n) => n.box.y + n.box.height <= b.y && n.box.x < b.x + b.width && b.x < n.box.x + n.box.width,
  );
  return {
    // The road beside a sibling is already at its minimum width; never grow into it.
    x: left.length > 0 ? 0 : Infinity,
    y: above.length > 0 ? 0 : Infinity,
  };
}
