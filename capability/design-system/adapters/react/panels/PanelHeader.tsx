import type { ReactElement, ComponentType } from 'react';
import type { PanelHeaderProps, ButtonProps } from '../../../contract/react-types.js';
import styles from './PanelHeader.module.css';
/** Stable injected action keeps panel chrome independent from action rendering internals. */
export function createPanelHeader(
  Button: ComponentType<ButtonProps>,
): ComponentType<PanelHeaderProps> {
  /** Persistent panel identity/actions; host owns dismissal policy and draft recovery. */
  function PanelHeader({ title, actions, onClose }: PanelHeaderProps): ReactElement {
    return (
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.actions}>
          {actions}
          {onClose && <Button label={'Close ' + title} icon="×" iconOnly onClick={onClose} />}
        </div>
      </header>
    );
  }
  return PanelHeader;
}
