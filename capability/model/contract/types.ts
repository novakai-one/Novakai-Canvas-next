import type { Collection } from './records/collection.js';
export type Target = 'objects' | 'relationships' | 'sections' | 'assets' | 'sources';
export interface Impact {
  readonly target: Target | 'collection';
  readonly id: string;
  readonly action: 'added' | 'updated' | 'removed';
}
export interface ChangePlan {
  readonly candidate: Collection;
  readonly impact: readonly Impact[];
}
