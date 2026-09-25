import type { Result } from './errors.js';
import type { DraftRetention } from './ports/workspace.js';
import type { PanelId, PanelPreferences, PanelState } from './records/panels.js';
/** Panel state records live in records/panels.ts so Web core can read them. */
export type {
  InterfaceVisibility,
  PanelId,
  PanelMode,
  PanelPreferences,
  PanelState,
} from './records/panels.js';
export type PanelTab = 'add' | 'browse' | 'inspect' | 'settings';
export type InterfaceControl = 'tools' | 'zoom' | 'minimap' | 'outline' | 'roads' | 'labels';
/** Definitions describe trusted features; persisted layout contains only stable IDs and preferences. */
export interface PanelSectionDefinition {
  readonly id: string;
  readonly title: string;
  readonly defaultSide: PanelId;
  readonly defaultExpanded: boolean;
}
export interface PanelSizing {
  readonly canvasMinimum?: number;
  readonly medium: number;
  readonly large: number;
  readonly sides: Readonly<
    Record<PanelId, { readonly width: number; readonly minimum: number; readonly maximum: number }>
  >;
}
export interface PanelController {
  getSnapshot(): PanelState;
  subscribe(listener: () => void): () => void;
  restore(workspace: string): void;
  open(
    side: PanelId,
    open: boolean,
  ): void;
  selectTab(tab: PanelTab): void;
  viewport(width: number): void;
  resize(
    side: PanelId,
    width: number,
  ): void;
  expand(
    id: string,
    expanded: boolean,
  ): void;
  hide(
    id: string,
    hidden: boolean,
  ): void;
  move(
    id: string,
    side: PanelId,
    index: number,
  ): void;
  customize(open: boolean): void;
  reset(): void;
  setInterfaceVisibility(
    control: InterfaceControl,
    visible: boolean,
  ): void;
  hideInterface(): void;
  revealInterface(): void;
}
export interface PanelBindings {
  readonly definitions: readonly PanelSectionDefinition[];
  readonly sizing: PanelSizing;
  readonly initialWidth: number;
  readonly retention: DraftRetention;
  read(
    input: unknown,
    workspace: string,
  ): Result<PanelPreferences>;
  report(message: string): void;
}
