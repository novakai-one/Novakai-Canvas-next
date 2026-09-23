import { definitionId } from '@novakai/canvas-model';

export { planCanvasEdit } from '../core/editing/plan.js';

export { blocksSubmission, submissionStatus, refused } from '../core/editing/submissions.js';

export {
  defaultPanels,
  panelMode,
  openPanel,
  resizePanels,
  panelVisible,
  panelGeometry,
  panelTabSide,
} from '../core/workspace/panel-state.js';
export {
  movePanelSection,
  panelMembership,
  panelWidth,
  reconcilePanelPreferences,
} from '../core/panels/preferences.js';
export { editedObject, objectDraftKey } from '../core/inspector/object-edits.js';
export { selectedObject } from '../core/inspector/selection.js';
export { defaultPreferences } from '../core/preferences/defaults.js';
export { editedWire, wireChanges, wireDraftKey } from '../core/inspector/wire-edits.js';
export { selectedWire } from '../core/inspector/wire-selection.js';
export {
  existingFunction,
  functionTarget,
  hasBlankLabel,
  moduleFunctions,
  newFunctionId,
  withNewFunction,
} from '../core/inspector/wire-functions.js';
export type { ModuleFunction } from '../core/inspector/wire-functions.js';
export { plainRelationshipProblem, plainWireProblem } from '../core/inspector/wire-problems.js';
export { retainObjectCommand, retainWireCommand } from '../core/inspector/draft-commands.js';
export { endpointKey, endpointChoices } from '../core/inspector/endpoints.js';
export {
  baseWorkspace,
  captureCollectionBase,
  collectionRecord,
  encodeObjectRecovery,
  encodeSourceRecovery,
  encodeWireRecovery,
} from '../core/recovery/editor-records.js';

export { formatFailure, failureSummary } from '../core/output/diagnostics.js';
export { buildMoveReview, chooseMoveOption } from '../core/editing/movement.js';

export function definitionDraftId(value: string): import('@novakai/canvas-model').Definition['id'] {
  return definitionId.parse(value);
}

export { groupDraftProblem, groupCreationChanges } from '../core/editing/group-creation.js';
