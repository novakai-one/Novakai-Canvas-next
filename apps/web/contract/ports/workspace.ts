import type { LibraryFactory } from '../records/library.js';
import type { CatalogChange } from '@novakai/canvas-library';
import type { WireEditorFactory } from '../records/wire-editor.js';
import type { InspectorFactory } from '../records/inspector.js';
import type { SourceFactory } from '../records/source.js';
import type { WorkspaceNavigation } from './navigation.js';
import type { PanelController } from '../panel-types.js';
import type { SubmissionFactory } from '../records/submission.js';
import type { Result } from '../errors.js';
import type {
  Collection,
  Snapshot,
  Request,
  RenderDocument,
  CanvasEffect,
  Canvas,
  SessionStore,
  Change,
} from '../records/owners.js';
import type { ServiceClient } from './client.js';
import type { EditPlanner } from '../records/editing.js';
export interface WorkspaceInputs {
  snapshot(
    input: unknown,
  ): Result<{ readonly snapshot: Snapshot; readonly collections: readonly Collection[] }>;
  diagram(input: unknown): Result<RenderDocument>;
  source(collection: Collection): Result<string>;
  sourceRecovery(input: unknown): Result<{
    readonly source: string;
    readonly snapshot: Snapshot;
    readonly generation: string;
    readonly collection: string;
    readonly edit: number;
  }>;
  dsl(
    snapshot: Snapshot,
    id: string,
    source: string,
    mode: 'create' | 'replace',
    request: string,
  ): Result<Request>;
  model(
    snapshot: Snapshot,
    collection: string,
    changes: readonly Change[],
    request: string,
  ): Result<Request>;
  library(snapshot: Snapshot, changes: readonly CatalogChange[], request: string): Result<Request>;
  newSource(id: string, title: string): string;
}
/** Canvas session construction is separate from server subscriptions and browser editor state. */
export interface CanvasSessions {
  readonly canvas: Canvas;
  open(
    document: RenderDocument,
    effects: (effects: readonly CanvasEffect[]) => void,
  ): Result<SessionStore>;
  update(session: SessionStore, document: RenderDocument): Result<void>;
}
export interface DraftRetention {
  write(key: string, value: unknown): Result<void>;
  read(key: string): Result<unknown>;
  remove(key: string): Result<void>;
}
export interface WorkspaceBindings {
  readonly client: Pick<ServiceClient, 'get' | 'changes'>;
  readonly navigation: WorkspaceNavigation;
  readonly inputs: Pick<
    WorkspaceInputs,
    'snapshot' | 'diagram' | 'model' | 'dsl' | 'newSource' | 'library'
  >;
  readonly sessions: CanvasSessions;
  readonly edits: EditPlanner;
  readonly submissions: SubmissionFactory;
  readonly source: SourceFactory;
  readonly inspector: InspectorFactory;
  readonly wires: WireEditorFactory;
  readonly library: LibraryFactory;
  readonly panels: Pick<PanelController, 'open' | 'restore'>;
  nextId(): string;
}
