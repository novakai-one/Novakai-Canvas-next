import type { ReactNode, ReactElement, ComponentType, ButtonHTMLAttributes, Ref } from 'react';
import type { ScopeTarget } from './ports/scope-target.js';
/** Native semantics, semantic variants and a mandatory readable label; no domain state or visual literals. */
export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'style' | 'className' | 'dangerouslySetInnerHTML'
> {
  readonly label: string;
  readonly icon?: ReactNode;
  readonly iconOnly?: boolean;
  readonly variant?: 'default' | 'primary';
  readonly selected?: boolean;
  readonly pending?: boolean;
  readonly ref?: Ref<HTMLButtonElement>;
}
export interface FieldControlProps {
  readonly id: string;
  readonly 'aria-invalid': boolean;
  readonly 'aria-describedby': string | undefined;
  readonly required: boolean;
}
export interface FieldProps {
  readonly id?: string;
  readonly label: string;
  readonly help?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly control: (props: FieldControlProps) => ReactNode;
}
export interface DialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: string;
  readonly trigger?: ReactElement;
  readonly children: ReactNode;
  readonly portal: HTMLElement;
  readonly closeLabel?: string;
}
export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly onSelect: () => void;
}
export interface MenuProps {
  readonly label: string;
  readonly trigger: ReactElement;
  readonly items: readonly MenuItem[];
  readonly portal: HTMLElement;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}
export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly content: ReactNode;
  readonly disabled?: boolean;
}
export interface TabsProps {
  readonly label: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly items: readonly TabItem[];
  readonly keepMounted?: boolean;
}
export interface TooltipProps {
  readonly label: string;
  readonly children: ReactElement;
  readonly portal: HTMLElement;
  readonly disabled?: boolean;
}
export interface StatusMessageProps {
  readonly tone: 'info' | 'success' | 'warning' | 'error';
  readonly label: string;
  readonly children?: ReactNode;
}
/** Host owns panel placement and applicable sections. These slots cannot inspect collection IDs. */
export interface SidePanelProps {
  readonly id: string;
  readonly label: string;
  readonly side: 'left' | 'right';
  readonly header: ReactNode;
  readonly body: ReactNode;
  readonly width: number;
  readonly minimum: number;
  readonly maximum: number;
  readonly onResize: (width: number) => void;
}
export interface PanelHeaderProps {
  readonly title: string;
  readonly actions?: ReactNode;
  readonly onClose?: () => void;
}
export interface PanelBodyProps {
  readonly header?: ReactNode;
  readonly children: ReactNode;
}
export interface PanelBodyHeaderProps {
  readonly title: string;
  readonly scope?: string;
  readonly actions?: ReactNode;
}
export interface PanelSectionProps {
  readonly id: string;
  readonly expanded: boolean;
  readonly header: ReactNode;
  readonly children: ReactNode;
}
export interface PanelSectionHeaderProps {
  readonly id: string;
  readonly title: string;
  readonly expanded: boolean;
  readonly onExpandedChange: (expanded: boolean) => void;
  readonly actions?: ReactNode;
}
export interface PanelSectionBodyProps {
  readonly id: string;
  readonly expanded: boolean;
  readonly children: ReactNode;
}
export interface ReactBindings {
  readonly Button: ComponentType<ButtonProps>;
  readonly Field: ComponentType<FieldProps>;
  readonly Dialog: ComponentType<DialogProps>;
  readonly Menu: ComponentType<MenuProps>;
  readonly Tabs: ComponentType<TabsProps>;
  readonly Tooltip: ComponentType<TooltipProps>;
  readonly StatusMessage: ComponentType<StatusMessageProps>;
  readonly SidePanel: ComponentType<SidePanelProps>;
  readonly PanelHeader: ComponentType<PanelHeaderProps>;
  readonly PanelBody: ComponentType<PanelBodyProps>;
  readonly PanelBodyHeader: ComponentType<PanelBodyHeaderProps>;
  readonly PanelSection: ComponentType<PanelSectionProps>;
  readonly PanelSectionHeader: ComponentType<PanelSectionHeaderProps>;
  readonly PanelSectionBody: ComponentType<PanelSectionBodyProps>;
  readonly createScopeTarget: (element: HTMLElement) => ScopeTarget;
}
