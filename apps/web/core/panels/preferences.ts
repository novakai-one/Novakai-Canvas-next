import type {
  PanelId,
  PanelPreferences,
  PanelSectionDefinition,
  PanelSizing,
} from '../../contract/panel-types.js';
/** Moving removes the stable ID from both sides first, preventing duplicate sections after repeated moves. */
export function movePanelSection(
  preferences: PanelPreferences,
  id: string,
  side: PanelId,
  index: number,
): PanelPreferences {
  const sections = {
    left: preferences.sections.left.filter((item) => item !== id),
    right: preferences.sections.right.filter((item) => item !== id),
  };
  const current = sections[side];
  const position = Math.max(0, Math.min(current.length, index));
  return {
    ...preferences,
    sections: {
      ...sections,
      [side]: [...current.slice(0, position), id, ...current.slice(position)],
    },
  };
}
/** Membership operations are idempotent and retain all other preference dimensions. */
export function panelMembership(
  ids: readonly string[],
  id: string,
  present: boolean,
): readonly string[] {
  const remaining = ids.filter((item) => item !== id);
  return present ? [...remaining, id] : remaining;
}
/** Unknown/removed saved IDs are ignored; newly registered sections appear in their declared default location. */
export function reconcilePanelPreferences(
  saved: PanelPreferences,
  definitions: readonly PanelSectionDefinition[],
  sizing: PanelSizing,
): PanelPreferences {
  const known = new Set(definitions.map((item) => item.id));
  const left = [...new Set(saved.sections.left)].filter((id) => known.has(id));
  const right = [...new Set(saved.sections.right)].filter(
    (id) => known.has(id) && !left.includes(id),
  );
  const missing = definitions.filter((item) => !left.includes(item.id) && !right.includes(item.id));
  return {
    ...saved,
    sections: {
      left: [...left, ...newOnSide(missing, 'left')],
      right: [...right, ...newOnSide(missing, 'right')],
    },
    collapsed: [
      ...new Set([
        ...saved.collapsed.filter((id) => known.has(id)),
        ...missing.filter((item) => !item.defaultExpanded).map((item) => item.id),
      ]),
    ],
    hidden: saved.hidden.filter((id) => known.has(id)),
    widths: {
      left: panelWidth(saved.widths.left, sizing.sides.left),
      right: panelWidth(saved.widths.right, sizing.sides.right),
    },
  };
}
/** New registrations do not overwrite existing user order. */
function newOnSide(
  definitions: readonly PanelSectionDefinition[],
  side: PanelId,
): readonly string[] {
  return definitions.filter((item) => item.defaultSide === side).map((item) => item.id);
}
/** Nonfinite values retain the declared default; valid requests are clamped to the same bounds used by the shared resize control. */
export function panelWidth(
  width: number,
  bounds: { readonly width: number; readonly minimum: number; readonly maximum: number },
): number {
  if (!Number.isFinite(width)) return bounds.width;
  return Math.min(bounds.maximum, Math.max(bounds.minimum, width));
}
