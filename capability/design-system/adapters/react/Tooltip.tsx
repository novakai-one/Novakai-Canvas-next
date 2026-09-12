import { Tooltip as Primitive } from 'radix-ui';
import type { ReactElement } from 'react';
import type { TooltipProps } from '../../contract/react-types.js';
import styles from './Tooltip.module.css';
/** Tooltips supplement an already labelled control; host disables them behind active modals. */
export function Tooltip({ label, children, portal, disabled = false }: TooltipProps): ReactElement {
  if (disabled) return children;
  return (
    <Primitive.Provider>
      <Primitive.Root>
        <Primitive.Trigger asChild>{children}</Primitive.Trigger>
        <Primitive.Portal container={portal}>
          <Primitive.Content className={styles.tooltip}>{label}</Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </Primitive.Provider>
  );
}
