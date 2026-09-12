import type { PanelController } from './panel-types.js';
import type { ComponentType, ReactElement } from 'react';
import type { ReactBindings as DesignBindings } from '@novakai/canvas-design-system';
import type { SurfaceProps } from '@novakai/canvas-canvas';
import type { WorkspaceController, WorkspaceView } from './records/workspace.js';
/** Feature views receive readonly presentation and intent callbacks. No component owns canonical diagram state. */
export interface WorkspaceProps {
  readonly controller: WorkspaceController;
}
export interface FeatureProps {
  readonly controller: WorkspaceController;
  readonly view: WorkspaceView;
}
export interface HeaderProps extends FeatureProps {
  readonly onCreate: () => void;
}
export type LibraryProps = HeaderProps;
export interface PanelProps extends FeatureProps {
  readonly side: 'left' | 'right';
}
export interface CreateDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCreate: (title: string) => void;
  readonly portal: HTMLElement;
}
export interface ChromeSlots {
  readonly panels: PanelController;
  readonly Header: ComponentType<HeaderProps>;
  readonly Library: ComponentType<LibraryProps>;
  readonly Panel: ComponentType<PanelProps>;
  readonly Recovery: ComponentType<FeatureProps>;
  readonly Source: ComponentType<FeatureProps>;
  readonly CreateDialog: ComponentType<CreateDialogProps>;
  readonly CanvasSurface: ComponentType<SurfaceProps>;
  readonly portal: HTMLElement;
  nextGestureId(): string;
}
export type DesignSlots = Pick<
  DesignBindings,
  | 'Button'
  | 'Field'
  | 'Dialog'
  | 'PanelHeader'
  | 'PanelBody'
  | 'PanelBodyHeader'
  | 'PanelSection'
  | 'PanelSectionHeader'
  | 'SidePanel'
>;
export type WorkspaceComponent = ComponentType<WorkspaceProps>;
export type WorkspaceElement = (props: WorkspaceProps) => ReactElement;
