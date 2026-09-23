import type { WorkspaceController } from '../../contract/records/workspace.js';

/** Object types the canvas palette offers. */
export const palette = [{ kind: 'module', label: 'Module' }] as const;
/** A palette drop creates a new object of that type in the group (or section) under the pointer. */
export function dropObject(
  controller: Pick<WorkspaceController, 'report' | 'addObject'>,
  sections: readonly { readonly id: string; readonly mode: string; readonly title: string }[],
  kind: string,
  target: { readonly section: string; readonly group: string | null },
): void {
  const item = palette.find((entry) => entry.kind === kind);
  if (item === undefined) return;
  // Tree sections are outlines built from parent links; the Add forms exclude them too.
  const section = sections.find((entry) => entry.id === target.section);
  if (section?.mode === 'tree') {
    controller.report({
      code: 'tree-section-drop',
      message: `${item.label}s can't be dropped into a tree. Drop it into a diagram section instead.`,
      recovery: `"${section.title}" is a tree outline. Nothing was changed.`,
    });
    return;
  }
  void controller.addObject({
    section: target.section,
    group: target.group,
    kind: item.kind,
    label: `New ${item.label.toLowerCase()}`,
    reuseObject: null,
  });
}
