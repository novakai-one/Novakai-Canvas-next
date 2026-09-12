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
/** Accessible attributes supplied by Field; the rendered control must forward them to its native input. */
export interface FieldControlProps {
  readonly id: string;
  readonly 'aria-invalid': boolean;
  readonly 'aria-describedby': string | undefined;
  readonly required: boolean;
}
/** Label/help/error composition for one caller-rendered control; the host owns its value and validation. */
export interface FieldProps {
  readonly id?: string;
  readonly label: string;
  readonly help?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly control: (props: FieldControlProps) => ReactNode;
}
/** Controlled dialog state and an explicit portal; the host owns closing, content and submitted actions. */
export interface DialogProps {
  readonly placement?: 'center' | 'left' | 'right' | 'bottom';
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: string;
  readonly trigger?: ReactElement;
  readonly children: ReactNode;
  readonly portal: HTMLElement;
  readonly closeLabel?: string;
}
/** One host-owned action with a stable selection identity and an optional disabled state. */
export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly onSelect: () => void;
}
/** Controlled action menu; the host supplies its trigger, actions and portal destination. */
export interface MenuProps {
  readonly label: string;
  readonly trigger: ReactElement;
  readonly items: readonly MenuItem[];
  readonly portal: HTMLElement;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}
/** One labelled content panel; identity remains stable when the host reorders tabs. */
export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly content: ReactNode;
  readonly disabled?: boolean;
}
/** Controlled tab selection; keepMounted preserves inactive content when the host requests it. */
export interface TabsProps {
  readonly label: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly items: readonly TabItem[];
  readonly keepMounted?: boolean;
}
/** Supplementary accessible explanation for one trigger inside an explicitly supplied portal. */
export interface TooltipProps {
  readonly label: string;
  readonly children: ReactElement;
  readonly portal: HTMLElement;
  readonly disabled?: boolean;
}
/** Semantic status tone and readable message; the host decides which outcome to announce. */
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
/** Panel title and optional host actions/close callback; contains no capability-specific behavior. */
export interface PanelHeaderProps {
  readonly title: string;
  readonly actions?: ReactNode;
  readonly onClose?: () => void;
}
/** Reorderable body slots; the host supplies the optional header and section contents. */
export interface PanelBodyProps {
  readonly header?: ReactNode;
  readonly children: ReactNode;
}
/** Current body scope and actions, independent of the outer panel header. */
export interface PanelBodyHeaderProps {
  readonly title: string;
  readonly scope?: string;
  readonly actions?: ReactNode;
}
/** Stable section identity and controlled expansion; children remain owned by the host. */
export interface PanelSectionProps {
  readonly id: string;
  readonly expanded: boolean;
  readonly header: ReactNode;
  readonly children: ReactNode;
}
/** Labelled expansion control and optional actions; the host persists expanded state. */
export interface PanelSectionHeaderProps {
  readonly id: string;
  readonly title: string;
  readonly expanded: boolean;
  readonly onExpandedChange: (expanded: boolean) => void;
  readonly actions?: ReactNode;
}
/** Content linked to its section header by identity; expanded controls its visibility. */
export interface PanelSectionBodyProps {
  readonly id: string;
  readonly expanded: boolean;
  readonly children: ReactNode;
}
/** Reusable styled primitives and a checked scope target; host state stays outside the Design System. */
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
