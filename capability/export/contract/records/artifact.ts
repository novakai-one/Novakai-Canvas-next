import type { Collection } from '@novakai/canvas-model';
import type { Scene, PlacedSection, Box } from '@novakai/canvas-layout';
import type { Paint } from '@novakai/canvas-presentation';
import type { Diagnostic } from '../errors.js';
import type { Scope } from './input.js';
import type { Resource } from './bundle.js';
import type { Page } from './pages.js';
/** One owner-admitted revision remains retained until every encoder stage has settled. */
export interface Identity {
  readonly collectionId: string;
  readonly revision: number;
  readonly inputKey: string;
  readonly title: string;
}
export interface Snapshot {
  readonly identity: Identity;
  readonly collection: Collection;
  readonly scene: Scene;
  readonly resources: readonly Resource[];
  readonly paint: Paint;
}
export interface Selection {
  readonly sections: readonly PlacedSection[];
  readonly bounds: Box;
}
export interface Encoded {
  readonly bytes: Uint8Array;
  readonly pages: readonly Page[];
  readonly warnings: readonly Diagnostic[];
}
export interface Artifact extends Encoded {
  readonly schemaVersion: 1;
  readonly mediaType: string;
  readonly extension: string;
  readonly digest: string;
  readonly identity: Identity;
  readonly scope: Scope;
}
export type { Collection, Scene, PlacedSection, Box, Paint };
