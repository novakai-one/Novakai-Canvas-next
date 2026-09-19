import { useState } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { ViewMenuProps, DesignSlots } from '../../contract/react-types.js';
import type { PanelController, InterfaceControl } from '../../contract/panel-types.js';

/** View owns temporary interface visibility while the workspace retains diagram and draft state. */
export function createViewMenu(
  { Button, Menu }: Pick<DesignSlots, 'Button' | 'Menu'>,
  panels: PanelController,
  portal: HTMLElement,
): ComponentType<ViewMenuProps> {
  function ViewMenu({ controller, view }: ViewMenuProps): ReactElement {
    const [open, setOpen] = useState(false);
    const visibility = panels.getSnapshot().interfaceVisibility;
    const items = viewItems(view, visibility, controller, panels);
    return (
      <Menu
        label="View options"
        trigger={<Button label="View" selected={open} />}
        items={items}
        portal={portal}
        open={open}
        onOpenChange={setOpen}
      />
    );
  }
  return ViewMenu;
}

function viewItems(
  view: ViewMenuProps['view'],
  visibility: ReturnType<PanelController['getSnapshot']>['interfaceVisibility'],
  controller: ViewMenuProps['controller'],
  panels: PanelController,
) {
  return [
    {
      id: 'source',
      label: sourceLabel(view.sourceOpen),
      disabled: view.active === null,
      onSelect: () => void controller.showSource(!view.sourceOpen),
    },
    controlItem('tools', visibility.tools, 'canvas tools', panels),
    controlItem('zoom', visibility.zoom, 'zoom controls', panels),
    controlItem('minimap', visibility.minimap, 'minimap', panels),
    controlItem('outline', visibility.outline, 'diagram outline', panels),
    {
      id: 'hide-all',
      label: 'Hide all interface',
      disabled: view.active === null,
      onSelect: () => panels.hideInterface(),
    },
  ];
}

function sourceLabel(open: boolean): string {
  return open ? 'Hide source editor' : 'Show source editor';
}

function controlItem(
  control: InterfaceControl,
  visible: boolean,
  label: string,
  panels: PanelController,
) {
  return {
    id: control,
    label: `${visible ? 'Hide' : 'Show'} ${label}`,
    onSelect: () => panels.setInterfaceVisibility(control, !visible),
  };
}
