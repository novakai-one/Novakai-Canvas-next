import type { Result } from '../errors.js';
import type { SessionState, Transition } from '../records/state.js';
import type { Target } from '../records/selection.js';
import type { Point } from '../records/camera.js';
import type { CanvasEffect } from '../records/intent.js';
/** Ephemeral pointer lifecycle belongs to the session, separate from canonical diagram data. */
export interface PointerGesture {
  readonly id: string;
  readonly target: Target;
  readonly start: Point;
}
export interface SessionReducer {
  transition(state: SessionState, event: unknown): Result<Transition>;
}
/** Explicit effect draining makes rendering subscriptions incapable of submitting mutations twice. */
export interface SessionStore {
  getSnapshot(): SessionState;
  readPointer(): PointerGesture | null;
  writePointer(pointer: PointerGesture | null): void;
  subscribe(listener: () => void): () => void;
  dispatch(event: unknown): Result<Transition>;
  drainEffects(): readonly CanvasEffect[];
  dispose(): void;
}
