import type { ComponentType, ReactElement } from 'react';
import type { RevealInterfaceProps } from '../../contract/react-types.js';
import styles from './RevealInterface.module.css';

/** The only chrome that survives focus view; its native button keeps the escape path discoverable. */
export const RevealInterface: ComponentType<RevealInterfaceProps> = ({
  onReveal,
}: RevealInterfaceProps): ReactElement => (
  <button type="button" className={styles.reveal} onClick={onReveal} aria-label="Show interface">
    <span aria-hidden="true">⌘</span>
    <span>Show interface</span>
  </button>
);
