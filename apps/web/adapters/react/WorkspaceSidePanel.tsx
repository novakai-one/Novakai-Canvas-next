import { useSyncExternalStore } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { PanelProps, FeatureProps, DesignSlots } from '../../contract/react-types.js';
import type {
  PanelController,
  PanelSizing,
  PanelMode,
  PanelId,
} from '../../contract/panel-types.js';
import styles from './WorkspaceSidePanel.module.css';
/** Definitions and renderers are trusted registration data; user preferences can arrange IDs but cannot supply code. */
export interface RegisteredSection {
  readonly id: string;
  readonly title: string;
  readonly Content: ComponentType<FeatureProps>;
}
export interface PanelSlots extends DesignSlots {
  readonly sections: readonly RegisteredSection[];
  readonly panels: PanelController;
  readonly sizing: PanelSizing;
  readonly portal: HTMLElement;
}
/** One composition serves docked panels, modal side overlays and bottom sheets. Drafts live in feature controllers across remounts. */
export function createWorkspaceSidePanel(slots: PanelSlots): ComponentType<PanelProps> {
  const {
    SidePanel,
    PanelHeader,
    PanelBody,
    PanelBodyHeader,
    PanelSection,
    PanelSectionHeader,
    Dialog,
    Button,
  } = slots;
  /** Panel preferences own order, visibility and collapse; changing the body requires registration data only. */
  function WorkspaceSidePanel(props: PanelProps): ReactElement {
    const state = useSyncExternalStore(slots.panels.subscribe, slots.panels.getSnapshot);
    const preferences = state.preferences;
    const title = { left: 'Collection', right: 'Inspector' }[props.side];
    const registered = preferences.sections[props.side].flatMap((id) =>
      slots.sections.filter((item) => item.id === id),
    );
    const sections = registered.filter(
      (item) => state.customize || !preferences.hidden.includes(item.id),
    );
    const actions = (
      <Button
        label="Customize panels"
        icon="⚙"
        iconOnly
        selected={state.customize}
        onClick={() => slots.panels.customize(!state.customize)}
      />
    );
    const body = (
      <PanelBody
        header={
          <PanelBodyHeader
            title={props.view.active?.document.collection.title ?? 'Workspace'}
            scope="Shared collection"
            actions={actions}
          />
        }
      >
        {state.customize && (
          <div className={styles.customize}>
            <p>Move, hide or reorder sections. Diagram content is unchanged.</p>
            <Button label="Reset panel layout" onClick={slots.panels.reset} />
          </div>
        )}
        {sections.map((section, index) => {
          const Content = section.Content;
          const expanded = !preferences.collapsed.includes(section.id);
          return (
            <div key={section.id}>
              {state.customize && (
                <div className={styles.customize} aria-label={`Customize ${section.title}`}>
                  <Button
                    label={`Move ${section.title} up`}
                    icon="↑"
                    iconOnly
                    disabled={index === 0}
                    onClick={() => slots.panels.move(section.id, props.side, index - 1)}
                  />
                  <Button
                    label={`Move ${section.title} down`}
                    icon="↓"
                    iconOnly
                    disabled={index === sections.length - 1}
                    onClick={() => slots.panels.move(section.id, props.side, index + 1)}
                  />
                  <Button
                    label={`Move ${section.title} to other panel`}
                    icon="↔"
                    iconOnly
                    onClick={() =>
                      slots.panels.move(section.id, props.side === 'left' ? 'right' : 'left', 0)
                    }
                  />
                  <Button
                    label={`${preferences.hidden.includes(section.id) ? 'Show' : 'Hide'} ${section.title}`}
                    selected={preferences.hidden.includes(section.id)}
                    onClick={() =>
                      slots.panels.hide(section.id, !preferences.hidden.includes(section.id))
                    }
                  />
                </div>
              )}
              <PanelSection
                id={section.id}
                expanded={expanded}
                header={
                  <PanelSectionHeader
                    id={section.id}
                    title={section.title}
                    expanded={expanded}
                    onExpandedChange={(open) => slots.panels.expand(section.id, open)}
                  />
                }
              >
                <Content {...props} />
              </PanelSection>
            </div>
          );
        })}
      </PanelBody>
    );
    if (state.mode !== 'docked')
      return (
        <Dialog
          open
          title={title}
          description="Workspace tools"
          placement={placement(state.mode, props.side)}
          portal={slots.portal}
          onOpenChange={(open) => slots.panels.open(props.side, open)}
        >
          {body}
        </Dialog>
      );
    return (
      <SidePanel
        id={`panel-${props.side}`}
        side={props.side}
        label={title}
        width={preferences.widths[props.side]}
        minimum={slots.sizing.sides[props.side].minimum}
        maximum={slots.sizing.sides[props.side].maximum}
        onResize={(width) => slots.panels.resize(props.side, width)}
        header={<PanelHeader title={title} onClose={() => slots.panels.open(props.side, false)} />}
        body={body}
      />
    );
  }
  return WorkspaceSidePanel;
}

/** Modal geometry is chosen from shell mode; the shared Dialog owns its token styling and focus behavior. */
function placement(mode: PanelMode, side: PanelId): 'left' | 'right' | 'bottom' {
  if (mode === 'sheet') return 'bottom';
  return side;
}
