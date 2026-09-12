import type { ReactElement } from 'react';
import type { PanelSectionBodyProps } from '../../../contract/react-types.js';
import styles from './PanelSectionBody.module.css';
/** Hidden content remains mounted, retaining child drafts; host owns reset/discard decisions. */
export function PanelSectionBody({ id, expanded, children }: PanelSectionBodyProps): ReactElement {
  return (
    <div
      id={id + '-body'}
      role="region"
      aria-labelledby={id + '-toggle'}
      hidden={!expanded}
      className={styles.body}
    >
      {children}
    </div>
  );
}
