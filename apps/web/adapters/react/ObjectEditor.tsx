import { formatFailure } from '../../contract/api.js';
import { useSyncExternalStore } from 'react';
import type { ReactElement, ComponentType } from 'react';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import type { ContentEditorProps } from '../../contract/inspector-react.js';
import type { ObjectEdit } from '../../contract/records/inspector.js';
import { selectedObject, objectDraftKey, editedObject } from '../../contract/api.js';
import type { DescendantId } from '@novakai/canvas-model';
import styles from './ObjectEditor.module.css';
/** Stable composition keeps content-row components and inspector lifetime independent of panel placement. */
export function createObjectEditor({
  Button,
  Field,
  Content,
  nextContentId,
}: Pick<DesignSlots, 'Button' | 'Field'> & {
  readonly Content: ComponentType<ContentEditorProps>;
  nextContentId(): DescendantId;
}): ComponentType<FeatureProps> {
  /** A selection change reads another form; it never discards the previously edited object's draft. */
  function ObjectEditor({ controller, view }: FeatureProps): ReactElement {
    const canvas = useSyncExternalStore(
      view.active?.session.subscribe ?? emptySubscribe,
      view.active?.session.getSnapshot ?? emptySnapshot,
    );
    const inspector = controller.inspector;
    const forms = useSyncExternalStore(inspector.subscribe, inspector.getSnapshot);
    const selected = selectedObject(view, canvas?.selection[0]);
    if (selected === null)
      return <p>Select an object to edit its content. Double-click opens this inspector.</p>;
    const key = objectDraftKey(selected.collection.id, selected.object.id);
    const draft = forms.drafts.find((item) => item.key === key);
    const object = draft ? editedObject(draft) : selected.object;
    const edit = (command: ObjectEdit): void => {
      inspector.edit(selected, command);
    };
    return (
      <div className={styles.editor}>
        <header>
          <strong>{object.label || 'Untitled object'}</strong>
          <p>
            {object.kind} · {object.id}
          </p>
        </header>
        <Field
          label="Object label"
          control={(props) => (
            <input
              {...props}
              value={object.label}
              onChange={(event) => edit({ kind: 'label', value: event.target.value })}
            />
          )}
        />
        <Field
          label="Semantic role"
          help="Resolved by the collection theme"
          control={(props) => (
            <input
              {...props}
              value={object.role}
              onChange={(event) => edit({ kind: 'role', value: event.target.value })}
            />
          )}
        />
        <div className={styles.choices} aria-label="Object size">
          {sizes.map((value) => (
            <Button
              key={value}
              label={value}
              selected={object.size === value}
              onClick={() => edit({ kind: 'size', value })}
            />
          ))}
        </div>
        {object.content.map((item) => (
          <Content key={item.id} item={item} collection={selected.collection} edit={edit} />
        ))}
        <div className={styles.choices}>
          {additions(object.kind).map((content) => (
            <Button
              key={content}
              label={`Add ${content}`}
              onClick={() => edit({ kind: 'add-content', id: nextContentId(), content })}
            />
          ))}
        </div>
        {forms.problem && <p role="alert">{formatFailure(forms.problem).join(' · ')}</p>}
        {draft && (
          <footer>
            <p>
              Draft from revision {draft.collection.revision}. Shared across every diagram showing
              this object.
            </p>
            <div className={styles.choices}>
              <Button
                label="Apply object"
                variant="primary"
                disabled={view.busy || !view.connected}
                pending={view.busy}
                onClick={() => {
                  void inspector.apply(key);
                }}
              />
              <Button label="Discard object draft" onClick={() => inspector.discard(key)} />
            </div>
          </footer>
        )}
      </div>
    );
  }
  return ObjectEditor;
}
const sizes = ['small', 'medium', 'large'] as const;
/** Offered content follows the visible notation; the final owner still checks compatibility. */
function additions(
  kind: string,
): readonly Extract<ObjectEdit, { kind: 'add-content' }>['content'][] {
  if (kind === 'entity') return ['field', 'text'];
  if (['module', 'interface', 'function'].includes(kind)) return ['member', 'signature', 'text'];
  return ['text'];
}
/** Stable empty subscriptions preserve hook order before any collection exists. */
function emptySubscribe(): () => void {
  return () => undefined;
}
/** Missing Canvas state is explicit and never fabricates a selection. */
function emptySnapshot(): null {
  return null;
}
