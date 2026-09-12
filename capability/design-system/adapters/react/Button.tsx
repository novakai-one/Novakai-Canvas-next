import type { ReactElement } from 'react';
import type { ButtonProps } from '../../contract/react-types.js';
import styles from './Button.module.css';
/** Native action semantics; host owns action errors/retry, while pending blocks duplicate submission. */
export function Button({
  label,
  icon,
  iconOnly = false,
  variant = 'default',
  selected,
  pending = false,
  disabled = false,
  type = 'button',
  ...native
}: ButtonProps): ReactElement {
  return (
    <button
      {...native}
      type={type}
      className={styles.button}
      data-variant={variant}
      data-icon-only={iconOnly}
      aria-pressed={selected}
      aria-busy={pending}
      disabled={disabled || pending}
    >
      <span aria-hidden="true">{icon}</span>
      <span className={iconOnly ? styles.hidden : styles.label}>{label}</span>
      {pending && <span className={styles.progress}>Working…</span>}
    </button>
  );
}
