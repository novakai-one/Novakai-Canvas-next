import type { ReactElement, ComponentType } from 'react';
import type { PanelSectionProps, PanelSectionBodyProps } from '../../../contract/react-types.js';
import styles from './PanelSection.module.css';
/** Bind the body slot once; contents and exposed features can be reorganized without changing the frame. */
export function createPanelSection(
  Body: ComponentType<PanelSectionBodyProps>,
): ComponentType<PanelSectionProps> {
  /** Controlled visibility preserves children; host owns placement, feature registration and drafts. */
  function PanelSection({ id, expanded, header, children }: PanelSectionProps): ReactElement {
    return (
      <section data-section-id={id} className={styles.section}>
        {header}
        <Body id={id} expanded={expanded}>
          {children}
        </Body>
      </section>
    );
  }
  return PanelSection;
}
