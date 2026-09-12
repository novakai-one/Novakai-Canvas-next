import { useSyncExternalStore } from 'react';
import type { PanelController } from '../../contract/panel-types.js';
import { panelVisible } from '../../contract/api.js';
import type { ComponentType, ReactElement } from 'react';
import type { HeaderProps, DesignSlots } from '../../contract/react-types.js';
import styles from './WorkspaceHeader.module.css';
/** Stable header slots expose human actions; status and editing behavior remain controller-owned. */
export function createWorkspaceHeader(
  { Button }: Pick<DesignSlots, 'Button'>,
  panels: PanelController,
): ComponentType<HeaderProps> {
  /** Diagram identity is the title; tool labels describe actions without exposing capability internals. */
  function WorkspaceHeader({ controller, view, onCreate }: HeaderProps): ReactElement {
    const panelState = useSyncExternalStore(panels.subscribe, panels.getSnapshot);
    return (
      <header className={styles.header} data-mode={panelState.mode}>
        <button
          type="button"
          className={styles.brand}
          aria-label="Open collection library"
          onClick={controller.showLibrary}
        >
          <span className={styles.mark} aria-hidden="true">
            N
          </span>
          <span>Canvas</span>
        </button>
        <div className={styles.context}>
          <span className={styles.eyebrow}>Workspace</span>
          <h1>{view.active?.document.collection.title ?? 'Your collections'}</h1>
        </div>
        <nav aria-label="Workspace actions" className={styles.actions}>
          <Button
            label="New collection"
            onClick={onCreate}
            disabled={view.busy || !view.connected}
          />
          <Button
            label="Collection"
            selected={panelVisible(panelState, 'left')}
            onClick={() => panels.open('left', !panelVisible(panelState, 'left'))}
            disabled={view.active === null}
          />
          <Button
            label="Source"
            selected={view.sourceOpen}
            onClick={() => {
              void controller.showSource(!view.sourceOpen);
            }}
            disabled={view.active === null}
          />
          <Button
            label="Inspector"
            selected={panelVisible(panelState, 'right')}
            onClick={() => panels.open('right', !panelVisible(panelState, 'right'))}
            disabled={view.active === null}
          />
        </nav>
      </header>
    );
  }
  return WorkspaceHeader;
}
