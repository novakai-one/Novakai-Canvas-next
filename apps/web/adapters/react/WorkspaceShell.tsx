import { formatFailure, failureSummary } from '../../contract/api.js';
import { panelVisible, palette, planPaletteDrop } from '../../contract/api.js';
import type { PaletteDrop } from '../../contract/api.js';
import { useState, useSyncExternalStore, useEffect, useRef } from 'react';
import type { ComponentType, ReactElement, RefObject } from 'react';
import type { ChromeSlots, WorkspaceProps } from '../../contract/react-types.js';
import type { PanelState } from '../../contract/panel-types.js';
import type { WorkspaceController, WorkspaceView } from '../../contract/records/workspace.js';
import styles from './WorkspaceShell.module.css';
/** The work surface is the primary content; chrome uses stable injected sections and shared design tokens. */
export function createWorkspaceShell(slots: ChromeSlots): ComponentType<WorkspaceProps> {
  /** Mount owns subscription lifetime. Selection and panning remain entirely inside the Canvas session. */
  function WorkspaceShell({ controller }: WorkspaceProps): ReactElement {
    const view = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
    const panelState = useSyncExternalStore(slots.panels.subscribe, slots.panels.getSnapshot);
    const navigationContext = view.active ?? view.opening;
    const hidden = panelState.interfaceVisibility.hidden;
    const [creating, setCreating] = useState(false);
    useEffect(() => {
      void controller.start();
      return controller.dispose;
    }, [controller]);
    useEffect(() => {
      if (!hidden) return undefined;
      const reveal = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        slots.panels.revealInterface();
      };
      window.addEventListener('keydown', reveal);
      return () => window.removeEventListener('keydown', reveal);
    }, [hidden]);
    return (
      <WorkspaceFrame
        slots={slots}
        controller={controller}
        view={view}
        panelState={panelState}
        navigationContext={navigationContext}
        hidden={hidden}
        creating={creating}
        setCreating={setCreating}
      />
    );
  }
  return WorkspaceShell;
}

const hiddenChrome = { tools: false, zoom: false, minimap: false, outline: false } as const;

interface WorkspaceFrameProps {
  readonly slots: ChromeSlots;
  readonly controller: WorkspaceController;
  readonly view: WorkspaceView;
  readonly panelState: PanelState;
  readonly navigationContext: WorkspaceView['active'] | string | null;
  readonly hidden: boolean;
  readonly creating: boolean;
  readonly setCreating: (value: boolean) => void;
}

