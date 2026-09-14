import type { Result } from '../errors.js';
/** Selected collection is navigational state. Reopening a URL reads owners; it never recreates or edits the diagram. */
export interface WorkspaceNavigation {
  current(): Result<string | null>;
  opened(collection: string | null): Result<void>;
}
