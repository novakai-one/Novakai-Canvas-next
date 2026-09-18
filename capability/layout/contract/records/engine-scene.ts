import type { VisualSection } from './input.js';
import type { Box, Point, PlacedNode, PlacedSection } from './geometry.js';
import type { PrototypeNodePort, PrototypeRoad, PrototypeLayoutMeasure } from './road-prototype.js';
import type { LayoutOptions, SupplementalMeasurements } from '../types.js';
export interface MeasuredBlock {
  readonly nodeId: string;
  readonly memberPorts: readonly PrototypeNodePort[];
  readonly bounds: Box;
}
export interface EngineWirePath {
  readonly wireId: string;
  readonly path: readonly Point[];
  readonly lanes: readonly string[];
}
export interface EngineScene {
  readonly blocks: readonly MeasuredBlock[];
  readonly nodes: readonly PlacedNode[];
  readonly wires: readonly EngineWirePath[];
  readonly roads: readonly PrototypeRoad[];
}
export interface NestedLayout {
  readonly version: string;
  section(
    source: VisualSection,
    metrics: SupplementalMeasurements,
    options: LayoutOptions,
    versions: readonly string[],
  ): PlacedSection;
  readonly measure?: PrototypeLayoutMeasure;
}
