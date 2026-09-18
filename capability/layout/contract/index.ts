export type {
  PrototypeNode,
  PrototypeNodePort,
  PrototypePortLocation,
  PrototypePortSide,
  PrototypeLayoutMeasure,
  PrototypeLayoutStage,
  PrototypeLayoutOptions,
} from './records/road-prototype.js';
/** Layout public boundary: consumers never import its geometry policies or concrete native adapters. */
export { createLayout } from './api.js';
export {
  createRoadPrototypeScene,
  inspectRoadTravel,
  auditRoadCoverage,
  readPrototypeNodePorts,
} from './api.js';
export type { PrototypeCrossingExample, PrototypeRoadCoverage } from './records/road-prototype.js';
export type {
  PrototypeLane,
  PrototypeJunction,
  PrototypeDivider,
  PrototypeTravel,
  PrototypeTravelResult,
  PrototypePoint,
  PrototypeLaneConnection,
} from './records/road-prototype.js';
export type {
  RoadPrototypeScene,
  PrototypeRoad,
  PrototypeBlock,
  PrototypeBounds,
} from './records/road-prototype.js';
export { composeLayout } from './compose.js';
export type { LayoutOwners } from './compose.js';
export { options } from './types.js';
export type {
  Layout,
  Dependencies,
  LayoutRequest,
  RouteRequest,
  InspectionRequest,
  Inspection,
  LayoutOptions,
  SupplementalMeasurements,
} from './types.js';
export type { Result, Diagnostic, ErrorCode } from './errors.js';
export type { ProjectionReader } from './ports/projection.js';
export type { PlacementPort } from './ports/placement.js';
export type { SolverPort } from './ports/solver.js';
export type { RoutingPort } from './ports/routing.js';
export type { Job, JobControl } from './ports/scheduling.js';
export type {
  Scene,
  PlacedSection,
  PlacedNode,
  RoutedWire,
  SequenceGeometry,
  SequenceEvent,
  FragmentFrame,
  Activation,
  Lifeline,
  Point,
  Box,
  Side,
  ResolvedEndpoint,
  Warning,
  Adjustment,
} from './records/geometry.js';
export type {
  Projection,
  VisualNode,
  VisualWire,
  VisualSection,
  VisualSequenceItem,
  MeasuredContent,
  MarkerKind,
  LayoutIntent,
  Placement,
} from './records/input.js';
export type {
  PlacementProblem,
  PlacementValue,
  SolverProblem,
  SolverValue,
  RoutingProblem,
  RouteValue,
  Connection,
  Obstacle,
} from './records/problem.js';
export { toCollection, toSection, toParent } from './api.js';

export { readScene } from './api.js';
export type { SceneReaderOwners } from './types.js';

export { defaultEngineVersions } from './records/engines.js';

export type { LayoutInputKey } from './brands.js';
export { inputKey as layoutInputKey } from './brands.js';

export { createSevenRoadScene } from './api.js';

export { createRoadProofs } from './api.js';
export type { PrototypeRoadProof, PrototypeProofPath } from './records/road-proof.js';

export { createNestedRoadScene } from './api.js';

export type { NestedWire, NestedWireSegment, NestedWireResult } from './records/nested-wires.js';
export { inspectNestedWires } from './api.js';

export { defaultNestedSceneSpec, fanInHubSceneSpec } from './api.js';
export { preflightNestedSupports } from './api.js';
export type {
  NestedSupportRequest,
  NestedSupportResult,
  NestedSupportLedger,
  NestedSupportFailure,
} from './records/nested-support.js';
export type {
  NestedSceneSpec,
  NestedSectionSpec,
  NestedNodeSpec,
} from './records/nested-scene-spec.js';

export { embedNestedSupports } from './api.js';
