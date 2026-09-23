import type {
  Collection,
  Section,
  WireAppearance,
  Relationship,
  Endpoint,
  Change,
} from './owners.js';
import type { Snapshot, Receipt } from './owners.js';
import type { EditingBase } from './editor-recovery.js';
import type { Diagnostic, Result } from '../errors.js';
import type { DraftRetention } from '../ports/workspace.js';
/** The semantic relationship is shared; only the selected section owns the route controls. */
export interface WireSelection {
  readonly base: Snapshot;
  readonly generation: string;
  readonly collection: Collection;
  readonly section: Section;
  readonly relationship: Relationship;
  readonly wire: WireAppearance;
}
/** Incomplete text is a retained UI intention, not an admitted relationship. */
export type WireEdit =
  | { readonly kind: 'label' | 'guard' | 'effect'; readonly value: string }
  | { readonly kind: 'relationship-kind'; readonly value: Relationship['kind'] }
  | { readonly kind: 'style'; readonly value: Relationship['style'] }
  | { readonly kind: 'endpoint'; readonly side: 'source' | 'target'; readonly value: Endpoint }
  | {
      readonly kind: 'cardinality';
      readonly side: 'from' | 'to';
      readonly value: NonNullable<Relationship['from']> | 'none';
    }
  | { readonly kind: 'route'; readonly value: WireAppearance['route'] }
  | { readonly kind: 'locked'; readonly value: boolean }
  | {
      readonly kind: 'side';
      readonly side: 'sourceSide' | 'targetSide';
      readonly value: WireAppearance['sourceSide'];
    }
  | { readonly kind: 'automatic-route' }
  | FunctionChoice;
/**
 * Point an imports/calls wire at one function (signature) of its target module. `create` stages
 * that signature on the module too, so Apply submits both records as one undoable revision.
 */
export interface FunctionChoice {
  readonly kind: 'function';
  readonly object: Endpoint['object'];
  readonly member: NonNullable<Endpoint['member']>;
  readonly label: string;
  readonly create: boolean;
}
/** A function the draft will add to its module when applied. */
export interface NewFunction {
  readonly object: Endpoint['object'];
  readonly id: NonNullable<Endpoint['member']>;
  readonly label: string;
}
export interface WireDraft extends Omit<WireSelection, 'base'> {
  readonly base: EditingBase;
  readonly key: string;
  readonly edits: readonly WireEdit[];
}
export interface EditedWire {
  readonly relationship: Relationship;
  readonly wire: WireAppearance;
  /** Present only while the draft adds a new function to the target module. */
  readonly created?: NewFunction | null;
}
export interface WireEditorState {
  readonly drafts: readonly WireDraft[];
  readonly problem: Diagnostic | null;
}
/** Retained wire forms have their own lifecycle; reorganizing panels cannot clear them. */
export interface WireEditorSession {
  getSnapshot(): WireEditorState;
  subscribe(listener: () => void): () => void;
  restore(workspace: string): Result<void>;
  edit(selection: WireSelection, command: WireEdit): Result<void>;
  discard(key: string): Result<void>;
  apply(key: string): Promise<Result<void>>;
}
export interface WireEditorBindings {
  readonly retention: DraftRetention;
  read(input: unknown): Result<readonly WireDraft[]>;
  apply(draft: WireDraft, changes: readonly Change[]): Promise<Result<Receipt>>;
  report(error: Diagnostic): void;
}
export type WireEditorFactory = (
  callbacks: Pick<WireEditorBindings, 'apply' | 'report'>,
) => WireEditorSession;
