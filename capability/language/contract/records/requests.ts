import type { Collection, Change } from '@novakai/canvas-model';
import type { ResourceRequest, SourceMapping } from './syntax.js';
export type { ResourceRequest, SourceMapping } from './syntax.js';
export interface ResolvedResources {
  readonly themes: Readonly<Record<string, Collection['theme']>>;
  readonly assets: Readonly<Record<string, Collection['assets'][number]>>;
}
export interface LowerRequest {
  readonly source: string;
  readonly mode: 'create' | 'replace' | 'patch';
  readonly snapshot: Collection | null;
  readonly resources: ResolvedResources;
}
export interface LoweredIntent {
  readonly mode: LowerRequest['mode'];
  readonly collection: Collection;
  readonly changes: readonly Change[];
  readonly resources: readonly ResourceRequest[];
  readonly sourceMap: readonly SourceMapping[];
}
export type Scope =
  { readonly kind: 'all' } | { readonly kind: 'section' | 'object'; readonly id: string };
export interface PrintRequest {
  readonly collection: unknown;
  readonly scope: Scope;
  readonly heading?: string;
}
export interface ManualTarget {
  readonly target: string;
  readonly kind: 'placement' | 'route';
  readonly locked: boolean;
}
export interface Readout {
  readonly source: string;
  readonly collection: string;
  readonly revision: number;
  readonly scope: Scope;
  readonly manual: readonly ManualTarget[];
  readonly pins: { readonly theme: string; readonly assets: readonly string[] };
}

/** A recipe creates a new collection namespace while preserving readable local aliases and their references. */
export interface ExpansionRequest {
  readonly source: string;
  readonly namespace: string;
  readonly resources: ResolvedResources;
}
