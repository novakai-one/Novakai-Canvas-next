import type { Placement, RenderDocument, Section, Target } from '../../contract/records/owners.js';

type SceneSection = RenderDocument['scene']['sections'][number];
type SceneNode = SceneSection['nodes'][number];
type Point = { readonly x: number; readonly y: number };
type Rect = Point & { readonly width: number; readonly height: number };
/** What a dragged scene node is in the source: a shown object or a group, and what holds it. */
type Dragged = {
  readonly kind: 'appearance' | 'group';
  readonly id: string;
  readonly container: string | undefined;
  readonly placement: Placement;
};

/** A node or group dropped onto a sibling stops short of it along its drag path, keeping a
 * road-wide gap so wires still pass between them; one entering another group takes the
 * nearest free spot there instead. A drop that already clears its siblings stays as dropped. */
export function stopShort(
  section: Section,
  document: RenderDocument,
  targets: readonly Target[],
): Section {
  const scene = document.scene.sections.find((item) => item.id === section.id);
  if (scene === undefined) return section;
  const padding = document.options.padding;
  const road = document.projection.sections.find((item) => item.id === section.id)?.envelope?.gap;
  const space = { clear: padding, road: Math.max(padding, road ?? padding) };
  return targets.reduce((current, target) => stopOne(current, scene, target, space), section);
}

type Space = { readonly clear: number; readonly road: number };

function stopOne(section: Section, scene: SceneSection, target: Target, space: Space): Section {
  const node =
    target.kind === 'node' && target.section === section.id
      ? scene.nodes.find((item) => item.id === target.id)
      : undefined;
  const item = node === undefined ? undefined : dragged(section, node);
  return node === undefined || item === undefined
    ? section
    : stopped(section, scene, node, item, space);
}

function stopped(
  section: Section,
  scene: SceneSection,
  node: SceneNode,
  item: Dragged,
  space: Space,
): Section {
  const parent = frameOf(scene.nodes, node, item.container);
  const origin = parent?.box ?? { x: 0, y: 0 };
  const before = { x: node.box.x - origin.x, y: node.box.y - origin.y };
  const after = item.placement;
  const size = { width: after.width ?? node.box.width, height: after.height ?? node.box.height };
  const others = siblings(section, scene, item);
  const free = (p: Point, gap = space.road) =>
    others.every((other) => apart({ ...p, ...size }, other, gap));
  const at = (t: number) => ({
    x: before.x + (after.x - before.x) * t,
    y: before.y + (after.y - before.y) * t,
  });
  // Clear of every sibling: stays as dropped. Squarely on one: the move fails and names it.
  const kept =
    free(at(1), space.clear) || others.some((other) => squarely({ ...after, ...size }, other));
  const inPlace = (parent?.id ?? null) === node.parent;
  // A full road where the path allows it, else half a road, else the padding.
  const back = () =>
    [space.road, space.road / 2, space.clear]
      .map((gap) => backTrack((t) => free(at(t), gap)))
      .find((t) => t > 0) ?? 0;
  const spot = () => (inPlace ? at(back()) : nearestFree(after, free));
  return kept ? section : replaced(section, item, { ...after, ...spot() });
}

function dragged(section: Section, node: SceneNode): Dragged | undefined {
  const groupId = node.measured.groupId;
  return groupId == null ? shownItem(section, node) : groupItem(section, groupId);
}

function groupItem(section: Section, groupId: string): Dragged | undefined {
  const group = section.groups.find((item) => item.id === groupId);
  return group?.placement == null
    ? undefined
    : {
        kind: 'group',
        id: group.id,
        container: group.parent ?? undefined,
        placement: group.placement,
      };
}

function shownItem(section: Section, node: SceneNode): Dragged | undefined {
  const shown = section.appearances.find((item) => item.object === node.measured.objectId);
  return shown?.placement == null
    ? undefined
    : { kind: 'appearance', id: shown.object, container: shown.group, placement: shown.placement };
}

/** Shown objects and groups held by the same container, where they now stand. */
function siblings(section: Section, scene: SceneSection, item: Dragged): readonly Rect[] {
  const same = (container: string | null | undefined) =>
    (container ?? undefined) === item.container;
  const shown = section.appearances
    .filter((a) => same(a.group) && !(item.kind === 'appearance' && a.object === item.id))
    .map((a) =>
      rect(
        a.placement,
        scene.nodes.find((n) => n.measured.objectId === a.object),
      ),
    );
  const groups = section.groups
    .filter((g) => same(g.parent) && !(item.kind === 'group' && g.id === item.id))
    .map((g) =>
      rect(
        g.placement,
        scene.nodes.find((n) => n.measured.groupId === g.id),
      ),
    );
  return [...shown, ...groups].filter((other): other is Rect => other !== undefined);
}

function rect(
  placement: Placement | null | undefined,
  node: SceneNode | undefined,
): Rect | undefined {
  if (placement == null) return undefined;
  return {
    x: placement.x,
    y: placement.y,
    width: placement.width ?? node?.box.width ?? 0,
    height: placement.height ?? node?.box.height ?? 0,
  };
}

/** One box holds the other's centre: the person aimed at that box, not beside it. */
function squarely(a: Rect, b: Rect): boolean {
  return holds(a, centre(b)) || holds(b, centre(a));
}
function centre(box: Rect): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
function holds(box: Rect, p: Point): boolean {
  return p.x > box.x && p.x < box.x + box.width && p.y > box.y && p.y < box.y + box.height;
}

function apart(a: Rect, b: Rect, space: number): boolean {
  return (
    a.x + a.width + space <= b.x ||
    b.x + b.width + space <= a.x ||
    a.y + a.height + space <= b.y ||
    b.y + b.height + space <= a.y
  );
}

function replaced(section: Section, item: Dragged, placement: Placement): Section {
  return item.kind === 'group'
    ? {
        ...section,
        groups: section.groups.map((g) => (g.id === item.id ? { ...g, placement } : g)),
      }
    : {
        ...section,
        appearances: section.appearances.map((a) =>
          a.object === item.id ? { ...a, placement } : a,
        ),
      };
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
function outside(nodes: readonly SceneNode[], from: SceneNode | undefined): SceneNode | undefined {
  if (from?.measured.groupId == null) return from;
  return outside(
    nodes,
    nodes.find((item) => item.id === from.parent),
  );
}

/** The furthest point along the drag path that is clear, as a fraction of the path. */
function backTrack(clear: (t: number) => boolean): number {
  let t = 1;
  while (t > 0 && !clear(t)) t = Math.max(0, t - 1 / 64);
  return t;
}

/** Search outward from the drop point, down then right. Never up or left: that would leave the group. */
function nearestFree(
  from: { x: number; y: number },
  free: (p: { x: number; y: number }) => boolean,
): { x: number; y: number } {
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
