import type { ComponentType, ReactElement } from 'react';
import type { ReactBindings } from '@novakai/canvas-design-system';
import type { PanelTabsProps } from '../../contract/react-types.js';
/** Design System owns tab keyboard/focus behavior; shell owns the selected role. */
export function createPanelTabs({
  Tabs,
}: Pick<ReactBindings, 'Tabs'>): ComponentType<PanelTabsProps> {
  return function PanelTabs(props: PanelTabsProps): ReactElement {
    return (
      <Tabs
        label={props.label}
        value={props.value}
        items={props.items}
        keepMounted
        onValueChange={(value) => {
          const item = props.items.find((item) => item.id === value);
          if (item) props.onSelect(item.id);
        }}
      />
    );
  };
}
