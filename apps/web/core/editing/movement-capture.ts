import type {
  Change,
  Placement,
  PlacementIntent,
  RenderDocument,
  Section,
  Target,
} from '../../contract/records/owners.js';
import type { GeometryChange } from '../../contract/records/movement.js';
import { placeEntries } from './placements.js';

export type Box = GeometryChange['before'];

export function sourcePlacement(
  prior: Placement | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
): Placement {
  return {
    x,
    y,
    width,
    height,
    locked: prior?.locked ?? false,
  };
}

export function originPlacement(prior: Placement | undefined, x: number, y: number): Placement {
  return prior === undefined ? { x, y, locked: false } : { ...prior, x, y };
}

export function pinnedSections(
  document: RenderDocument,
  intent: PlacementIntent,
): readonly Section[] {
  const affected = new Set(
    intent.entries
      .map((entry) => {
        if (entry.target.kind === 'section') return entry.target.id;
        if (entry.target.kind === 'node') return entry.target.section;
        return '';
      })
      .filter((id) => id !== ''),
  );
  return document.collection.sections.map((source) => pinSection(document, source, affected));
}

function pinSection(
  document: RenderDocument,
  source: Section,
  affected: ReadonlySet<string>,
): Section {
  const scene = document.scene.sections.find((item) => item.id === source.id);
  if (scene === undefined) throw new Error('captured section missing');
  const placement = originPlacement(source.placement, scene.origin.x, scene.origin.y);
  if (!affected.has(source.id) || source.mode !== 'modules') return { ...source, placement };
  const nodes = new Map(scene.nodes.map((node) => [node.id, node]));
  return {
    ...source,
    placement,
    groups: source.groups.map((group) => pinGroup(group, scene.nodes, nodes)),
    appearances: source.appearances.map((appearance) =>
      pinAppearance(appearance, scene.nodes, nodes),
    ),
  };
}

function parentBox(
  node: { readonly parent: string | null; readonly box: Box },
  nodes: ReadonlyMap<string, { readonly box: Box }>,
): Box | undefined {
  return node.parent === null ? undefined : nodes.get(node.parent)?.box;
}

function pinGroup(
  group: Section['groups'][number],
  nodes: readonly RenderDocument['scene']['sections'][number]['nodes'][number][],
  indexed: ReadonlyMap<string, RenderDocument['scene']['sections'][number]['nodes'][number]>,
): Section['groups'][number] {
  const node = nodes.find((candidate) => candidate.measured.groupId === group.id);
  if (node === undefined) throw new Error('captured group missing');
  const parent = requiredParent(node, indexed, 'captured group parent missing');
  return {
    ...group,
    placement: sourcePlacement(
      group.placement,
      node.box.x - (parent?.x ?? 0),
      node.box.y - (parent?.y ?? 0),
      node.box.width,
      node.box.height,
    ),
  };
}

function pinAppearance(
  appearance: Section['appearances'][number],
  nodes: readonly RenderDocument['scene']['sections'][number]['nodes'][number][],
  indexed: ReadonlyMap<string, RenderDocument['scene']['sections'][number]['nodes'][number]>,
): Section['appearances'][number] {
  const node = nodes.find(
    (candidate) =>
      candidate.measured.groupId === null && candidate.measured.objectId === appearance.object,
  );
  if (node === undefined) throw new Error('captured appearance missing');
  const parent = requiredParent(node, indexed, 'captured appearance parent missing');
  return {
    ...appearance,
    placement: sourcePlacement(
      appearance.placement,
      node.box.x - (parent?.x ?? 0),
      node.box.y - (parent?.y ?? 0),
      node.box.width,
      node.box.height,
    ),
  };
}

function requiredParent(
  node: { readonly parent: string | null; readonly box: Box },
  indexed: ReadonlyMap<string, { readonly box: Box }>,
  message: string,
): Box | undefined {
  const parent = parentBox(node, indexed);
  if (node.parent !== null && parent === undefined) throw new Error(message);
  return parent;
}

export function plannedSections(
  document: RenderDocument,
  intent: PlacementIntent,
): readonly Section[] {
  const frozen = pinnedSections(document, intent);
  const pinnedDocument = {
    ...document,
    collection: { ...document.collection, sections: frozen },
  };
  return placeEntries(intent, pinnedDocument).map((section) =>
    section.mode === 'modules'
      ? growToHold(stopShort(section, document, intent), document)
      : section,
  );
}

