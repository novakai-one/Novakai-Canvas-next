/** Scene-out translation: one engine scene becomes one legacy-inspectable modules section.
 * Node bounds come from the measured projection at engine positions; every wire endpoint snaps
 * to the exact legacy member port, so engine pin offsets never leak into the Scene. Any
 * engine-reported or reconstructed invalidity raises a structured fault and the pipeline
 * keeps the legacy derivation for that section.
 */
import type { VisualSection, VisualWire } from '../contract/records/input.js';
import type {
  Box,
  PlacedSection,
  Point,
  ResolvedEndpoint,
  RoutedWire,
} from '../contract/records/geometry.js';
import type { EngineSceneMap, NestedEngine } from '../contract/records/engine-scene.js';
import type { RoadPrototypeScene } from '../contract/records/road-prototype.js';
import type { NestedWire } from '../contract/records/nested-wires.js';
import type {
  DerivationContext,
  LayoutOptions,
  SupplementalMeasurements,
} from '../contract/types.js';
import { nodeSize, translateNested } from './scene-in.js';
import { nestedLanePitch } from './prototype-nested-placement.js';
import type { Attachments } from './routing/endpoints.js';
import { approach, endpoints } from './routing/endpoints.js';
import { contentBoxes, labelObstacles } from './routing/obstacles.js';
import { markerBox } from './routing/checks.js';
import { labelBox } from './routing/labels.js';
import { curvePath, linePath, segments } from './routing/paths.js';
import { sequenceGeometry } from './sequence/sequence.js';
import { contentBounds, sectionBounds, titleBox } from './arrangement/bounds.js';
import { sectionKey, versions } from './arrangement/keys.js';
import { inspectSection } from './validation/sections.js';
import { union } from './geometry/bounds.js';
import { reject } from './validation/outcomes.js';

/** One resolved wire end plus its deterministic lane rank on that node side. */
interface Terminal {
  readonly endpoint: ResolvedEndpoint;
  readonly advance: number;
  readonly rank: number;
}
/** Per-wire terminal ranks on the resolved source and target sides. */
type Ranks = Record<'source' | 'target', number>;
/** A translated engine route carrying its authoritative source wire and resolved endpoints. */
interface Built {
  readonly wire: VisualWire;
  readonly source: ResolvedEndpoint;
  readonly target: ResolvedEndpoint;
  readonly points: readonly Point[];
}
/** Indexed engine responses align exactly with the request; a gap is an engine fault. */
function at<T>(items: readonly T[], index: number, id: string): T {
  const item = items[index];
  if (item === undefined)
    return reject('engine-failed', id, 'Nested engine response is misaligned');
  return item;
}
/** Engine identities carry the spec number by the in-repo placement contract: `node-N` / `section-M`. */
function engineNumber(id: string, prefix: 'node-' | 'section-'): number {
  const number = Number(id.slice(prefix.length));
  if (!Number.isInteger(number) || number < 1)
    return reject('engine-failed', id, 'Nested engine returned an unknown identity');
  return number;
}
function requiredBox(boxes: ReadonlyMap<string, Box>, id: string): Box {
  const box = boxes.get(id);
  if (box === undefined) return reject('engine-failed', id, 'Nested engine omitted a node box');
  return box;
}
/** Plain node bounds: engine position, measured projection size; cardinality is checked exactly. */
function plainBoxes(
  source: VisualSection,
  map: EngineSceneMap,
  scene: RoadPrototypeScene,
): Map<string, Box> {
  const plain = source.nodes.filter((node) => node.groupId === null);
  if (scene.nodes.length !== plain.length || scene.sections.length !== map.containers.length)
    return reject('engine-failed', source.id, 'Nested engine scene cardinality differs from spec');
  const boxes = new Map<string, Box>();
  scene.nodes.forEach((node) => {
    const visual = source.nodes.find(
      (item) => item.id === map.nodes[engineNumber(node.id, 'node-') - 1],
    );
    if (visual === undefined)
      return reject('engine-failed', source.id, 'Nested engine returned an unmapped node');
    boxes.set(visual.id, { x: node.bounds.x, y: node.bounds.y, ...nodeSize(visual) });
  });
  return boxes;
}
/** Container ancestry depth drives bottom-up box derivation; parents resolve at input admission. */
function depth(source: VisualSection, node: VisualSection['nodes'][number]): number {
  const parent = source.nodes.find((item) => item.id === node.parent);
  return parent === undefined ? 0 : 1 + depth(source, parent);
}
/** Container boxes wrap placed children with the app header and padding, growing only right/down. */
function containerBox(
  source: VisualSection,
  map: EngineSceneMap,
  scene: RoadPrototypeScene,
  boxes: ReadonlyMap<string, Box>,
  node: VisualSection['nodes'][number],
  padding: number,
): Box {
  const children = source.nodes.filter((item) => item.parent === node.id);
  if (children.length > 0) {
    const content = union(children.map((child) => requiredBox(boxes, child.id)));
    return {
      x: content.x - padding,
      y: content.y - node.headerHeight - padding,
      width: Math.max(content.width + padding * 2, node.width),
      height: Math.max(content.height + node.headerHeight + padding * 2, node.height),
    };
  }
  const section = scene.sections.find(
    (item) => item.id === `section-${map.containers.findIndex((id) => id === node.id) + 1}`,
  );
  if (section === undefined)
    return reject('engine-failed', node.id, 'Nested engine omitted a container section');
  return {
    x: section.bounds.x,
    y: section.bounds.y,
    width: Math.max(section.bounds.width, node.width),
    height: Math.max(section.bounds.height, node.height),
  };
}
function containerBoxes(
  source: VisualSection,
  map: EngineSceneMap,
  scene: RoadPrototypeScene,
  boxes: Map<string, Box>,
  padding: number,
): void {
  source.nodes
    .filter((node) => node.groupId !== null)
    .toSorted((a, b) => depth(source, b) - depth(source, a))
    .forEach((node) => boxes.set(node.id, containerBox(source, map, scene, boxes, node, padding)));
}

