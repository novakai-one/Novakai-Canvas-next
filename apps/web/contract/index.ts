/** Browser host public entry. Canonical diagram writes remain service requests admitted by Authoring. */
export { startWeb, createInspectorSession, createWireSession } from './compose.js';
export { planCanvasEdit, panelVisible, reconcilePanelPreferences } from './api.js';
export type { WorkspaceController, WorkspaceView } from './records/workspace.js';
export type { Result, Diagnostic, DiagnosticOwner } from './errors.js';
export type { EditContext } from './records/editing.js';

export { failure } from './errors.js';

export { editedObject, objectDraftKey } from './api.js';
export { editedWire, wireDraftKey, wireChanges } from './api.js';
export type { InspectorBindings, ObjectSelection } from './records/inspector.js';
