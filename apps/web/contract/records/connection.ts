import type { RelationshipKind } from '@novakai/canvas-model';
import type { Collection, Section, Snapshot } from './owners.js';
import type { NewFunction } from './wire-editor.js';

export interface ConnectionEndpointView {
  readonly object: Collection['objects'][number]['id'];
  readonly kind: Collection['objects'][number]['kind'];
  readonly label: string;
  readonly member?: string;
  readonly memberLabel?: string;
}

export interface ConnectionDraft {
  readonly id: string;
  readonly base: Snapshot;
  readonly generation: string;
  readonly collection: Collection;
  readonly section: Section;
  readonly source: ConnectionEndpointView;
  readonly target: ConnectionEndpointView;
  readonly kinds: readonly RelationshipKind[];
  readonly kind: RelationshipKind;
  readonly label: string;
  readonly from: Cardinality;
  readonly to: Cardinality;
  readonly problem: string | null;
  /** A function Apply adds to the target module, when the new wire names one that is not there yet. */
  readonly created?: NewFunction | null;
  /** The typed name while a new function is being named and cannot be used yet. */
  readonly naming?: string | null;
  readonly requestState: 'draft' | 'sending' | 'uncertain' | 'retryable' | 'rejected';
}

export type Cardinality = 'none' | '0..1' | '1' | '0..many' | '1..many';

export type ConnectionEdit =
  | { readonly kind: 'label'; readonly value: string }
  | { readonly kind: 'relationship-kind'; readonly value: RelationshipKind }
  | { readonly kind: 'cardinality'; readonly side: 'from' | 'to'; readonly value: Cardinality }
  /** Point a module wire at one of its functions; `create` also adds that function to the module. */
  | {
      readonly kind: 'function';
      readonly member: string;
      readonly label: string;
      readonly create: boolean;
    }
  | { readonly kind: 'function-name'; readonly name: string };
