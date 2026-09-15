/**
 * Host doorway for the Model capability.
 *
 * Carries ONLY the names an outside consumer or own contract test actually
 * imports or re-exports, measured against the workspace. Everything else
 * contract/ declares stays inside the capability and is reached structurally
 * through these names. Add a name only when a real consumer appears.
 */

/** Validate unknown data, plan a valid transition, or project it unchecked; every outcome frozen. */
export { validate, plan, stage } from './api.js';

/** Checked ID schemas mint identities without casts. */
export { objectId, collectionId, descendantId, assetId } from './brands.js';
export type { ObjectId, SectionId, DescendantId } from './brands.js';

/** Typed result and machine-readable failure codes returned by every operation. */
export type { Result, DiagnosticCode } from './errors.js';

/** Canonical collection record and the object/section vocabulary consumers traverse and re-export. */
export type { Collection } from './records/collection.js';
export type { DiagramObject, ObjectKind } from './records/object.js';
export type { ContentBlock, Endpoint } from './records/content.js';
export type { Relationship, RelationshipKind } from './records/relationship.js';
export type {
  Section,
  Appearance,
  Group,
  WireAppearance,
  SequenceItem,
  Mode,
} from './records/section.js';
export type { LayoutIntent, Placement } from './records/layout.js';

/** Declared change batches and their planned or staged outcomes. */
export type { Change } from './records/change.js';
export type { ChangePlan, ChangeStage } from './types.js';

/** Endpoint and compatibility tables describing relationship wiring rules. */
export {
  compatibleLayouts,
  compatibleWires,
  memberEndpoints,
  genericMemberEndpoints,
  sourceEndpoints,
  targetEndpoints,
} from './records/policies.js';
