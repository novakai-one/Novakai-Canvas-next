import { formatFailure } from '../../contract/api.js';
import { useSyncExternalStore } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { LibraryBrowserProps, LibraryFeatureProps } from '../../contract/library-react.js';
import styles from './ObjectEditor.module.css';
/** Declarative slots share one browse session between the full library and its side panel. */
export function createLibraryBrowser(
  slots: readonly { readonly id: string; readonly Content: ComponentType<LibraryFeatureProps> }[],
): ComponentType<LibraryBrowserProps> {
  /** Search state and drafts stay outside panel lifecycle; mounting a different layout cannot reset them. */
  function LibraryBrowser({
    controller,
    view,
    onSelect,
    currentId,
    pendingId,
  }: LibraryBrowserProps): ReactElement {
    const library = controller.library;
    const state = useSyncExternalStore(library.subscribe, library.getSnapshot);
    return (
      <div className={styles.editor}>
        <LibraryProblem problem={state.problem} />
        {slots.map(({ id, Content }) => (
          <Content
            key={id}
            {...featureProps(library, state, controller, view, onSelect, currentId, pendingId)}
          />
        ))}
      </div>
    );
  }
  return LibraryBrowser;
}

function LibraryProblem({
  problem,
}: {
  readonly problem: LibraryFeatureProps['state']['problem'];
}): ReactElement | null {
  if (problem === null) return null;
  return <p role="alert">{formatFailure(problem).join(' · ')}</p>;
}

function featureProps(
  library: LibraryFeatureProps['library'],
  state: LibraryFeatureProps['state'],
  controller: LibraryFeatureProps['workspace'],
  view: LibraryBrowserProps['view'],
  onSelect: LibraryBrowserProps['onSelect'],
  currentId: LibraryBrowserProps['currentId'],
  pendingId: LibraryBrowserProps['pendingId'],
): LibraryFeatureProps {
  return {
    library,
    state,
    workspace: controller,
    busy: view.busy || !view.connected,
    onSelect: onSelect ?? null,
    currentId: currentId ?? null,
    pendingId: pendingId ?? null,
  };
}
