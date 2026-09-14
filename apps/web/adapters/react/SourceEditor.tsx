import type { ComponentType, ReactElement } from 'react';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import styles from './SourceEditor.module.css';
/** Source is a retained human draft with explicit apply; editing never mutates canonical JSON or geometry. */
export function createSourceEditor(
  { Button, Dialog }: Pick<DesignSlots, 'Button' | 'Dialog'>,
  portal: HTMLElement,
): ComponentType<FeatureProps> {
  /** An agent's concurrent commit keeps this source and its original version preconditions intact. */
  function SourceEditor({ controller, view }: FeatureProps): ReactElement {
    return (
      <>
        <section className={styles.source} aria-label="Collection source">
          <header>
            <div>
              <h2>Collection source</h2>
              <p>{view.sourceDirty ? 'Draft not applied' : 'Current readable DSL'}</p>
            </div>
            <Button
              label="Close source"
              onClick={() => {
                void controller.showSource(false);
              }}
            />
          </header>
          <label className={styles.label} htmlFor="diagram-source">
            Diagram DSL
          </label>
          <textarea
            id="diagram-source"
            spellCheck={false}
            value={view.source}
            onChange={(event) => controller.editSource(event.target.value)}
            aria-describedby="source-help"
          />
          <footer>
            <p id="source-help">Apply submits this draft against the revision you opened.</p>
            <Button
              label="Apply source"
              variant="primary"
              pending={view.busy}
              disabled={!view.sourceDirty || !view.connected || view.busy}
              onClick={() => {
                void controller.applySource();
              }}
            />
          </footer>
        </section>
        <Dialog
          open={view.sourceCloseRequested}
          onOpenChange={(open) => {
            if (!open) controller.closeSource('stay');
          }}
          title="Keep your unapplied changes?"
          description="Your draft has not changed the saved diagram."
          portal={portal}
        >
          <div className={styles.choices}>
            <Button
              label="Keep draft"
              variant="primary"
              onClick={() => controller.closeSource('keep')}
            />
            <Button label="Discard draft" onClick={() => controller.closeSource('discard')} />
            <Button label="Stay in editor" onClick={() => controller.closeSource('stay')} />
          </div>
        </Dialog>
      </>
    );
  }
  return SourceEditor;
}
