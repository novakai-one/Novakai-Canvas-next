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
  function WorkspaceHeader({ controller, view }: HeaderProps): ReactElement {
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
            label="Add"
            selected={
              panelVisible(panelState, 'left') && panelState.preferences.tabs.left === 'add'
            }
            onClick={() => panels.selectTab('add')}
            disabled={view.active === null}
          />
          <Button
            label="Browse"
            selected={
              panelVisible(panelState, 'left') && panelState.preferences.tabs.left === 'browse'
            }
            onClick={() => panels.selectTab('browse')}
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
            label="Inspect"
            selected={
              panelVisible(panelState, 'right') && panelState.preferences.tabs.right === 'inspect'
            }
            onClick={() => panels.selectTab('inspect')}
            disabled={view.active === null}
          />
        </nav>
      </header>
    );
  }
  return WorkspaceHeader;
}
