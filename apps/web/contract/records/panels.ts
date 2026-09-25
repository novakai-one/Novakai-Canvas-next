/*
 * Panel state vocabulary: which side panels are open, the saved panel preferences and which
 * interface controls show. Web core reads these records to lay out the shell; `panel-types.ts`
 * re-exports them beside the panel controller and bindings.
 */

/** The two side panels. */
export type PanelId = 'left' | 'right';

/** How the panels sit beside the canvas at the current viewport width. */
export type PanelMode = 'docked' | 'overlay' | 'sheet';

/** Which interface controls show, and whether the whole interface is hidden. */
export interface InterfaceVisibility {
  readonly roads: boolean;
  readonly labels: boolean;
  readonly hidden: boolean;
  readonly tools: boolean;
  readonly zoom: boolean;
  readonly minimap: boolean;
  readonly outline: boolean;
}

/** Saved panel layout: section order and state, panel widths and each panel's tab. */
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
  readonly interfaceVisibility: InterfaceVisibility;
}
