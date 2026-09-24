/*
 * Types shared by Export's drawing and native encoding adapters: the SVG scene renderer, its
 * drawing slots and markers, decoded fonts, PDF image conversion and render dependencies.
 * Drawing uses Presentation's notation and Layout's placed geometry; no adapter invents its own
 * notation or layout. Types only; nothing here runs.
 */
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
/** Presentation and Layout types re-exported for the adapters. */
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
/** Draws the selected part of a scene as one SVG document; the SVG, PNG, PDF and HTML outputs use it. */
export interface SceneRenderer {
  /**
   * Renders the selection.
   *
   * @param input - The checked render input.
   * @returns The SVG markup, or a failure. The built-in renderer turns a throw into
   * `encoding-failed`.
   */
  render(input: RenderInput): Result<string>;
}

/** The React drawing functions the scene renderer composes, one per kind of placed item. */
export interface DrawingSlots {
  /** Draws one placed node at its box. */
  readonly node: (node: PlacedNode) => ReactElement;

  /** Draws one routed wire with its markers. */
  readonly wire: (wire: RoutedWire, paint: Paint) => ReactElement;

  /** Draws a section's sequence-diagram geometry. */
  readonly sequence: (geometry: SequenceGeometry, paint: Paint) => ReactElement;

  /** Draws measured text content, moved to `point` (section-local). */
  readonly label: (content: MeasuredContent, point: Point) => ReactElement;
}

/** Where to draw one wire-end marker. */
export interface MarkerPlacement {
  /** Which Presentation marker to draw. */
  readonly kind: MarkerKind;

  /** The wire's route points; the marker is oriented along the end segment. */
  readonly points: readonly Point[];

  /** Which end of the wire the marker belongs to. */
  readonly at: 'source' | 'target';

  /** The colours to draw with. */
  readonly paint: Paint;
}

/** A React component that draws one wire-end marker. */
export type MarkerDrawing = ComponentType<MarkerPlacement>;

/** One decoded font, ready for native rasterizing and PDF embedding. */
export interface NativeFont {
  /** Internal family name, `canvas-<digest>`, used to refer to this exact font. */
  readonly alias: string;

  /** The family name read from the font bytes. */
  readonly family: string;

  /** The font bytes to embed; WOFF2 fonts are decompressed first. */
  readonly bytes: Uint8Array;
}

/** Decodes Presentation's pinned fonts for native encoders. */
export interface FontDecoder {
  /**
   * Decodes every pinned font.
   *
   * @returns The decoded fonts, or `encoding-failed` when there are none, one cannot be decoded,
   * or two share a family name.
   */
  decode(): Promise<Result<readonly NativeFont[]>>;
}

/** Prepares image resources for PDF embedding. */
export interface MediaConverter {
  /**
   * Converts every image resource to a data URL PDFKit can embed. PNG and JPEG pass through;
   * other images become PNG. The resources themselves are not changed.
   *
   * @param resources - The snapshot's resources; non-images are skipped.
   * @returns A map from each image's original data URL to the data URL to embed, or
   * `encoding-failed` if an image cannot be converted.
   */
  convert(resources: readonly Resource[]): Promise<Result<ReadonlyMap<string, string>>>;
}

/** What the PNG and HTML encoders need. */
export interface RenderDependencies {
  /** Draws the scene as SVG. */
  readonly renderer: SceneRenderer;

  /** Byte and text codecs, and hashing. */
  readonly encoding: Encoding;
}
