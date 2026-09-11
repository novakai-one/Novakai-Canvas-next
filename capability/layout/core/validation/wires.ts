import type { VisualSection, VisualWire } from '../../contract/records/input.js';
import type { SectionCandidate } from '../../contract/records/candidate.js';
import type { PlacedNode, RoutedWire, Box } from '../../contract/records/geometry.js';
import type { LayoutOptions, SupplementalMeasurements } from '../../contract/types.js';
import { endpoints } from '../routing/endpoints.js';
import { contentBoxes } from '../routing/obstacles.js';
import { validRoute, checkLabel, markerBox } from '../routing/checks.js';
import { linePath, curvePath, segments } from '../routing/paths.js';
import { adjacentLabel } from '../routing/labels.js';
import { segmentHits } from '../geometry/intersections.js';
import { sameIds, same } from './facts.js';
import { reject } from './outcomes.js';
interface Context {
  readonly nodes: readonly PlacedNode[];
  readonly options: LayoutOptions;
  readonly metrics: SupplementalMeasurements;
  readonly candidates: SectionCandidate['wires'];
}
/** Reconstruct only authoritative wire data after exact attachment/route/label validation. */
function rebind(wire: VisualWire, context: Context): RoutedWire {
  const candidate = context.candidates.find((item) => item.id === wire.id);
  if (!candidate) return reject('invalid-input', wire.id, 'Candidate wire is missing');
  const attachments = endpoints(wire, context.nodes);
  same(attachments, { source: candidate.source, target: candidate.target }, wire.id);
  same(wire.label, candidate.measuredLabel, wire.id);
  same(
    [wire.sourceMarker, wire.targetMarker, wire.style],
    [candidate.sourceMarker, candidate.targetMarker, candidate.style],
    wire.id,
  );
  checkGeometry(wire, candidate, context);
  return { ...candidate, ...attachments, measuredLabel: wire.label };
}
/** Native output has no special authority: inspect the corridor, exact path syntax, manual lock and label independently. */
function checkGeometry(
  wire: VisualWire,
  candidate: SectionCandidate['wires'][number],
  context: Context,
): void {
  const obstacles = contentBoxes(context.nodes);
  if (
    !validRoute(
      candidate.points,
      candidate.source,
      candidate.target,
      obstacles,
      wire,
      context.metrics,
    )
  )
    reject(
      'constraint-conflict',
      wire.id,
      'Candidate route violates a port, marker extent or content obstacle',
    );
  const path =
    wire.route.route === 'curve'
      ? curvePath(candidate.points, context.options.routeClearance / 2, [
          ...obstacles,
          ...context.candidates.map((item) => item.labelBox),
        ])
      : linePath(candidate.points);
  same(path, candidate.path, wire.id);
  checkManual(wire, candidate);
  checkLabels(wire, candidate, context);
}
/** Every authored point in a locked route remains part of the stored corridor. */
function checkManual(wire: VisualWire, candidate: SectionCandidate['wires'][number]): void {
  if (!wire.route.locked) return;
  if (wire.route.manual !== undefined) same(wire.route.manual, candidate.points, wire.id);
}
/** Labels stay adjacent to a real segment and clear of content, other labels and both endpoint markers. */
function checkLabels(
  wire: VisualWire,
  candidate: SectionCandidate['wires'][number],
  context: Context,
): void {
  const others = context.candidates.filter((item) => item.id !== wire.id);
  const markers = context.candidates.flatMap((item) => markerBounds(item, context.metrics));
  const occupied = [
    ...contentBoxes(context.nodes),
    ...others.map((item) => item.labelBox),
    ...markers,
  ];
  checkLabel(candidate.labelBox, wire, occupied);
  if (!adjacentLabel(candidate.labelBox, candidate.points, wire.label, context.options.labelGap))
    reject('constraint-conflict', wire.id, 'Wire has no label segment');
  others.forEach((other) => checkLabelCrossing(wire.id, candidate.labelBox, other.points));
}
/** Every candidate marker reserves its owner-supplied dimensions near the checked endpoint. */
function markerBounds(
  wire: SectionCandidate['wires'][number],
  metrics: SupplementalMeasurements,
): readonly Box[] {
  return [
    markerBox(wire.source, metrics.markers[wire.sourceMarker]),
    markerBox(wire.target, metrics.markers[wire.targetMarker]),
  ];
}
/** A later connection may cross another wire, but may never strike through its label. */
function checkLabelCrossing(id: string, box: Box, points: RoutedWire['points']): void {
  if (segments(points).some((segment) => segmentHits(segment.a, segment.b, box)))
    reject('constraint-conflict', id, 'Another wire crosses this label');
}
/** Wire cardinality and every measured payload are checked before renderer-ready records are returned. */
export function inspectWires(
  source: VisualSection,
  candidates: SectionCandidate['wires'],
  nodes: readonly PlacedNode[],
  metrics: SupplementalMeasurements,
  options: LayoutOptions,
): readonly RoutedWire[] {
  sameIds(
    source.wires.map((wire) => wire.id),
    candidates.map((wire) => wire.id),
    source.id,
  );
  const context: Context = { candidates, nodes, metrics, options };
  return source.wires.map((wire) => rebind(wire, context));
}
