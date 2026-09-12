import { panelVisible } from '../../contract/api.js';
import { useState, useSyncExternalStore, useEffect } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { ChromeSlots, WorkspaceProps } from '../../contract/react-types.js';
import styles from './WorkspaceShell.module.css';
/** The work surface is the primary content; chrome uses stable injected sections and shared design tokens. */
export function createWorkspaceShell(slots: ChromeSlots): ComponentType<WorkspaceProps> {
  const { Header, Library, Panel, Source, Recovery, CreateDialog, CanvasSurface, FontDefinitions } =
    slots;
  /** Mount owns subscription lifetime. Selection and panning remain entirely inside the Canvas session. */
  function WorkspaceShell({ controller }: WorkspaceProps): ReactElement {
    const view = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
    const panelState = useSyncExternalStore(slots.panels.subscribe, slots.panels.getSnapshot);
    const navigationContext = view.active ?? view.opening;
    const [creating, setCreating] = useState(false);
    useEffect(() => {
      void controller.start();
      return controller.dispose;
    }, [controller]);
    return (
      <div className={styles.shell}>
        <FontDefinitions fonts={view.active?.document.fonts} />
        <Header controller={controller} view={view} onCreate={() => setCreating(true)} />
        <div className={styles.workspace}>
          {navigationContext && panelVisible(panelState, 'left') && (
            <Panel side="left" controller={controller} view={view} />
          )}
          <main className={styles.canvas} data-canvas-host aria-label="Diagram workspace">
            {view.active ? (
              <CanvasSurface
                session={view.active.session}
                reader={view.active.canvas}
                nextGestureId={slots.nextGestureId}
                onError={controller.report}
                paint={{
                  fill: view.active.document.style.surface,
                  stroke:
                    view.active.document.style.roles.neutral?.stroke ??
                    view.active.document.style.text,
                  text: view.active.document.style.text,
                }}
                label={view.active.document.collection.title}
              />
            ) : (
              <Library controller={controller} view={view} onCreate={() => setCreating(true)} />
            )}
            {view.sourceOpen && <Source controller={controller} view={view} />}
          </main>
          {view.active && panelVisible(panelState, 'right') && (
            <Panel side="right" controller={controller} view={view} />
          )}
        </div>
        {view.problem && (
          <div className={styles.problem} role="alert">
            <strong>{view.problem.message}</strong>
            <span>{view.problem.recovery}</span>
          </div>
        )}
        <Recovery controller={controller} view={view} />
        <footer className={styles.status}>
          <span role="status">{view.status}</span>
          <span>{view.connected ? 'Connected to local workspace' : 'Service disconnected'}</span>
        </footer>
        <CreateDialog
          open={creating}
          onClose={() => setCreating(false)}
          onCreate={(title) => {
            setCreating(false);
            void controller.create(title);
          }}
          portal={slots.portal}
        />
      </div>
    );
  }
  return WorkspaceShell;
}
