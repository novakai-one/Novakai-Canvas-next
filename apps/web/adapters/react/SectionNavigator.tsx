import { useSyncExternalStore } from 'react';
import type { ReactElement, ComponentType } from 'react';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import styles from './Navigation.module.css';
/** Section labels describe committed content. Locate is the only action here that changes camera position. */
export function createSectionNavigator({
  Button,
}: Pick<DesignSlots, 'Button'>): ComponentType<FeatureProps> {
  /** Selection changes only selection; Locate centers at current zoom and Fit is a separate explicit command. */
  function SectionNavigator({ view }: FeatureProps): ReactElement {
    const session = view.active?.session;
    const state = useSyncExternalStore(
      session?.subscribe ?? emptySubscribe,
      session?.getSnapshot ?? emptySnapshot,
    );
    return (
      <ol className={styles.list}>
        {view.active?.document.collection.sections.map((section) => (
          <li key={section.id}>
            <button
              className={styles.row}
              type="button"
              aria-current={
                state?.selection.some(
                  (target) => target.kind === 'section' && target.id === section.id,
                )
                  ? 'true'
                  : undefined
              }
              onClick={() =>
                view.active?.session.dispatch({
                  kind: 'select',
                  targets: [{ kind: 'section', id: section.id }],
                  mode: 'replace',
                })
              }
            >
              <span>{section.title}</span>
              <small>{section.mode}</small>
            </button>
            <div className={styles.actions}>
              <Button
                label={`Locate ${section.title}`}
                title="Center this diagram without changing zoom"
                icon="◎"
                iconOnly
                onClick={() =>
                  session?.dispatch({ kind: 'locate', target: { kind: 'section', id: section.id } })
                }
              />
              <Button
                label={`Fit ${section.title}`}
                title="Fit this diagram in the canvas"
                icon="⛶"
                iconOnly
                onClick={() =>
                  session?.dispatch({ kind: 'fit', target: { kind: 'section', id: section.id } })
                }
              />
            </div>
          </li>
        ))}
      </ol>
    );
  }
  return SectionNavigator;
}
/** Initial collection loading has no Canvas subscription or fabricated selection. */
function emptySubscribe(): () => void {
  return () => undefined;
}
/** Stable empty snapshot keeps React hook order while the first collection loads. */
function emptySnapshot(): null {
  return null;
}
