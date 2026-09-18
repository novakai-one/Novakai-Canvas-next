/** Layout public boundary: consumers never import its geometry policies or concrete native adapters. */
export { createLayout } from './api.js';
export {
  composeLayout,
  routeModuleSection,
  prepareLayoutRuntime,
  previewModuleCollection,
} from './compose.js';
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

export { nestedEngineVersions } from './records/engines.js';
export type { EngineScene, MeasuredBlock, EngineWirePath } from './records/engine-scene.js';
