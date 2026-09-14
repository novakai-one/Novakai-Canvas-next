import type { Target, WireTarget } from './selection.js';
import type { Box, Point } from './camera.js';
import type { SceneStamp } from './scene.js';
export interface GeometryEntry {
  readonly target: Target;
  readonly box: Box;
  readonly locked: boolean;
}
export interface PlacementDraft {
  readonly kind: 'move' | 'resize';
  readonly id: string;
  readonly generation: number;
  readonly base: SceneStamp;
  readonly original: readonly GeometryEntry[];
  readonly current: readonly GeometryEntry[];
  readonly changed: boolean;
}
export type AttachmentSide = 'preserve' | 'auto' | 'top' | 'right' | 'bottom' | 'left';
export interface RouteGeometry {
  readonly points: readonly Point[];
  readonly sourceSide: AttachmentSide;
  readonly targetSide: AttachmentSide;
  readonly locked: boolean | 'preserve';
}
export interface RouteDraft {
  readonly kind: 'route';
  readonly id: string;
  readonly generation: number;
  readonly base: SceneStamp;
  readonly target: WireTarget;
  readonly original: RouteGeometry;
  readonly current: RouteGeometry;
  readonly changed: boolean;
}
export type GestureDraft = PlacementDraft | RouteDraft;
export interface RecoverableDraft {
  readonly draft: GestureDraft;
  readonly reason: 'submitted' | 'scene-changed' | 'target-removed' | 'rejected' | 'disconnected';
  readonly message: string;
}
