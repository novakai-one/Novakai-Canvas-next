import type { LibraryView, LibraryController } from './records/library.js';
import type { WorkspaceController } from './records/workspace.js';
import type { WorkspaceView } from './records/workspace.js';
/** Library slots consume their own cached session view and explicit navigation actions. */
export interface LibraryFeatureProps {
  readonly library: LibraryController;
  readonly state: LibraryView;
  readonly workspace: WorkspaceController;
  readonly busy: boolean;
  readonly onSelect: ((id: string) => void) | null;
  readonly currentId: string | null;
  readonly pendingId: string | null;
}

export interface LibraryBrowserProps {
  readonly controller: WorkspaceController;
  readonly view: WorkspaceView;
  readonly onSelect?: (id: string) => void;
  readonly currentId?: string | null;
  readonly pendingId?: string | null;
}
