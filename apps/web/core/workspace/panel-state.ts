import type {
  PanelId,
  PanelMode,
  PanelState,
  PanelPreferences,
  PanelSizing,
  PanelSectionDefinition,
} from '../../contract/panel-types.js';
/** Breakpoint thresholds are injected from Design System's resolved variables, matching CSS without another numeric authority. */
export function panelMode(width: number, sizing: Pick<PanelSizing, 'medium' | 'large'>): PanelMode {
  if (width >= sizing.large) return 'docked';
  return width >= sizing.medium ? 'overlay' : 'sheet';
}
/** Opening one transient panel replaces the prior overlay; desktop panels retain independent open state. */
export function openPanel(state: PanelState, side: PanelId, open: boolean): PanelState {
  if (state.mode === 'docked')
    return { ...state, docked: { ...state.docked, [side]: open }, lastOpened: side };
  return { ...state, overlay: open ? side : null, lastOpened: side };
}
/** Responsive changes retain layout and editor identity; only the most recently opened desktop pane becomes modal. */
export function resizePanels(state: PanelState, mode: PanelMode): PanelState {
  if (state.mode === mode) return state;
  return { ...state, mode, overlay: responsiveOverlay(state, mode) };
}
/** Initial narrow layout stays closed; transitioning from desktop establishes at most one modal panel. */
function responsiveOverlay(state: PanelState, mode: PanelMode): PanelId | null {
  if (mode === 'docked') return null;
  if (state.mode !== 'docked') return state.overlay;
  return lastDockedPanel(state);
}
/** Consumers ask one owner whether a side is visible, instead of storing duplicate inspector booleans. */
export function panelVisible(state: PanelState, side: PanelId): boolean {
  if (state.mode === 'docked') return state.docked[side];
  return state.overlay === side;
}
/** Defaults come from registered feature definitions and resolved dimensions. */
export function defaultPanels(
  workspace: string,
  definitions: readonly PanelSectionDefinition[],
  sizing: PanelSizing,
): PanelPreferences {
  return {
    schemaVersion: 1,
    workspace,
    sections: {
      left: defaultsOnSide(definitions, 'left'),
      right: defaultsOnSide(definitions, 'right'),
    },
    collapsed: definitions.filter((item) => !item.defaultExpanded).map((item) => item.id),
    hidden: [],
    widths: { left: sizing.sides.left.width, right: sizing.sides.right.width },
  };
}
/** Registration order is the default order; every definition has one initial side. */
function defaultsOnSide(
  definitions: readonly PanelSectionDefinition[],
  side: PanelId,
): readonly string[] {
  return definitions.filter((item) => item.defaultSide === side).map((item) => item.id);
}

/** A closed last-used pane does not open itself during a responsive transition. */
function lastDockedPanel(state: PanelState): PanelId | null {
  if (!state.docked[state.lastOpened]) return null;
  return state.lastOpened;
}
