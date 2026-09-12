import { useSyncExternalStore } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import type { WireFieldsProps } from '../../contract/wire-react.js';
import type { WireEdit } from '../../contract/records/wire-editor.js';
import { selectedWire, wireDraftKey, editedWire } from '../../contract/api.js';
import styles from './ObjectEditor.module.css';
/** Injected field groups stay mounted across ordinary edits and can be reorganized at composition. */
export function createWireEditor({
  Button,
  fields,
}: Pick<DesignSlots, 'Button'> & {
  readonly fields: readonly {
    readonly id: string;
    readonly Content: ComponentType<WireFieldsProps>;
  }[];
}): ComponentType<FeatureProps> {
  /** Selection changes show another retained form; they never move the camera or submit an edit. */
  function WireEditor({ controller, view }: FeatureProps): ReactElement {
    const canvas = useSyncExternalStore(
      view.active?.session.subscribe ?? emptySubscribe,
      view.active?.session.getSnapshot ?? emptySnapshot,
    );
    const session = controller.wires;
    const forms = useSyncExternalStore(session.subscribe, session.getSnapshot);
    const selection = selectedWire(view, canvas?.selection[0]);
    if (selection === null) return <p>Select a wire to edit its label, endpoints or route.</p>;
    const key = wireDraftKey(
      selection.collection.id,
      selection.section.id,
      selection.relationship.id,
    );
    const draft = forms.drafts.find((draft) => draft.key === key);
    const value = draft ? editedWire(draft) : selection;
    const edit = (command: WireEdit): void => {
      session.edit(selection, command);
    };
    return (
      <div className={styles.editor}>
        <header>
          <strong>{selection.relationship.label}</strong>
          <p>
            {selection.section.title} · {selection.relationship.id}
          </p>
        </header>
        {fields.map(({ id, Content }) => (
          <Content key={id} value={value} collection={selection.collection} edit={edit} />
        ))}
        {forms.problem && <p role="alert">{forms.problem.message}</p>}
        {draft && (
          <footer>
            <p>
              Draft from revision {draft.collection.revision}. Shared meaning and local routing
              apply together.
            </p>
            <div className={styles.choices}>
              <Button
                label="Apply wire"
                variant="primary"
                disabled={view.busy || !view.connected}
                pending={view.busy}
                onClick={() => {
                  void session.apply(key);
                }}
              />
              <Button label="Discard wire draft" onClick={() => session.discard(key)} />
            </div>
          </footer>
        )}
      </div>
    );
  }
  return WireEditor;
}
/** Empty subscriptions preserve hook order while no collection is open. */
function emptySubscribe(): () => void {
  return () => undefined;
}
/** An absent Canvas has no fabricated selection. */
function emptySnapshot(): null {
  return null;
}
