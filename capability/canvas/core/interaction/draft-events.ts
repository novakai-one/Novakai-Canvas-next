import { handler, type Handler } from './handler.js';
import { changed } from './changes.js';
import { beginDraft } from '../drafts/begin.js';
import { activeDraft, moveDraft, resizeDraft, updateRoute } from '../drafts/update.js';
import { finishDraft } from '../drafts/finish.js';
import { rejectDraft, removeRecovery } from '../drafts/reconcile.js';
/** Draft lifecycle handlers return immutable previews/effects; none allocate a persistence request or revision. */
export function draftHandlers(): readonly Handler[] {
  return [
    handler('begin', (state, event) =>
      changed(state, { ...state, draft: beginDraft(state, event) }),
    ),
    handler('move', (state, event) => changed(state, { ...state, draft: moveDraft(state, event) })),
    handler('resize', (state, event) =>
      changed(state, { ...state, draft: resizeDraft(state, event) }),
    ),
    handler('route', (state, event) =>
      changed(state, { ...state, draft: updateRoute(state, event) }),
    ),
    handler('finish', (state, event) => finishDraft(state, event.id)),
    handler('cancel', (state, event) => {
      activeDraft(state, event.id);
      return changed(state, { ...state, draft: null });
    }),
    handler('reject', (state, event) =>
      changed(state, rejectDraft(state, event.id, event.message)),
    ),
    handler('confirmed', (state, event) => changed(state, removeRecovery(state, event.id))),
    handler('discard', (state, event) => changed(state, removeRecovery(state, event.id))),
  ];
}
