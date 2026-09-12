import type { ComponentType, ReactElement } from 'react';
import type { LibraryProps, DesignSlots, FeatureProps } from '../../contract/react-types.js';
import styles from './CollectionLibrary.module.css';
/** The library presents actual committed collections; opening one is an explicit camera-navigation action. */
export function createCollectionLibrary({
  Button,
  Browser,
}: Pick<DesignSlots, 'Button'> & {
  readonly Browser: ComponentType<FeatureProps>;
}): ComponentType<LibraryProps> {
  /** Empty and populated views share a clear creation action and readable collection metadata. */
  function CollectionLibrary({ controller, view, onCreate }: LibraryProps): ReactElement {
    return (
      <section className={styles.library} aria-labelledby="library-title">
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>A workspace for visual thinking</p>
            <h2 id="library-title">Make the system visible.</h2>
            <p>Engineering diagrams, processes and explanations — together on one canvas.</p>
          </div>
          <Button
            label="Create a collection"
            variant="primary"
            onClick={onCreate}
            disabled={!view.connected}
          />
        </div>
        <Browser controller={controller} view={view} />
        {view.collections.length === 0 && (
          <p className={styles.empty}>
            Start with a collection. Add diagrams to explain a system, teach a concept or walk
            through a process.
          </p>
        )}
      </section>
    );
  }
  return CollectionLibrary;
}
