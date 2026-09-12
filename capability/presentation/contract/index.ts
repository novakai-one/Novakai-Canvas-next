/** Presentation public boundary: measured scenes and stable React bindings; host owns recovery and layout. */
export { createPresentation } from './api.js';
export { composePresentation, createReactBindings } from './compose.js';
export type { Owners, ComposedPresentation } from './compose.js';
export type { Dependencies, Presentation, TextRequest, SupplementalMeasurements } from './types.js';
export type { Result, Diagnostic, ErrorCode } from './errors.js';
export type { DomainReader } from './ports/domain.js';
export type { ThemeResolver, AssetReader } from './ports/resources.js';
export type { MeasurementPort, TextMetrics } from './ports/measurement.js';
export type { RenderPort } from './ports/rendering.js';
export type {
  InputCollection,
  DiagramObject,
  ContentBlock,
  Endpoint,
  Relationship,
  Appearance,
  Group,
  Section,
  SequenceItem,
  Placement,
  LayoutIntent,
} from './records/input.js';
export {
  resolvedStyle,
  fontSet,
  fontSource,
  fontRef,
  paint,
  visualAsset,
} from './records/style.js';
export type {
  TextMetric,
  DiagramTypography,
  SizeBand,
  ContentSizing,
  ResolvedStyle,
  FontSet,
  FontSource,
  FontRef,
  Paint,
  VisualAsset,
} from './records/style.js';
export { visualNode, markerKind, content, shape } from './records/visual.js';
export type {
  VisualNode,
  VisualWire,
  VisualSection,
  VisualEndpoint,
  VisualSequenceItem,
  Projection,
  MeasuredContent,
  Primitive,
  TextRun,
  Anchor,
  MarkerKind,
  Shape,
} from './records/visual.js';
export type {
  ReactBindings,
  NodeContentProps,
  MeasuredContentProps,
  ContentBlocksProps,
  MarkerProps,
  FontDefinitionsProps,
  StaticRenderer,
} from './react-types.js';

export { readMeasuredProjection, readMeasuredContent } from './api.js';

export { readSupplementalMeasurements } from './api.js';