function WorkspaceFrame({
  slots,
  controller,
  view,
  panelState,
  navigationContext,
  hidden,
  creating,
  setCreating,
}: WorkspaceFrameProps): ReactElement {
  const { FontDefinitions, Header, CreateDialog, Chooser } = slots;
  return (
    <div className={styles.shell}>
      <FontDefinitions fonts={view.active?.document.fonts} />
      <HeaderSlot
        hidden={hidden}
        Header={Header}
        controller={controller}
        view={view}
        setCreating={setCreating}
      />
      <WorkspaceBody
        slots={slots}
        controller={controller}
        view={view}
        panelState={panelState}
        navigationContext={navigationContext}
        hidden={hidden}
        setCreating={setCreating}
      />
      <StatusSlot hidden={hidden} view={view} />
      <RevealSlot hidden={hidden} Reveal={slots.Reveal} onReveal={slots.panels.revealInterface} />
      <Chooser
        controller={controller}
        view={view}
        onCreate={() => {
          controller.cancelCollectionSwitch();
          setCreating(true);
        }}
        portal={slots.portal}
      />
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

function HeaderSlot({
  hidden,
  Header,
  controller,
  view,
  setCreating,
}: {
  readonly hidden: boolean;
  readonly Header: ChromeSlots['Header'];
  readonly controller: WorkspaceController;
  readonly view: WorkspaceView;
  readonly setCreating: (value: boolean) => void;
}): ReactElement | null {
  if (hidden) return null;
  return (
    <Header
      controller={controller}
      view={view}
      onCreate={() => setCreating(true)}
      onOpenChooser={controller.beginCollectionSwitch}
    />
  );
}

function WorkspaceBody({
  slots,
  controller,
  view,
  panelState,
  navigationContext,
  hidden,
  setCreating,
}: Omit<WorkspaceFrameProps, 'creating' | 'setCreating'> & {
  readonly setCreating: (value: boolean) => void;
}): ReactElement {
  return (
    <div className={styles.workspace}>
      <PanelSlot
        hidden={hidden}
        side="left"
        visible={panelVisible(panelState, 'left')}
        hasContext={navigationContext !== null}
        Panel={slots.Panel}
        controller={controller}
        view={view}
      />
      <CanvasSlot
        slots={slots}
        controller={controller}
        view={view}
        panelState={panelState}
        hidden={hidden}
        setCreating={setCreating}
      />
      <PanelSlot
        hidden={hidden}
        side="right"
        visible={panelVisible(panelState, 'right')}
        hasContext={view.active !== null}
        Panel={slots.Panel}
        controller={controller}
        view={view}
      />
    </div>
  );
}

function PanelSlot({
  hidden,
  side,
  visible,
  hasContext,
  Panel,
  controller,
  view,
}: {
  readonly hidden: boolean;
  readonly side: 'left' | 'right';
  readonly visible: boolean;
  readonly hasContext: boolean;
  readonly Panel: ChromeSlots['Panel'];
  readonly controller: WorkspaceController;
  readonly view: WorkspaceView;
}): ReactElement | null {
  return !hidden && visible && hasContext ? (
    <Panel side={side} controller={controller} view={view} />
  ) : null;
}

function CanvasSlot({
  slots,
  controller,
  view,
  panelState,
  hidden,
  setCreating,
}: Omit<WorkspaceFrameProps, 'navigationContext' | 'creating' | 'setCreating'> & {
  readonly setCreating: (value: boolean) => void;
}): ReactElement {
  const { CanvasSurface, Library, Source } = slots;
  const active = view.active;
  const clearance = useAlertClearance();
  const chrome = hidden
    ? hiddenChrome
    : {
        tools: panelState.interfaceVisibility.tools,
        zoom: panelState.interfaceVisibility.zoom,
        minimap: panelState.interfaceVisibility.minimap,
        outline: panelState.interfaceVisibility.outline,
      };
  return (
    <main
      ref={clearance.host}
      className={styles.canvas}
      data-canvas-host
      aria-label="Diagram workspace"
    >
      {active === null ? (
        <Library controller={controller} view={view} onCreate={() => setCreating(true)} />
      ) : (
        <CanvasSurface
          followsInterfaceRoles={active.document.style.followsInterfaceRoles === true}
          session={active.session}
          reader={active.canvas}
          nextGestureId={slots.nextGestureId}
          onError={controller.report}
          paint={{
            fill: active.document.style.surface,
            stroke: active.document.style.roles.neutral?.stroke ?? active.document.style.text,
            text: active.document.style.text,
          }}
          label={active.document.collection.title}
          chrome={chrome}
          showRoads={panelState.interfaceVisibility.roads && !hidden}
          palette={palette}
          onPaletteDrop={(kind, target) =>
            dropObject(
              controller,
              planPaletteDrop(active.document.collection.sections, kind, target),
            )
          }
          showLabels={panelState.interfaceVisibility.labels}
        />
      )}
      {!hidden && view.sourceOpen && <Source controller={controller} view={view} />}
      <slots.MovementReview controller={controller} view={view} />
      {/* Alerts overlay the bottom of the canvas and never shift layout. */}
      <div ref={clearance.alerts} className={alertsClass(active, chrome.zoom)}>
        <ProblemSlot
          hidden={hidden || view.collectionSwitch.phase !== 'idle'}
          Button={slots.Button}
          controller={controller}
          view={view}
        />
        <RecoverySlot
          hidden={hidden}
          Recovery={slots.Recovery}
          controller={controller}
          view={view}
        />
      </div>
    </main>
  );
}

/** Publishes the alerts' height as --nv-alert-clearance so scrolling views (the Library) can pad
 * their end and never hide their last item under an alert. */
function useAlertClearance(): {
  readonly host: RefObject<HTMLElement | null>;
  readonly alerts: RefObject<HTMLDivElement | null>;
} {
  const host = useRef<HTMLElement>(null);
  const alerts = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = alerts.current;
    const main = host.current;
    if (box === null || main === null) return undefined;
    const observer = new ResizeObserver(() => {
      main.style.setProperty('--nv-alert-clearance', `${box.offsetHeight}px`);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  return { host, alerts };
}

/** Alerts clear the zoom controls only when a canvas shows them; the Library has none. */
function alertsClass(active: WorkspaceView['active'], zoom: boolean): string | undefined {
  return active !== null && zoom ? `${styles.alerts} ${styles.alertsAboveZoom}` : styles.alerts;
}

/** UI wiring for a palette drop; the decision itself is made in core. */
function dropObject(controller: WorkspaceController, drop: PaletteDrop): void {
  if (drop.kind === 'refuse') controller.report(drop.problem);
  if (drop.kind === 'add') void controller.addObject(drop.draft);
}

function ProblemSlot({
  hidden,
  Button,
  controller,
  view,
}: {
  readonly hidden: boolean;
  readonly Button: ChromeSlots['Button'];
  readonly controller: WorkspaceController;
  readonly view: WorkspaceView;
}): ReactElement | null {
  if (hidden) return null;
  if (view.problem === null) return null;
  return (
    <div className={styles.problem} role="alert">
      <div className={styles.problemText}>
        <strong>{failureSummary(view.problem)}</strong>
        <details>
          <summary>Technical details</summary>
          {formatFailure(view.problem).map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </details>
      </div>
      <Button label="Dismiss error" icon="×" iconOnly onClick={controller.dismissProblem} />
    </div>
  );
}

function RecoverySlot({
  hidden,
  Recovery,
  controller,
  view,
}: {
  readonly hidden: boolean;
  readonly Recovery: ChromeSlots['Recovery'];
  readonly controller: WorkspaceController;
  readonly view: WorkspaceView;
}): ReactElement | null {
  if (hidden) return null;
  return <Recovery controller={controller} view={view} />;
}

function StatusSlot({
  hidden,
  view,
}: {
  readonly hidden: boolean;
  readonly view: WorkspaceView;
}): ReactElement | null {
  if (hidden) return null;
  return (
    <footer className={styles.status}>
      <span role="status">{view.status}</span>
      <span>{view.connected ? 'Connected to local workspace' : 'Service disconnected'}</span>
    </footer>
  );
}

function RevealSlot({
  hidden,
  Reveal,
  onReveal,
}: {
  readonly hidden: boolean;
  readonly Reveal: ChromeSlots['Reveal'];
  readonly onReveal: () => void;
}): ReactElement | null {
  if (!hidden) return null;
  return <Reveal onReveal={onReveal} />;
}
