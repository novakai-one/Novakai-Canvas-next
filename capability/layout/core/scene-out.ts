import type { EngineScene } from '../contract/records/engine-scene.js';
import type { VisualSection, VisualWire, Projection } from '../contract/records/input.js';
import type { Box, Point, PlacedSection, RoutedWire } from '../contract/records/geometry.js';
import type { LayoutOptions, SupplementalMeasurements } from '../contract/types.js';
import { endpoints } from './routing/endpoints.js';
import { labelBox } from './routing/labels.js';
import { linePath, curvePath, segments } from './routing/paths.js';
import { contentBoxes } from './routing/obstacles.js';
import { markerBox } from './routing/checks.js';
import { contentBounds, titleBox, sectionBounds } from './arrangement/bounds.js';
import { sectionKey } from './arrangement/keys.js';
import { pointBounds } from './geometry/bounds.js';
import { reject } from './validation/outcomes.js';

/** Preserve every custom road bend; only redundant identical points are removed. */
function points(engine: EngineScene, id: string): readonly Point[] {
  const path = engine.wires.find((w) => w.wireId === id)?.path;
  if (path === undefined) return reject('engine-failed', id, 'Custom engine omitted wire');
  return path.filter((p, i) => p.x !== path[i - 1]?.x || p.y !== path[i - 1]?.y);
}
function routeObstacles(engine: EngineScene): readonly Box[] {
  return engine.wires.flatMap((wire) => segments(wire.path).map((s) => pointBounds([s.a, s.b])));
}
function markerObstacles(
  source: VisualSection,
  engine: EngineScene,
  metrics: SupplementalMeasurements,
): readonly Box[] {
  return source.wires.flatMap((wire) => {
    const ends = endpoints(wire, engine.nodes);
    return [
      markerBox(ends.source, metrics.markers[wire.sourceMarker]),
      markerBox(ends.target, metrics.markers[wire.targetMarker]),
    ];
  });
}
function labeled(
  wire: VisualWire,
  engine: EngineScene,
  occupied: readonly Box[],
  options: LayoutOptions,
): RoutedWire {
  const path = points(engine, wire.id);
  const label = labelBox(path, wire.label, occupied, options.labelGap);
  if (label === null)
    return reject('constraint-conflict', wire.id, 'No clear label position on custom roads');
  return {
    id: wire.id,
    ...endpoints(wire, engine.nodes),
    points: path,
    path: linePath(path),
    labelBox: label,
    measuredLabel: wire.label,
    appearance: wire.appearance,
    sourceMarker: wire.sourceMarker,
    targetMarker: wire.targetMarker,
    style: wire.style,
  };
}
function paths(
  source: VisualSection,
  engine: EngineScene,
  metrics: SupplementalMeasurements,
  options: LayoutOptions,
): readonly RoutedWire[] {
  const obstacles = [
    ...contentBoxes(engine.nodes),
    ...routeObstacles(engine),
    ...markerObstacles(source, engine, metrics),
  ];
  const wires = source.wires.reduce<readonly RoutedWire[]>(
    (done, wire) => [
      ...done,
      labeled(wire, engine, [...obstacles, ...done.map((w) => w.labelBox)], options),
    ],
    [],
  );
  const curves = [...contentBoxes(engine.nodes), ...wires.map((w) => w.labelBox)];
  return wires.map((wire, i) =>
    source.wires[i]?.route.route === 'curve'
      ? { ...wire, path: curvePath(wire.points, options.routeClearance / 2, curves) }
      : wire,
  );
}
/** Return the app's existing measured Scene records; no native placer, solver or router is invoked. */
export function toAppSection(
  engine: EngineScene,
  source: VisualSection,
  metrics: SupplementalMeasurements,
  options: LayoutOptions,
  versions: readonly string[],
): PlacedSection {
  const wires = paths(source, engine, metrics, options);
  const sequence = {
    lifelines: [],
    events: [],
    fragments: [],
    activations: [],
    source: source.sequence,
  };
  const content = contentBounds(engine.nodes, wires, sequence);
  const title = { content: source.title, box: titleBox(content, source.title, options.padding) };
  return {
    id: source.id,
    origin: { x: 0, y: 0 },
    box: sectionBounds(content, title.box, options.padding),
    title,
    nodes: engine.nodes,
    wires,
    sequence,
    inputKey: sectionKey(source, metrics, options, versions),
  };
}
/** Collection packing only translates section origins; all custom node and wire geometry stays intact. */
export function placeAppSections(
  sections: readonly PlacedSection[],
  projection: Projection,
  options: LayoutOptions,
): readonly PlacedSection[] {
  const gap = options.gap[projection.arrangement.gap];
  const columns =
    projection.arrangement.columns ?? Math.max(1, Math.ceil(Math.sqrt(sections.length)));
  const rows = Array.from({ length: Math.ceil(sections.length / columns) }, (_, i) =>
    sections.slice(i * columns, (i + 1) * columns),
  );
  let y = 0;
  return rows.flatMap((row) => {
    let x = 0;
    const placed = row.map((section) => {
      const authored = projection.sections.find((s) => s.id === section.id)?.placement;
      const origin = authored ?? { x: x - section.box.x, y: y - section.box.y };
      x += section.box.width + gap;
      return {
        ...section,
        origin: { x: origin.x, y: origin.y },
        box: { ...section.box, x: section.box.x + origin.x, y: section.box.y + origin.y },
      };
    });
    y += Math.max(...row.map((s) => s.box.height)) + gap;
    return placed;
  });
}