/** Drive corridors delimit the replaceable terminal stubs; the road interior is retained verbatim. */
function cut(wire: NestedWire, pointCount: number): { readonly from: number; readonly to: number } {
  const corridors = wire.segments.map((segment) => segment.corridorId);
  const first = corridors.findIndex((id) => id !== `drive:${wire.sourcePortId}`);
  const from = first === -1 ? corridors.length : first;
  const last = corridors.findLastIndex((id) => id !== `drive:${wire.targetPortId}`);
  const tail = Math.min(corridors.length - 1 - last, corridors.length - from);
  const to = pointCount - 1 - tail;
  if (from > to) return reject('engine-failed', wire.id, 'Nested engine wire terminals overlap');
  return { from, to };
}
/** The stub departs along the resolved side beyond the marker, then meets the engine driveway lane. */
function stub(terminal: Terminal, mouth: Point, inward: boolean): readonly Point[] {
  const a = approach(terminal.endpoint, terminal.advance + (terminal.rank + 1) * nestedLanePitch);
  const b =
    terminal.endpoint.side === 'left' || terminal.endpoint.side === 'right'
      ? { x: a.x, y: mouth.y }
      : { x: mouth.x, y: a.y };
  return inward ? [b, a, terminal.endpoint.point] : [terminal.endpoint.point, a, b];
}
/** Seam points coincide by construction; exact duplicates never become zero-length segments. */
function dedupe(points: readonly Point[]): readonly Point[] {
  return points.filter((point, index) => {
    const prior = points[index - 1];
    return prior === undefined || prior.x !== point.x || prior.y !== point.y;
  });
}
/** Snap one engine route: retained road interior plus exact member-port terminal stubs. */
function buildWire(
  wire: VisualWire,
  engineWire: NestedWire,
  order: ReadonlyMap<string, number>,
  pair: Attachments,
  ranks: Ranks,
  metrics: SupplementalMeasurements,
  origin: Point,
): Built {
  if (
    engineWire.from !== `node-${String(order.get(wire.source.node))}` ||
    engineWire.to !== `node-${String(order.get(wire.target.node))}`
  )
    return reject('engine-failed', wire.id, 'Nested engine wire order differs from request');
  const local = engineWire.segments
    .flatMap((segment, index) => (index === 0 ? [segment.from, segment.to] : [segment.to]))
    .map((point) => ({ x: point.x - origin.x, y: point.y - origin.y }));
  if (local.length < 2) return reject('engine-failed', wire.id, 'Nested engine wire has no path');
  const { from, to } = cut(engineWire, local.length);
  const terminal = (end: 'source' | 'target'): Terminal => ({
    endpoint: pair[end],
    advance: metrics.markers[end === 'source' ? wire.sourceMarker : wire.targetMarker].advance,
    rank: ranks[end],
  });
  return {
    wire,
    source: pair.source,
    target: pair.target,
    points: dedupe([
      ...stub(terminal('source'), at(local, from, wire.id), false),
      ...local.slice(from, to + 1),
      ...stub(terminal('target'), at(local, to, wire.id), true),
    ]),
  };
}
/** Exact segment footprints reserve route space for labels, mirroring the legacy reservation. */
function routeBoxes(points: readonly Point[]): readonly Box[] {
  return segments(points).map((segment): Box => ({
    x: Math.min(segment.a.x, segment.b.x),
    y: Math.min(segment.a.y, segment.b.y),
    width: Math.abs(segment.a.x - segment.b.x),
    height: Math.abs(segment.a.y - segment.b.y),
  }));
}
/** Routed wires recompute their exact legacy path syntax around the final label obstacles. */
function routedWires(
  source: VisualSection,
  map: EngineSceneMap,
  engineWires: readonly NestedWire[],
  placed: PlacedSection['nodes'],
  metrics: SupplementalMeasurements,
  options: LayoutOptions,
  origin: Point,
): readonly RoutedWire[] {
  const attachments = source.wires.map((wire) => endpoints(wire, placed));
  const count = new Map<string, number>();
  const ranks = attachments.map((pair): Ranks => {
    const rank = (endpoint: ResolvedEndpoint): number => {
      const key = JSON.stringify([endpoint.node, endpoint.side]);
      const next = count.get(key) ?? 0;
      count.set(key, next + 1);
      return next;
    };
    return { source: rank(pair.source), target: rank(pair.target) };
  });
  const order: ReadonlyMap<string, number> = new Map(map.nodes.map((id, index) => [id, index + 1]));
  const built = source.wires.map((wire, index) =>
    buildWire(
      wire,
      at(engineWires, index, wire.id),
      order,
      at(attachments, index, wire.id),
      at(ranks, index, wire.id),
      metrics,
      origin,
    ),
  );
  const fixed = [
    ...labelObstacles(placed),
    ...built.flatMap((item) => [
      markerBox(item.source, metrics.markers[item.wire.sourceMarker]),
      markerBox(item.target, metrics.markers[item.wire.targetMarker]),
    ]),
    ...built.flatMap((item) => routeBoxes(item.points)),
  ];
  const labels: Box[] = [];
  built.forEach((item) => {
    const box = labelBox(item.points, item.wire.label, [...fixed, ...labels], options.labelGap);
    if (box === null)
      return reject('constraint-conflict', item.wire.id, 'Nested route has no clear label space', [
        item.wire.id,
      ]);
    labels.push(box);
  });
  const obstacles = [...contentBoxes(placed), ...labels];
  return built.map((item, index) => ({
    id: item.wire.id,
    source: item.source,
    target: item.target,
    points: item.points,
    path:
      item.wire.route.route === 'curve'
        ? curvePath(item.points, options.routeClearance / 2, obstacles)
        : linePath(item.points),
    labelBox: at(labels, index, item.wire.id),
    measuredLabel: item.wire.label,
    appearance: item.wire.appearance,
    sourceMarker: item.wire.sourceMarker,
    targetMarker: item.wire.targetMarker,
    style: item.wire.style,
  }));
}

