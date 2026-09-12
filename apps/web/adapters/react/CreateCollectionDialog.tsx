import { useState } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { CreateDialogProps, DesignSlots } from '../../contract/react-types.js';
import styles from './CreateCollectionDialog.module.css';
/** Reusable dialog owns only its title draft; creation and canonical admission belong to the supplied controller. */
export function createCollectionDialog({
  Dialog,
  Field,
  Button,
}: Pick<DesignSlots, 'Dialog' | 'Field' | 'Button'>): ComponentType<CreateDialogProps> {
  /** A readable starter flow makes the first collection immediately editable and explains what will be created. */
  function CreateCollectionDialog(props: CreateDialogProps): ReactElement {
    const [title, setTitle] = useState('Untitled collection');
    return (
      <Dialog
        open={props.open}
        onOpenChange={(open) => {
          if (!open) props.onClose();
        }}
        title="New collection"
        description="Bring related diagrams and explanations together on one canvas."
        portal={props.portal}
      >
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            props.onCreate(title.trim());
          }}
        >
          <Field
            label="Collection title"
            required
            control={(field) => (
              <input
                {...field}
                value={title}
                maxLength={256}
                onChange={(event) => setTitle(event.target.value)}
              />
            )}
          />
          <p>
            Starts with a simple process: Start → Step → Done. Move the nodes or open Source to
            build on it.
          </p>
          <div className={styles.actions}>
            <Button label="Cancel" type="button" onClick={props.onClose} />
            <Button
              label="Create collection"
              type="submit"
              variant="primary"
              disabled={title.trim().length === 0}
            />
          </div>
        </form>
      </Dialog>
    );
  }
  return CreateCollectionDialog;
}
