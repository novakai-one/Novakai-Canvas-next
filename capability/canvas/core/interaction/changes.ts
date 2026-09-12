import type { SessionState, Transition } from '../../contract/records/state.js';
import type { CanvasEffect } from '../../contract/records/intent.js';
/** One immutable transition carries effects separately; host alone delivers them to Authoring or UI. */
export function changed(
  previous: SessionState,
  next: SessionState,
  effects: readonly CanvasEffect[] = [],
): Transition {
  return Object.freeze({
    state: Object.freeze(next),
    effects: Object.freeze(effects),
    diagnostics: [],
    changed: previous !== next,
  });
}
/** Explicit unchanged outcome makes canceled/no-op events safe to replay without effects. */
export function unchanged(state: SessionState): Transition {
  return changed(state, state);
}
/** Read-only is fixed at open; pending status cannot turn a viewer into an editor. */
export function canMutate(state: SessionState): boolean {
  return [!state.readOnly, state.reading === null, state.connected, state.mutationAvailable].every(
    Boolean,
  );
}
