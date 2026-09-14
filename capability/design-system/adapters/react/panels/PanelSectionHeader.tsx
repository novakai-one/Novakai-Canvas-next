import type { ReactElement } from 'react';
import type { PanelSectionHeaderProps } from '../../../contract/react-types.js';
import styles from './PanelSectionHeader.module.css';
/** Collapse and action slots are siblings, never nested buttons; host owns reorder/hide policy. */
export function PanelSectionHeader({
  id,
  title,
  expanded,
  onExpandedChange,
  actions,
}: PanelSectionHeaderProps): ReactElement {
  return (
    <div className={styles.header}>
      <button
        id={id + '-toggle'}
        type="button"
        aria-expanded={expanded}
        aria-controls={id + '-body'}
        onClick={() => onExpandedChange(!expanded)}
        className={styles.toggle}
      >
        <span aria-hidden="true">{expanded ? '⌄' : '›'}</span>
        <span>{title}</span>
      </button>
      <div className={styles.actions}>{actions}</div>
    </div>
  );
}
