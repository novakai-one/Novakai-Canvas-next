import { useId, type ReactElement } from 'react';
import type { FieldProps } from '../../contract/react-types.js';
import styles from './Field.module.css';
/** Associate labels/help/errors without owning validation or edits; host corrects the controlled value. */
export function Field({
  id: providedId,
  label,
  help,
  error,
  required = false,
  control,
}: FieldProps): ReactElement {
  const generated = useId();
  const id = providedId ?? generated;
  const describedBy = descriptions(id, help, error);
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {control({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy, required })}
      {help && (
        <p id={id + '-help'} className={styles.help}>
          {help}
        </p>
      )}
      {error && (
        <p id={id + '-error'} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
/** Only rendered descriptions are referenced; empty IDs never become broken accessibility links. */
function descriptions(
  id: string,
  help: string | undefined,
  error: string | undefined,
): string | undefined {
  const ids = [help ? id + '-help' : '', error ? id + '-error' : ''].filter(Boolean).join(' ');
  return ids || undefined;
}
