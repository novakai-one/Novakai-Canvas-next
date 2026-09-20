import type { Target } from './selection.js';
import type { Box, Camera, Point } from './camera.js';
import type { Scene, PlacedNode, RoutedWire } from './scene.js';
import type { DetailTier, Emphasis, FocusProjection } from './focus.js';
export interface ViewNode {
  readonly id: string;
  readonly target: Target;
  readonly parentId: string;
  readonly position: Point;
  readonly box: Box;
  readonly placed: PlacedNode;
  readonly tree?: { readonly folder: boolean; readonly collapsed: boolean };
  readonly selected: boolean;
  readonly hovered: boolean;
  readonly emphasis: Emphasis;
  readonly detail: DetailTier;
  readonly hidden: boolean;
  readonly draft: boolean;
}
export interface ViewWire {
  readonly id: string;
  readonly target: Target;
  readonly sourceId: string;
  readonly targetId: string;
  readonly wire: RoutedWire;
  readonly origin: Point;
  readonly selected: boolean;
  readonly hovered: boolean;
  readonly emphasis: Emphasis;
  readonly showLabel: boolean;
  readonly hidden: boolean;
  readonly draft: boolean;
}
export interface ViewSection {
  readonly id: string;
  readonly target: Target;
  readonly position: Point;
  readonly box: Box;
  readonly section: Scene['sections'][number];
  readonly selected: boolean;
  readonly collapsed: boolean;
}
export interface CanvasView {
  readonly camera: Camera;
  readonly nodes: readonly ViewNode[];
  readonly wires: readonly ViewWire[];
  readonly sections: readonly ViewSection[];
  readonly editable: boolean;
  readonly tool: 'select' | 'hand' | 'connect';
  readonly focus: FocusProjection;
}
export interface OutlineEntry {
  readonly target: Target;
  readonly label: string;
  readonly description: readonly string[];
  readonly endpoints: readonly {
    readonly member: string;
    readonly label: string;
    readonly direction: string;
  }[];
}
export interface OutlineSection {
  readonly target: Target;
  readonly title: string;
  readonly entries: readonly OutlineEntry[];
}
