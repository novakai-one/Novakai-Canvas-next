/** Canonical data vocabulary is reused type-only through Model's permitted public contract. */
export type {
  Collection as InputCollection,
  DiagramObject,
  ContentBlock,
  Endpoint,
  Relationship,
  Appearance,
  Group,
  Section,
  SequenceItem,
  Placement,
  LayoutIntent,
  ObjectKind,
  RelationshipKind,
} from '@novakai/canvas-model';
export type { TypeUse } from '@novakai/canvas-model';
/** Relationship label derivation is reused through Model's permitted public contract. */
export { relationshipLabel } from '@novakai/canvas-model';
/** Canonical type-use text and definition refs are reused through Model's permitted public contract. */
export { typeUseText, typeUseDefinitions } from '@novakai/canvas-model';
