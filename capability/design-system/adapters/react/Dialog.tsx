import { Dialog as Primitive } from 'radix-ui';
import { useRef } from 'react';
import type { ReactElement, ComponentType } from 'react';
import type { DialogProps, ButtonProps } from '../../contract/react-types.js';
import styles from './Dialog.module.css';
/** Compose reusable close action once, outside render; host can decline dirty dismissal via controlled open. */
export function createDialog(Button: ComponentType<ButtonProps>): ComponentType<DialogProps> {
  /** Radix owns modal focus/trap/return; host supplies matching portal scope and action recovery. */
  function Dialog({
    open,
    onOpenChange,
    title,
    description,
    trigger,
    children,
    portal,
    closeLabel = 'Close dialog',
    placement = 'center',
  }: DialogProps): ReactElement {
    const opener = useRef<HTMLElement | null>(null);
    /** External triggers are allowed; remember the actual focused control before the modal takes focus. */
    function rememberOpener(): void {
      const focused = portal.ownerDocument.activeElement;
      opener.current = focused instanceof HTMLElement ? focused : null;
    }
    /** Radix's built-in trigger handles its own return; a host-controlled panel restores its external opener explicitly. */
    function restoreOpener(event: Event): void {
      if (trigger !== undefined) return;
      event.preventDefault();
      opener.current?.focus();
    }
    return (
      <Primitive.Root open={open} onOpenChange={onOpenChange}>
        {trigger && <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>}
        <Primitive.Portal container={portal}>
          <Primitive.Overlay className={styles.overlay} />
          <Primitive.Content
            className={styles.dialog}
            data-placement={placement}
            onOpenAutoFocus={rememberOpener}
            onCloseAutoFocus={restoreOpener}
          >
            <header className={styles.header}>
              <Primitive.Title className={styles.title}>{title}</Primitive.Title>
              <Primitive.Close asChild>
                <Button label={closeLabel} icon="×" iconOnly />
              </Primitive.Close>
            </header>
            <Primitive.Description className={styles.description}>
              {description}
            </Primitive.Description>
            <div className={styles.body}>{children}</div>
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    );
  }
  return Dialog;
}
