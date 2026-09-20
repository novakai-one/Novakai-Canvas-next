import type { Definition, Collection } from '@novakai/canvas-model';
import type { Snapshot, Receipt } from './owners.js';
import type { EditingBase } from './editor-recovery.js';
import type { Diagnostic, Result } from '../errors.js';

export interface DefinitionSelection {
  readonly base: Snapshot;
  readonly generation: string;
  readonly collection: Collection;
}

export interface DefinitionDraft {
  readonly key: string;
  readonly base: EditingBase;
  readonly generation: string;
  readonly collection: Collection;
  readonly definition: Definition;
  readonly operation: 'create' | 'replace' | 'remove';
}

export interface DefinitionState {
  readonly drafts: readonly DefinitionDraft[];
  readonly problem: Diagnostic | null;
}

export interface DefinitionSession {
  getSnapshot(): DefinitionState;
  subscribe(listener: () => void): () => void;
  restore(workspace: string): Result<void>;
  create(selection: DefinitionSelection, definition: Definition): Result<void>;
  edit(selection: DefinitionSelection, definition: Definition): Result<void>;
  remove(selection: DefinitionSelection, definition: Definition): Result<void>;
  discard(key: string): Result<void>;
  apply(key: string): Promise<Result<void>>;
}

export type DefinitionFactory = (
  callbacks: Pick<DefinitionBindings, 'apply' | 'report'>,
) => DefinitionSession;

export interface DefinitionBindings {
  readonly retention: import('../ports/workspace.js').DraftRetention;
  read(input: unknown): Result<readonly DefinitionDraft[]>;
  apply(draft: DefinitionDraft): Promise<Result<Receipt>>;
  report(error: Diagnostic): void;
}