/** A node dropped onto a sibling stops short along its drag path, keeping a padding-wide gap. */
function stopShort(section: Section, document: RenderDocument, intent: PlacementIntent): Section {
  const scene = document.scene.sections.find((item) => item.id === section.id);
  if (scene === undefined) return section;
  const space = document.options.padding;
  let appearances = section.appearances;
  for (const entry of intent.entries) {
    if (entry.target.kind !== 'node' || entry.target.section !== section.id) continue;
    const id = entry.target.id;
    const node = scene.nodes.find((item) => item.id === id);
    if (node === undefined || node.measured.groupId !== null) continue;
    const moved = appearances.find((a) => a.object === node.measured.objectId);
    const after = moved?.placement;
    if (moved === undefined || after == null) continue;
    const parent = scene.nodes.find((item) => item.id === node.parent);
    const before = { x: node.box.x - (parent?.box.x ?? 0), y: node.box.y - (parent?.box.y ?? 0) };
    const size = { width: after.width ?? node.box.width, height: after.height ?? node.box.height };
    const others = appearances.flatMap((a) => {
      if (a === moved || a.group !== moved.group || a.placement == null) return [];
      const other = scene.nodes.find((item) => item.measured.objectId === a.object);
      return [
        {
          x: a.placement.x,
          y: a.placement.y,
          width: a.placement.width ?? other?.box.width ?? 0,
          height: a.placement.height ?? other?.box.height ?? 0,
        },
      ];
    });
    const at = (t: number) => ({
      x: before.x + (after.x - before.x) * t,
      y: before.y + (after.y - before.y) * t,
    });
    const clear = (t: number) => {
      const p = at(t);
      return others.every(
        (o) =>
          p.x + size.width + space <= o.x ||
          o.x + o.width + space <= p.x ||
          p.y + size.height + space <= o.y ||
          o.y + o.height + space <= p.y,
      );
    };
    if (clear(1)) continue;
    let t = 1;
    while (t > 0 && !clear(t)) t = Math.max(0, t - 1 / 64);
    const p = at(t);
    appearances = appearances.map((a) =>
      a === moved ? { ...a, placement: { ...after, x: p.x, y: p.y } } : a,
    );
  }
  return appearances === section.appearances ? section : { ...section, appearances };
}

/** A child dragged past its group's top or left edge grows the group up or left; the child stays where dropped. */
function growToHold(section: Section, document: RenderDocument): Section {
  const scene = document.scene.sections.find((item) => item.id === section.id);
  if (scene === undefined) return section;
  const padding = document.options.padding;
  let groups = section.groups,
    appearances = section.appearances;
  const depth = (id: string | undefined): number => {
    const parent = groups.find((g) => g.id === id)?.parent;
    return parent == null ? 0 : 1 + depth(parent);
  };
  for (const group of section.groups.toSorted((a, b) => depth(b.id) - depth(a.id))) {
    const current = groups.find((g) => g.id === group.id);
    const header = scene.nodes.find((n) => n.measured.groupId === group.id)?.measured.headerHeight;
    if (current?.placement == null || header === undefined) continue;
    const children = [
      ...appearances.filter((a) => a.group === group.id).map((a) => a.placement),
      ...groups.filter((g) => g.parent === group.id).map((g) => g.placement),
    ].filter((p): p is Placement => p != null);
    if (children.length === 0) continue;
    // Keep the inset the layout already gave this group; its frame road runs inside it.
    const frame = scene.nodes.find((n) => n.measured.groupId === group.id);
    const inside = scene.nodes.filter((n) => frame !== undefined && n.parent === frame.id);
    const insetX =
      inside.length === 0 || frame === undefined
        ? padding
        : Math.max(padding, Math.min(...inside.map((n) => n.box.x - frame.box.x)));
    const insetY =
      inside.length === 0 || frame === undefined
        ? header + padding
        : Math.max(header + padding, Math.min(...inside.map((n) => n.box.y - frame.box.y)));
    const needX = Math.max(0, insetX - Math.min(...children.map((p) => p.x)));
    const needY = Math.max(0, insetY - Math.min(...children.map((p) => p.y)));
    if (needX === 0 && needY === 0) continue;
    // Grow only into free space; a child dropped past that stops at the inset.
    const room = frame === undefined ? { x: 0, y: 0 } : freeRoom(scene.nodes, frame);
    const top = current.parent == null;
    const dx = Math.min(
      needX,
      Math.max(0, top ? Math.min(room.x, current.placement.x - padding) : room.x),
    );
    const dy = Math.min(
      needY,
      Math.max(0, top ? Math.min(room.y, current.placement.y - padding) : room.y),
    );
    const shift = (p: Placement | undefined): Placement | undefined =>
      p == null ? p : { ...p, x: Math.max(insetX, p.x + dx), y: Math.max(insetY, p.y + dy) };
    const grown = current.placement;
    groups = groups.map((g) =>
      g.id === group.id
        ? {
            ...g,
            placement: {
              ...grown,
              x: grown.x - dx,
              y: grown.y - dy,
              ...(grown.width == null ? {} : { width: grown.width + dx }),
              ...(grown.height == null ? {} : { height: grown.height + dy }),
            },
          }
        : g.parent === group.id
          ? { ...g, placement: shift(g.placement) }
          : g,
    );
    appearances = appearances.map((a) =>
      a.group === group.id ? { ...a, placement: shift(a.placement) } : a,
    );
  }
  return groups === section.groups ? section : { ...section, groups, appearances };
}

