import { formatFailure } from '../../contract/api.js';
import { useSyncExternalStore } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { FeatureProps } from '../../contract/react-types.js';
import type { LibraryFeatureProps } from '../../contract/library-react.js';
import styles from './ObjectEditor.module.css';
/** Declarative slots share one browse session between the full library and its side panel. */
export function createLibraryBrowser(
  slots: readonly { readonly id: string; readonly Content: ComponentType<LibraryFeatureProps> }[],
): ComponentType<FeatureProps> {
  /** Search state and drafts stay outside panel lifecycle; mounting a different layout cannot reset them. */
  function LibraryBrowser({ controller, view }: FeatureProps): ReactElement {
    const library = controller.library;
    const state = useSyncExternalStore(library.subscribe, library.getSnapshot);
    return (
      <div className={styles.editor}>
        {state.problem && <p role="alert">{formatFailure(state.problem).join(' · ')}</p>}
        {slots.map(({ id, Content }) => (
          <Content
            key={id}
            library={library}
            state={state}
            workspace={controller}
            busy={view.busy || !view.connected}
          />
        ))}
      </div>
    );
  }
  return LibraryBrowser;
}
