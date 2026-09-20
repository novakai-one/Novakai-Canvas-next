import type { Collection } from './records/collection.js';
/** Collection record namespaces supported by structural operations and impact reporting. */
export type Target =
  'objects' | 'relationships' | 'sections' | 'assets' | 'sources' | 'definitions';
/** One net record change; collection denotes metadata rather than a child-record namespace. */
export interface Impact {
  readonly target: Target | 'collection';
  readonly id: string;
  readonly action: 'added' | 'updated' | 'removed';
}
/** Detached valid candidate and net impact. Revision is unchanged; Authoring owns admission and commit. */
export interface ChangePlan {
  readonly candidate: Collection;
  readonly impact: readonly Impact[];
}

/** Compiler-only structural projection. References may be unresolved; only plan proves validity. */
export interface ChangeStage {
  readonly validity: 'unchecked';
  readonly candidate: Collection;
  readonly changes: readonly import('./records/change.js').Change[];
}
