import { collectionId } from '@novakai/canvas-model';
import type { WorkspaceNavigation } from '../contract/ports/navigation.js';
import type { Result } from '../contract/errors.js';
import { failure } from '../contract/errors.js';
/** URL identity survives browser refresh and service restart. Navigation failure leaves the readable canvas and durable diagram intact. */
export function createWorkspaceNavigation(
  location: Pick<Location, 'href'>,
  history: Pick<History, 'replaceState'>,
): WorkspaceNavigation {
  return {
    current: () => current(location.href),
    opened: (id) => opened(location.href, history, id),
  };
}
/** Admit IDs through Model instead of interpreting arbitrary URL values as diagram paths. */
function current(href: string): Result<string | null> {
  const value = new URL(href).searchParams.get('collection');
  if (value === null) return { ok: true, value: null };
  const checked = collectionId.safeParse(value);
  if (!checked.success)
    return failure('invalid-location', 'The collection link contains an invalid identity');
  return { ok: true, value: checked.data };
}
/** Only a successfully admitted/rendered collection updates this tab's location; browser history does not own records. */
function opened(
  href: string,
  history: Pick<History, 'replaceState'>,
  collection: string | null,
): Result<void> {
  try {
    const url = new URL(href);
    setCollection(url, collection);
    history.replaceState(null, '', url);
    return { ok: true, value: undefined };
  } catch {
    return failure(
      'navigation-unavailable',
      'The collection opened, but its browser link could not be updated',
    );
  }
}

/** The library root omits collection identity; a selected collection uses one explicit query parameter. */
function setCollection(
  url: URL,
  collection: string | null,
): void {
  if (collection === null) {
    url.searchParams.delete('collection');
    return;
  }
  url.searchParams.set('collection', collection);
}
