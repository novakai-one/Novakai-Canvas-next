/**
 * Public Model boundary. Consumers validate data or plan changes through this module.
 * Record types describe data; checked ID schemas mint identities without casts.
 * Authoring owns admission, revision changes and persistence recovery.
 */
export { validate, plan } from './api.js';
export {
  objectId,
  collectionId,
  sectionId,
  relationshipId,
  descendantId,
  assetId,
  sourceId,
  groupId,
} from './brands.js';
export type {
  ObjectId,
  CollectionId,
  SectionId,
  RelationshipId,
  DescendantId,
  AssetId,
  SourceId,
  GroupId,
} from './brands.js';
export type { Result, Diagnostic, DiagnosticCode } from './errors.js';
export type { Collection } from './records/collection.js';
export type { DiagramObject, ObjectKind } from './records/object.js';
export type { ContentBlock, Endpoint, Field, KeyGroup } from './records/content.js';
export type { Relationship, RelationshipKind } from './records/relationship.js';
export type {
  Section,
  Appearance,
  Group,
  WireAppearance,
  SequenceItem,
  Mode,
} from './records/section.js';
export type { LayoutIntent, LayoutTarget, LayoutConstraint, Placement } from './records/layout.js';
export type { Change, RecordChange } from './records/change.js';
export type { ChangePlan, Impact, Target } from './types.js';
