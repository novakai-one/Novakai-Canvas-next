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
import type { Attachments } from './routing/endpoints.js';
import { approach, endpoints } from './routing/endpoints.js';
import { contentBoxes, labelObstacles } from './routing/obstacles.js';
import { markerBox } from './routing/checks.js';
import { labelBox } from './routing/labels.js';
import { clear, curvePath, linePath, segments } from './routing/paths.js';
import { sequenceGeometry } from './sequence/sequence.js';
import { contentBounds, sectionBounds, titleBox } from './arrangement/bounds.js';
import { sectionKey, versions } from './arrangement/keys.js';
import { inspectSection } from './validation/sections.js';
import { union } from './geometry/bounds.js';
import { segmentHits } from './geometry/intersections.js';
import { reject } from './validation/outcomes.js';

/** One resolved wire end plus its assigned stub length and lane on that node side. */
interface Terminal {
  readonly endpoint: ResolvedEndpoint;
  readonly distance: number;
  readonly lane: number;
}
/** Terminal stub lanes reuse the engine's lane pitch value; the engine entry-point boundary forbids importing it. */
const stubLanePitch = 6;
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
/** A bypass leaves the node band on the near side, travels outside it, and rejoins the driveway channel. */
function bypasses(
  point: Point,
  a: Point,
  mouth: Point,
  node: Box,
  lane: number,
  across: 'x' | 'y',
): readonly (readonly Point[])[] {
  return [1, 2, 3].flatMap((step) => {
    const offset = stubLanePitch * (lane + step);
    const before = across === 'y' ? node.y - offset : node.x - offset;
    const after = across === 'y' ? node.y + node.height + offset : node.x + node.width + offset;
    return [before, after].map((band) =>
      across === 'y'
        ? [point, a, { x: a.x, y: band }, { x: mouth.x, y: band }, mouth]
        : [point, a, { x: band, y: a.y }, { x: band, y: mouth.y }, mouth],
    );
  });
}
/** One lateral path extends the stub to a clear coordinate before joining the mouth band. */
function lateralPath(point: Point, q: number, mouth: Point, horizontal: boolean): readonly Point[] {
  return horizontal
    ? [point, { x: q, y: point.y }, { x: q, y: mouth.y }, mouth]
    : [point, { x: point.x, y: q }, { x: mouth.x, y: q }, mouth];
}
/** Lateral candidates extend the stub past a blocking obstacle edge, nearest first. */
function laterals(
  terminal: Terminal,
  mouth: Point,
  obstacles: readonly Box[],
): readonly (readonly Point[])[] {
  const point = terminal.endpoint.point;
  const horizontal = terminal.endpoint.side === 'left' || terminal.endpoint.side === 'right';
  const outward = terminal.endpoint.side === 'right' || terminal.endpoint.side === 'bottom';
  const offset = stubLanePitch * (terminal.lane + 1);
  const edges = obstacles.flatMap((box) =>
    horizontal
      ? [box.x - offset, box.x + box.width + offset]
      : [box.y - offset, box.y + box.height + offset],
  );
  const axis = horizontal ? point.x : point.y;
  return edges
    .filter((q) => (outward ? q - axis >= terminal.distance : axis - q >= terminal.distance))
    .filter((q, index, all) => all.indexOf(q) === index)
    .toSorted((a, b) => Math.abs(a - axis) - Math.abs(b - axis))
    .map((q) => lateralPath(point, q, mouth, horizontal));
}
/** Direct comb plus lane-offset bypasses around the terminal node, cheapest first. */
function candidates(
  terminal: Terminal,
  mouth: Point,
  node: Box,
  obstacles: readonly Box[],
): readonly (readonly Point[])[] {
  const point = terminal.endpoint.point;
  const a = approach(terminal.endpoint, terminal.distance);
  const across =
    terminal.endpoint.side === 'left' || terminal.endpoint.side === 'right' ? 'y' : 'x';
  const direct =
    across === 'y'
      ? [point, a, { x: a.x, y: mouth.y }, mouth]
      : [point, a, { x: mouth.x, y: a.y }, mouth];
  return [
    direct,
    ...bypasses(point, a, mouth, node, terminal.lane, across),
    ...laterals(terminal, mouth, obstacles),
  ];
}
/** Perimeter walks hug the node's own edges at a lane offset; ending exactly on the edge is legal. */
function walks(terminal: Terminal, end: Point, node: Box): readonly (readonly Point[])[] {
  const point = terminal.endpoint.point;
  const a = approach(terminal.endpoint, terminal.distance);
  const offset = stubLanePitch * (terminal.lane + 1);
  if (terminal.endpoint.side === 'left' || terminal.endpoint.side === 'right')
    return [node.y - offset, node.y + node.height + offset].map((band) => [
      point,
      a,
      { x: a.x, y: band },
      { x: end.x, y: band },
      end,
    ]);
  return [node.x - offset, node.x + node.width + offset].map((band) => [
    point,
    a,
    { x: band, y: a.y },
    { x: band, y: end.y },
    end,
  ]);
}
/** One terminal attachment strategy: the stub points and the engine polyline index they join. */
interface HeadChoice {
  readonly points: readonly Point[];
  readonly join: number;
}
/** Comb candidates join at the driveway mouth; walk candidates keep the engine terminal whole. */
function chooseHead(
  terminal: Terminal,
  local: readonly Point[],
  join: number,
  end: Point,
  endJoin: number,
  nodes: PlacedSection['nodes'],
  obstacles: readonly Box[],
): HeadChoice {
  const node = nodes.find((item) => item.id === terminal.endpoint.node);
  if (node === undefined)
    return reject('engine-failed', terminal.endpoint.node, 'Nested terminal node is missing');
  const choices: readonly HeadChoice[] = [
    ...candidates(terminal, at(local, join, terminal.endpoint.node), node.box, obstacles).map(
      (points) => ({
        points,
        join,
      }),
    ),
    ...walks(terminal, end, node.box).map((points) => ({ points, join: endJoin })),
  ];
  const found = choices.find((choice) => clear(choice.points, obstacles));
  if (found === undefined)
    return reject(
      'constraint-conflict',
      terminal.endpoint.node,
      'Nested terminal cannot reach the engine road',
      [terminal.endpoint.node],
    );
  return found;
}
/** Seam points coincide by construction; exact duplicates never become zero-length segments. */
function dedupe(points: readonly Point[]): readonly Point[] {
  return points.filter((point, index) => {
    const prior = points[index - 1];
    return prior === undefined || prior.x !== point.x || prior.y !== point.y;
  });
}
/** Snap one engine route: retained road interior plus verified node-clear terminal stubs. */
function buildWire(
  wire: VisualWire,
  engineWire: NestedWire,
  order: ReadonlyMap<string, number>,
  pair: Attachments,
  terminals: { readonly source: Terminal; readonly target: Terminal },
  nodes: PlacedSection['nodes'],
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
  const obstacles = contentBoxes(nodes);
  const sourceHead = chooseHead(
    terminals.source,
    local,
    from,
    at(local, 0, wire.id),
    0,
    nodes,
    obstacles,
  );
  const targetHead = chooseHead(
    terminals.target,
    local,
    to,
    at(local, local.length - 1, wire.id),
    local.length - 1,
    nodes,
    obstacles,
  );
  return {
    wire,
    source: pair.source,
    target: pair.target,
    points: dedupe([
      ...sourceHead.points,
      ...local.slice(sourceHead.join + 1, targetHead.join),
      ...targetHead.points.toReversed(),
    ]),
  };
}
/** Exact segment footprints block a striking wire's corridor on label retry. */
function routeBoxes(points: readonly Point[]): readonly Box[] {
  return segments(points).map((segment): Box => ({
    x: Math.min(segment.a.x, segment.b.x),
    y: Math.min(segment.a.y, segment.b.y),
    width: Math.abs(segment.a.x - segment.b.x),
    height: Math.abs(segment.a.y - segment.b.y),
  }));
}
/** A wire strikes a label when one of its segments passes through the box. */
function strikes(item: Built, box: Box): boolean {
  return segments(item.points).some((segment) => segmentHits(segment.a, segment.b, box));
}
/** The inspector's exact candidate space; each retry blocks one distinct striker, so retries are finite. */
function placeLabel(
  item: Built,
  others: readonly Built[],
  occupied: readonly Box[],
  options: LayoutOptions,
): Box {
  const box = labelBox(item.points, item.wire.label, occupied, options.labelGap);
  if (box === null)
    return reject('constraint-conflict', item.wire.id, 'Nested route has no clear label space', [
      item.wire.id,
    ]);
  const striker = others.find((other) => strikes(other, box));
  if (striker === undefined) return box;
  return placeLabel(item, others, [...occupied, ...routeBoxes(striker.points)], options);
}
/** Stub lanes per resolved node side: the group base covers the largest marker advance, so lanes never collide. */
function planTerminals(
  source: VisualSection,
  attachments: readonly Attachments[],
  metrics: SupplementalMeasurements,
): readonly { readonly source: Terminal; readonly target: Terminal }[] {
  const groups = new Map<string, readonly number[]>();
  const keyOf = (endpoint: ResolvedEndpoint): string =>
    JSON.stringify([endpoint.node, endpoint.side]);
  const advance = (wire: VisualWire, end: 'source' | 'target'): number =>
    metrics.markers[end === 'source' ? wire.sourceMarker : wire.targetMarker].advance;
  source.wires.forEach((wire, index) => {
    const pair = at(attachments, index, wire.id);
    groups.set(keyOf(pair.source), [
      ...(groups.get(keyOf(pair.source)) ?? []),
      advance(wire, 'source'),
    ]);
    groups.set(keyOf(pair.target), [
      ...(groups.get(keyOf(pair.target)) ?? []),
      advance(wire, 'target'),
    ]);
  });
  const seen = new Map<string, number>();
  const terminal = (endpoint: ResolvedEndpoint): Terminal => {
    const key = keyOf(endpoint);
    const lane = seen.get(key) ?? 0;
    seen.set(key, lane + 1);
    return {
      endpoint,
      distance: Math.max(...(groups.get(key) ?? [0])) + (lane + 1) * stubLanePitch,
      lane,
    };
  };
  return source.wires.map((wire, index) => {
    const pair = at(attachments, index, wire.id);
    return { source: terminal(pair.source), target: terminal(pair.target) };
  });
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
  const terminals = planTerminals(source, attachments, metrics);
  const order: ReadonlyMap<string, number> = new Map(map.nodes.map((id, index) => [id, index + 1]));
  const built = source.wires.map((wire, index) =>
    buildWire(
      wire,
      at(engineWires, index, wire.id),
      order,
      at(attachments, index, wire.id),
      at(terminals, index, wire.id),
      placed,
      origin,
    ),
  );
  const fixed = [
    ...labelObstacles(placed),
    ...built.flatMap((item) => [
      markerBox(item.source, metrics.markers[item.wire.sourceMarker]),
      markerBox(item.target, metrics.markers[item.wire.targetMarker]),
    ]),
  ];
  const labels: Box[] = [];
  built.forEach((item) => {
    labels.push(
      placeLabel(
        item,
        built.filter((other) => other !== item),
        [...fixed, ...labels],
        options,
      ),
    );
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
