import type { ComponentType, ReactElement } from 'react';
import type {
  ControlsProps,
  RenderSlots,
  ControlIconProps,
  PaletteItem,
} from '../../contract/react-types.js';
import { paletteType } from '../../contract/react-types.js';
import styles from './CanvasControls.module.css';
/** Labelled controls expose explicit navigation; no node click or inspect action performs a hidden Fit. */
export function createCanvasControls(
  slots: Pick<RenderSlots, 'Button'> & { readonly Icon: ComponentType<ControlIconProps> },
): ComponentType<ControlsProps> {
  const Button = slots.Button;
  const Icon = slots.Icon;
  /** Render current tool, zoom and reading controls; host reports failed transitions. */
  function CanvasControls({
    snapshot,
    actions,
    outlineOpen,
    onOutline,
    visibility,
    palette,
  }: ControlsProps): ReactElement {
    const { state, view } = snapshot;
    const center = { x: view.camera.viewport.width / 2, y: view.camera.viewport.height / 2 };
    const toolButtons = (['select', 'hand', 'connect'] as const).map((tool) => (
      <Button
        key={tool}
        label={tool}
        title={
          { select: 'Select objects', hand: 'Pan the canvas', connect: 'Connect objects' }[tool]
        }
        icon={<Icon name={tool} />}
        iconOnly
        selected={view.tool === tool}
        disabled={tool === 'connect' && !view.editable}
        onClick={() => actions.dispatch({ kind: 'tool', tool })}
      />
    ));
    return (
      <>
        <div
          className={`nodrag nopan ${styles.controls} ${styles.tools}`}
          role="toolbar"
          aria-label="Canvas tools"
        >
          {visibility.tools && (
            <>
              {toolButtons}
              <Button
                label={state.reading === null ? 'Reading mode' : 'Exit reading'}
                title={state.reading === null ? 'Reading mode' : 'Exit reading'}
                icon={<Icon name="reading" />}
                iconOnly
                selected={state.reading !== null}
                onClick={() =>
                  actions.dispatch({
                    kind: 'reading',
                    action: state.reading === null ? 'enter' : 'exit',
                  })
                }
              />
              {state.reading !== null && (
                <>
                  <Button
                    label="Previous section"
                    title="Previous section"
                    icon={<Icon name="previous" />}
                    iconOnly
                    onClick={() => actions.dispatch({ kind: 'reading', action: 'previous' })}
                  />
                  <Button
                    label="Next section"
                    title="Next section"
                    icon={<Icon name="next" />}
                    iconOnly
                    onClick={() => actions.dispatch({ kind: 'reading', action: 'next' })}
                  />
                </>
              )}
            </>
          )}
          {visibility.outline && (
            <Button
              label="Diagram outline"
              title="Diagram outline"
              icon={<Icon name="outline" />}
              iconOnly
              selected={outlineOpen}
              onClick={onOutline}
            />
          )}
          {visibility.tools && view.editable && <Palette items={palette} />}
        </div>
        <div
          className={`nodrag nopan ${styles.controls} ${styles.viewport}`}
          role="toolbar"
          aria-label="Canvas view controls"
        >
          {visibility.zoom && (
            <>
              <Button
                label="Zoom out"
                title="Zoom out"
                icon={<Icon name="minus" />}
                iconOnly
                onClick={() =>
                  actions.dispatch({
                    kind: 'zoom',
                    factor:
                      Math.max(state.profile.zoomMin, view.camera.zoom - state.profile.zoomStep) /
                      view.camera.zoom,
                    pointer: center,
                  })
                }
              />
              <output aria-label="Zoom level">{Math.round(view.camera.zoom * 100)}%</output>
              <Button
                label="Zoom in"
                title="Zoom in"
                icon={<Icon name="plus" />}
                iconOnly
                onClick={() =>
                  actions.dispatch({
                    kind: 'zoom',
                    factor: (view.camera.zoom + state.profile.zoomStep) / view.camera.zoom,
                    pointer: center,
                  })
                }
              />
            </>
          )}
          {visibility.tools && (
            <Button
              label="Fit collection"
              title="Fit collection"
              icon={<Icon name="fit" />}
              iconOnly
              onClick={() => actions.dispatch({ kind: 'fit', target: null })}
            />
          )}
        </div>
      </>
    );
  }
  return CanvasControls;
}
/** Object types to drag onto the canvas. Dropping is handled by the surface. */
function Palette({ items }: { readonly items: readonly PaletteItem[] }): ReactElement | null {
  if (items.length === 0) return null;
  return (
    <div className={styles.palette} role="group" aria-label="Add by dragging">
      {items.map((item) => (
        <div
          key={item.kind}
          className={styles.chip}
          draggable
          title={`Drag onto the canvas to add a ${item.label.toLowerCase()}`}
          onDragStart={(event) => {
            event.dataTransfer.setData(paletteType, item.kind);
            event.dataTransfer.effectAllowed = 'copy';
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
