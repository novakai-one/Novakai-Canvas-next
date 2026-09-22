import type { Relationship } from '../../contract/records/relationship.js';

/** Derivation rule: an explicit label wins; a member wire is named by its target member; otherwise empty. */
export function relationshipLabel(relationship: Pick<Relationship, 'label' | 'target'>): string {
  return relationship.label ?? relationship.target.member ?? '';
}
