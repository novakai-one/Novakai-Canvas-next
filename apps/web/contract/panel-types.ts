import type { Result } from './errors.js';
import type { DraftRetention } from './ports/workspace.js';
export type PanelId = 'left' | 'right';
export type PanelTab = 'add' | 'browse' | 'inspect' | 'settings';
export type PanelMode = 'docked' | 'overlay' | 'sheet';
/** Definitions describe trusted features; persisted layout contains only stable IDs and preferences. */
export interface PanelSectionDefinition {
  readonly id: string;
  readonly title: string;
  readonly defaultSide: PanelId;
  readonly defaultExpanded: boolean;
}
export interface PanelPreferences {
  readonly schemaVersion: 1;
  readonly workspace: string;
  readonly sections: Readonly<Record<PanelId, readonly string[]>>;
  readonly collapsed: readonly string[];
  readonly hidden: readonly string[];
  readonly widths: Readonly<Record<PanelId, number>>;
  readonly tabs: Readonly<{ left: 'add' | 'browse'; right: 'inspect' | 'settings' }>;
}
/** The web shell alone owns panel visibility. Canvas camera and editor draft data never enter this state. */
export interface PanelState {
  readonly mode: PanelMode;
  readonly viewportWidth: number;
  readonly docked: Readonly<Record<PanelId, boolean>>;
  readonly overlay: PanelId | null;
  readonly lastOpened: PanelId;
  readonly customize: boolean;
  readonly preferences: PanelPreferences;
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
  open(side: PanelId, open: boolean): void;
  selectTab(tab: PanelTab): void;
  viewport(width: number): void;
  resize(side: PanelId, width: number): void;
  expand(id: string, expanded: boolean): void;
  hide(id: string, hidden: boolean): void;
  move(id: string, side: PanelId, index: number): void;
  customize(open: boolean): void;
  reset(): void;
}
export interface PanelBindings {
  readonly definitions: readonly PanelSectionDefinition[];
  readonly sizing: PanelSizing;
  readonly initialWidth: number;
  readonly retention: DraftRetention;
  read(input: unknown, workspace: string): Result<PanelPreferences>;
  report(message: string): void;
}
