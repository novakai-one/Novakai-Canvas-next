import type { ReactElement } from 'react';
import type { PanelBodyProps } from '../../../contract/react-types.js';
import styles from './PanelBody.module.css';
/** One scroll owner contains context and ordered sections; host preserves each section's stable key. */
export function PanelBody({ header, children }: PanelBodyProps): ReactElement {
  return (
    <div className={styles.body}>
      {header}
      {children}
    </div>
  );
}
