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
      .filter((entry) => entry.target.kind === 'node')
      .map((entry) => ('section' in entry.target ? entry.target.section : '')),
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
  return placeEntries(intent, pinnedDocument);
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
