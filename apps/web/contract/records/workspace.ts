import type { LibraryController } from './library.js';
import type { WireEditorSession } from './wire-editor.js';
import type { InspectorSession } from './inspector.js';
import type { SourceView } from './source.js';
import type { Collection, Snapshot, RenderDocument, Canvas, SessionStore } from './owners.js';
import type { Submission } from './submission.js';
import type { Diagnostic } from '../errors.js';
/** UI owns form drafts and selected collection; committed records are immutable Authoring snapshots. */
export interface ActiveDiagram {
  readonly generation: string;
  readonly base: Snapshot;
  readonly document: RenderDocument;
  readonly canvas: Canvas;
  readonly session: SessionStore;
}
export interface WorkspaceView extends SourceView {
  readonly snapshot: Snapshot | null;
  readonly generation: string;
  readonly collections: readonly Collection[];
  readonly active: ActiveDiagram | null;
  readonly opening: string | null;
  readonly status: string;
  readonly problem: Diagnostic | null;
  readonly connected: boolean;
  readonly busy: boolean;
  readonly pending: readonly Submission[];
}
/** UI actions are intentions; the runtime binds server mutations and Canvas effects at composition. */
export interface WorkspaceController {
  readonly inspector: InspectorSession;
  readonly wires: WireEditorSession;
  readonly library: LibraryController;
  getSnapshot(): WorkspaceView;
  subscribe(listener: () => void): () => void;
  start(): Promise<void>;
  open(id: string): Promise<void>;
  showLibrary(): void;
  refresh(): Promise<void>;
  showSource(open: boolean): Promise<void>;
  editSource(source: string): void;
  applySource(): Promise<void>;
  closeSource(decision: 'keep' | 'discard' | 'stay'): void;
  reconcileRequest(id: string): Promise<void>;
  dismissRequest(id: string): void;
  retryRequest(id: string): Promise<void>;
  create(title: string): Promise<void>;
  report(error: Diagnostic): void;
  dispose(): void;
}
