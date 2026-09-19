import type { LibraryView, LibraryController } from './records/library.js';
import type { WorkspaceController, WorkspaceView } from './records/workspace.js';
/** Library features receive only the workspace roles used by discovery and selection. */
export type LibraryWorkspace = Pick<WorkspaceController, 'library' | 'open' | 'getSnapshot'>;
export type LibraryWorkspaceView = Pick<WorkspaceView, 'busy' | 'connected'>;
/** Library slots consume their own cached session view and explicit navigation actions. */
export interface LibraryFeatureProps {
  readonly library: LibraryController;
  readonly state: LibraryView;
  readonly workspace: LibraryWorkspace;
  readonly busy: boolean;
  readonly onSelect: ((id: string) => void) | null;
  readonly currentId: string | null;
  readonly pendingId: string | null;
}

export interface LibraryBrowserProps {
  readonly controller: LibraryWorkspace;
  readonly view: LibraryWorkspaceView;
  readonly className?: string;
  readonly onSelect?: (id: string) => void;
  readonly currentId?: string | null;
  readonly pendingId?: string | null;
}
