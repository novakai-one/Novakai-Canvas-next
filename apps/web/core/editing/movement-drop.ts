import type { PlacementIntent, RenderDocument } from '../../contract/records/owners.js';
import { sceneBox, targetKey, type Box } from './movement-capture.js';
import { expectedBoxes } from './movement-intent.js';

type SceneSection = RenderDocument['scene']['sections'][number];
type SceneNode = SceneSection['nodes'][number];
type Entry = PlacementIntent['entries'][number];

/** The box a dragged node was dropped squarely onto, named for the person when the move fails.
 * Other nodes that move in the same gesture are compared at their new boxes; a node's own group
 * and members never count, since one holds the other. */
export function droppedOnto(
  document: RenderDocument,
  entries: readonly Entry[],
): string | undefined {
  const expected = expectedBoxes(document, entries);
  const boxes = expected.ok ? expected.value : new Map<string, Box>();
  return entries.flatMap((entry) => landedOn(document, entry, boxes)).at(0)?.measured.label;
}

/** Whether any dragged node was dropped away from where it stands now, so staying put is a refusal, not a no-op. */
export function droppedAway(document: RenderDocument, entries: readonly Entry[]): boolean {
  const expected = expectedBoxes(document, entries);
  return (
    expected.ok &&
    entries.some((entry) => {
      const now = sceneBox(document, entry.target);
      const want = expected.value.get(targetKey(entry.target));
      return now !== undefined && want !== undefined && shifted(now, want);
    })
  );
}

function shifted(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5;
}

function landedOn(
  document: RenderDocument,
  entry: Entry,
  boxes: ReadonlyMap<string, Box>,
): readonly SceneNode[] {
  const section = sectionOf(document, entry.target);
  const dragged = boxes.get(targetKey(entry.target));
  return section === undefined || dragged === undefined
    ? []
    : blockers(section, targetKey(entry.target), dragged, boxes);
}

function sectionOf(document: RenderDocument, target: Entry['target']): SceneSection | undefined {
  return target.kind === 'node'
    ? document.scene.sections.find((item) => item.id === target.section)
    : undefined;
}

/** Unrelated nodes, smallest first, whose box holds the dragged box's centre, or whose centre it holds. */
function blockers(
  section: SceneSection,
  key: string,
  dragged: Box,
  boxes: ReadonlyMap<string, Box>,
): readonly SceneNode[] {
  const id = section.nodes.find((node) => nodeKey(section, node) === key)?.id ?? '';
  const family = new Set([id, ...ancestors(section.nodes, id), ...members(section.nodes, id)]);
  return section.nodes
    .filter((node) => !family.has(node.id))
    .filter((node) => squarely(dragged, boxes.get(nodeKey(section, node))))
    .toSorted((a, b) => area(a.box) - area(b.box));
}

/** The smallest box hit is the one the person aimed at, not the group around it. */
function area(box: Box): number {
  return box.width * box.height;
}

function nodeKey(section: SceneSection, node: SceneNode): string {
  return targetKey({ kind: 'node', section: section.id, id: node.id });
}

function squarely(dragged: Box, other: Box | undefined): boolean {
  return other !== undefined && (holds(other, centre(dragged)) || holds(dragged, centre(other)));
}

function centre(box: Box): { readonly x: number; readonly y: number } {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function holds(box: Box, point: { readonly x: number; readonly y: number }): boolean {
  return (
    point.x > box.x &&
    point.x < box.x + box.width &&
    point.y > box.y &&
    point.y < box.y + box.height
  );
}

function ancestors(nodes: readonly SceneNode[], id: string): readonly string[] {
  const parent = nodes.find((node) => node.id === id)?.parent ?? null;
  return parent === null ? [] : [parent, ...ancestors(nodes, parent)];
}

function members(nodes: readonly SceneNode[], id: string): readonly string[] {
  return nodes
    .filter((node) => node.parent === id)
    .flatMap((node) => [node.id, ...members(nodes, node.id)]);
}
