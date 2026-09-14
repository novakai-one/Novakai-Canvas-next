import type { SessionState, Transition } from '../../contract/records/state.js';
import { handler, type Handler } from './handler.js';
import { changed } from './changes.js';
import { selectTargets, marquee } from './selection.js';
import { targetInfo } from '../scenes/address.js';
import { readingAction, collapseTarget } from '../scenes/reading.js';
/** Escape cancels the innermost Canvas interaction first, then clears selection on a later press. */
export function escapeCanvas(state: SessionState): Transition {
  if (state.draft !== null) return changed(state, { ...state, draft: null });
  if (state.connection !== null) return changed(state, { ...state, connection: null });
  return escapeTool(state);
}
/** A temporary connect/hand tool resets before selection; camera is never part of Escape behavior. */
function escapeTool(state: SessionState): Transition {
  if (state.tool !== 'select') return changed(state, { ...state, tool: 'select' });
  return changed(state, { ...state, selection: [] });
}
/** Selection, inspect and reading remain explicit independent transitions; shell owns panel visibility. */
export function selectionHandlers(): readonly Handler[] {
  return [
    handler('select', (state, event) => changed(state, selectTargets(state, event))),
    handler('marquee', (state, event) => changed(state, marquee(state, event.box, event.additive))),
    handler('tool', (state, event) =>
      changed(state, { ...state, tool: event.tool, connection: null }),
    ),
    handler('inspect', (state, event) => {
      targetInfo(state.index, event.target);
      return changed(state, state, [{ kind: 'inspect-request', target: event.target }]);
    }),
    handler('escape', (state) => escapeCanvas(state)),
    handler('reading', (state, event) => changed(state, readingAction(state, event.action))),
    handler('collapse', (state, event) => changed(state, collapseTarget(state, event.target))),
  ];
}
