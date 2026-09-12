import type { ComponentType, ReactElement } from 'react';
import type {
  ReactBindings,
  MeasuredContent,
  MarkerKind,
  Paint,
} from '@novakai/canvas-presentation';
import type {
  Point,
  PlacedNode,
  PlacedSection,
  SequenceGeometry,
  RoutedWire,
} from '@novakai/canvas-layout';
import type { Result } from './errors.js';
import type { RenderInput } from './ports/formats.js';
import type { Encoding } from './ports/encoding.js';
import type { Resource } from './records/bundle.js';
export type {
  ReactBindings,
  MeasuredContent,
  MarkerKind,
  Paint,
  Point,
  PlacedNode,
  PlacedSection,
  SequenceGeometry,
  RoutedWire,
};
/** Rendering collaborators receive admitted geometry; no adapter may invent domain notation or layout. */
export interface SceneRenderer {
  render(input: RenderInput): Result<string>;
}
export interface DrawingSlots {
  readonly node: (node: PlacedNode) => ReactElement;
  readonly wire: (wire: RoutedWire, paint: Paint) => ReactElement;
  readonly sequence: (geometry: SequenceGeometry, paint: Paint) => ReactElement;
  readonly label: (content: MeasuredContent, point: Point) => ReactElement;
}
export interface MarkerPlacement {
  readonly kind: MarkerKind;
  readonly points: readonly Point[];
  readonly at: 'source' | 'target';
  readonly paint: Paint;
}
export type MarkerDrawing = ComponentType<MarkerPlacement>;
export interface NativeFont {
  readonly alias: string;
  readonly family: string;
  readonly bytes: Uint8Array;
}
export interface FontDecoder {
  decode(): Promise<Result<readonly NativeFont[]>>;
}
export interface MediaConverter {
  convert(resources: readonly Resource[]): Promise<Result<ReadonlyMap<string, string>>>;
}
export interface RenderDependencies {
  readonly renderer: SceneRenderer;
  readonly encoding: Encoding;
}