/** Rebuild one section from engine output and prove it against the independent legacy inspector. */
function sceneOut(
  source: VisualSection,
  map: EngineSceneMap,
  scene: RoadPrototypeScene,
  metrics: SupplementalMeasurements,
  context: DerivationContext,
): PlacedSection {
  const wiring = scene.wiring;
  if (scene.embeddingFailure !== undefined || wiring === undefined || !wiring.ok)
    return reject('engine-failed', source.id, 'Nested engine could not route the section');
  if (wiring.value.length !== source.wires.length)
    return reject('engine-failed', source.id, 'Nested engine returned a partial wire set');
  const boxes = plainBoxes(source, map, scene);
  containerBoxes(source, map, scene, boxes, context.options.padding);
  const all = source.nodes.map((node) => requiredBox(boxes, node.id));
  const origin = {
    x: Math.min(...all.map((box) => box.x)),
    y: Math.min(...all.map((box) => box.y)),
  };
  /** Local coordinates anchor the outermost content corner at the origin, like a fresh derivation. */
  const nodes = source.nodes.map((node) => {
    const box = requiredBox(boxes, node.id);
    return {
      id: node.id,
      parent: node.parent,
      sectionId: node.sectionId,
      measured: node,
      box: { x: box.x - origin.x, y: box.y - origin.y, width: box.width, height: box.height },
    };
  });
  const wires = routedWires(source, map, wiring.value, nodes, metrics, context.options, origin);
  const sequence = sequenceGeometry(source, nodes, metrics, context.options);
  const content = contentBounds(nodes, wires, sequence);
  const title = {
    content: source.title,
    box: titleBox(content, source.title, context.options.padding),
  };
  return inspectSection(
    source,
    {
      id: source.id,
      origin: { x: 0, y: 0 },
      box: sectionBounds(content, title.box, context.options.padding),
      title,
      inputKey: sectionKey(source, metrics, context.options, versions(context.dependencies)),
      nodes,
      wires,
      sequence,
    },
    { options: context.options, measurements: metrics, engines: versions(context.dependencies) },
  );
}
/** Translate, derive and rebind one section; any structured fault is the caller's fallback signal. */
export function deriveNestedSection(
  source: VisualSection,
  engine: NestedEngine,
  metrics: SupplementalMeasurements,
  context: DerivationContext,
): PlacedSection {
  const { request, map } = translateNested(source);
  return sceneOut(source, map, engine.arrange(request), metrics, context);
}