/** Space left of and above a group it may grow into. */
function freeRoom(
  nodes: RenderDocument['scene']['sections'][number]['nodes'],
  frame: RenderDocument['scene']['sections'][number]['nodes'][number],
): { readonly x: number; readonly y: number } {
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

export function changes(document: RenderDocument, sections: readonly Section[]): readonly Change[] {
  return sections
    .filter(
      (section) => document.collection.sections.find((item) => item.id === section.id) !== section,
    )
    .map((value) => ({ op: 'replace' as const, target: 'sections' as const, value }));
}

export function sceneBox(document: RenderDocument, target: Target): Box | undefined {
  if (target.kind === 'section') return sectionBox(document, target.id);
  if (target.kind === 'node') return nodeWorldBox(document, target);
  return undefined;
}

function sectionBox(document: RenderDocument, id: string): Box | undefined {
  return document.scene.sections.find((section) => section.id === id)?.box;
}

function nodeWorldBox(
  document: RenderDocument,
  target: Extract<Target, { kind: 'node' }>,
): Box | undefined {
  const section = document.scene.sections.find((item) => item.id === target.section);
  const node = section?.nodes.find((item) => item.id === target.id);
  return section === undefined || node === undefined
    ? undefined
    : { ...node.box, x: node.box.x + section.origin.x, y: node.box.y + section.origin.y };
}

export function targetKey(target: Target): string {
  if (target.kind === 'section') return `section:${target.id}`;
  return `node:${target.section}:${target.id}`;
}

export function exactBox(before: Box, after: Box): boolean {
  return boxDimensions(before).every((value, index) => value === boxDimensions(after)[index]);
}

function boxDimensions(box: Box): readonly number[] {
  return [box.x, box.y, box.width, box.height];
}

export function closureKeys(
  document: RenderDocument,
  entry: PlacementIntent['entries'][number],
): ReadonlySet<string> {
  if (entry.target.kind !== 'node') return new Set();
  return nodeClosure(document, entry.target.section, entry.target.id);
}

function nodeClosure(
  document: RenderDocument,
  sectionId: string,
  nodeId: string,
): ReadonlySet<string> {
  const section = document.scene.sections.find((item) => item.id === sectionId);
  const keys = new Set<string>();
  if (section === undefined) return keys;
  section.nodes
    .filter((node) => containsAncestor(section.nodes, node.id, nodeId))
    .forEach((node) => keys.add(targetKey({ kind: 'node', section: section.id, id: node.id })));
  return keys;
}

function containsAncestor(
  nodes: readonly { readonly id: string; readonly parent: string | null }[],
  start: string,
  wanted: string,
): boolean {
  let current: string | null = start;
  while (current !== null && current !== wanted)
    current = nodes.find((item) => item.id === current)?.parent ?? null;
  return current === wanted;
}
