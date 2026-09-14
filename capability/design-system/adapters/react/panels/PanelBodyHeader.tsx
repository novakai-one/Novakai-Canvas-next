import type { ReactElement } from 'react';
import type { PanelBodyHeaderProps } from '../../../contract/react-types.js';
import styles from './PanelBodyHeader.module.css';
/** Current editing scope remains distinct from persistent panel identity; host owns selected context. */
export function PanelBodyHeader({ title, scope, actions }: PanelBodyHeaderProps): ReactElement {
  return (
    <div className={styles.header}>
      <div>
        <h3 className={styles.title}>{title}</h3>
        {scope && <p className={styles.scope}>{scope}</p>}
      </div>
      <div className={styles.actions}>{actions}</div>
    </div>
  );
}
