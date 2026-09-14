import { DropdownMenu as Primitive } from 'radix-ui';
import type { ReactElement } from 'react';
import type { MenuProps } from '../../contract/react-types.js';
import styles from './Menu.module.css';
/** Controlled semantic actions with native Radix keyboard/focus mechanics; host owns action recovery. */
export function Menu({
  label,
  trigger,
  items,
  portal,
  open,
  onOpenChange,
}: MenuProps): ReactElement {
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      <Primitive.Portal container={portal}>
        <Primitive.Content aria-label={label} className={styles.menu}>
          {items.map((item) => (
            <Primitive.Item
              key={item.id}
              disabled={item.disabled ?? false}
              onSelect={item.onSelect}
              className={styles.item}
            >
              {item.label}
            </Primitive.Item>
          ))}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
