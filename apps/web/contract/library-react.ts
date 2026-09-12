import type { LibraryView, LibraryController } from './records/library.js';
import type { WorkspaceController } from './records/workspace.js';
/** Library slots consume their own cached session view and explicit navigation actions. */
export interface LibraryFeatureProps {
  readonly library: LibraryController;
  readonly state: LibraryView;
  readonly workspace: WorkspaceController;
  readonly busy: boolean;
}
