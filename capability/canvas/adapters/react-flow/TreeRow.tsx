import { memo } from 'react';
import type { ComponentType, ReactElement, MouseEvent } from 'react';
import type { TreeRowProps, RenderSlots } from '../../contract/react-types.js';
import styles from './TreeRow.module.css';

/** The label uses Presentation's exact measurement; this component owns only the disclosure control. */
export function createTreeRow(
  slots: Pick<RenderSlots, 'MeasuredContent' | 'NodeContent'>,
): ComponentType<TreeRowProps> {
  const Content = slots.MeasuredContent;
  const NodeContent = slots.NodeContent;
  function TreeRow({ view, actions }: TreeRowProps): ReactElement {
    const row = view.placed.measured.treeRow;
    const disclosure = disclosureState(view.tree?.collapsed === true);
    function toggle(event: MouseEvent<HTMLButtonElement>): void {
      event.stopPropagation();
      actions.dispatch({ kind: 'collapse', target: view.target });
    }
    return (
      <div
        className={styles.row}
        data-tree-row
        data-compact={row !== undefined}
        data-selected={view.selected}
      >
        {row === undefined ? (
          <NodeContent
            node={{ ...view.placed.measured, width: view.box.width, height: view.box.height }}
            embedFonts={false}
            surface="canvas"
            detail={view.detail}
            emphasis={view.emphasis}
            hovered={view.hovered}
          />
        ) : (
          <svg
            width={view.box.width}
            height={view.box.height}
            aria-label={view.placed.measured.label}
          >
            <Content content={view.placed.measured.content} embedFonts={false} />
          </svg>
        )}
        {view.tree?.folder && (
          <button
            type="button"
            className={`${styles.toggle} nodrag nopan`}
            style={{ width: row?.gutter, height: row?.height }}
            aria-label={`${disclosure.label} ${view.placed.measured.label}`}
            aria-expanded={!view.tree.collapsed}
            onClick={toggle}
          >
            {disclosure.glyph}
          </button>
        )}
      </div>
    );
  }
  return memo(TreeRow);
}

function disclosureState(collapsed: boolean): { label: string; glyph: string } {
  return collapsed ? { label: 'Expand', glyph: '▸' } : { label: 'Collapse', glyph: '▾' };
}
