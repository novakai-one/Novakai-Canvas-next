import type { ReactElement } from 'react';
import type { StatusMessageProps } from '../../contract/react-types.js';
import styles from './StatusMessage.module.css';
const icons = { info: 'ⓘ', success: '✓', warning: '!', error: '×' };
/** Visible text and icon communicate status without color alone; host owns recovery actions. */
export function StatusMessage({ tone, label, children }: StatusMessageProps): ReactElement {
  return (
    <div className={styles.status} data-tone={tone} role={tone === 'error' ? 'alert' : 'status'}>
      <span aria-hidden="true" className={styles.icon}>
        {icons[tone]}
      </span>
      <div>
        <p className={styles.label}>{label}</p>
        {children}
      </div>
    </div>
  );
}
