import type { ComponentType, ReactElement } from 'react';
import type { ControlsProps, RenderSlots, ControlIconProps } from '../../contract/react-types.js';
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
      <div className={`nodrag nopan ${styles.controls}`} role="toolbar" aria-label="Canvas tools">
        {toolButtons}
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
        <Button
          label="Fit collection"
          onClick={() => actions.dispatch({ kind: 'fit', target: null })}
        />
        <Button
          label="Diagram outline"
          title="Diagram outline"
          icon={<Icon name="outline" />}
          iconOnly
          selected={outlineOpen}
          onClick={onOutline}
        />
        <Button
          label={state.reading === null ? 'Reading mode' : 'Exit reading'}
          onClick={() =>
            actions.dispatch({ kind: 'reading', action: state.reading === null ? 'enter' : 'exit' })
          }
        />
        {state.reading !== null && (
          <>
            <Button
              label="Previous section"
              onClick={() => actions.dispatch({ kind: 'reading', action: 'previous' })}
            />
            <Button
              label="Next section"
              onClick={() => actions.dispatch({ kind: 'reading', action: 'next' })}
            />
          </>
        )}
      </div>
    );
  }
  return CanvasControls;
}
