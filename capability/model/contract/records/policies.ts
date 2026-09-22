import type { LayoutIntent } from './layout.js';
import type { RelationshipKind } from './relationship.js';
import type { Mode } from './section.js';
import type { ObjectKind } from './object.js';
/** Addressable descendant member kinds, declared once for validators and describe(). */
export type MemberEndpointKind = 'field' | 'member' | 'signature' | 'port' | 'row';
/**
 * Acceptance policies as public declaration data: validators read them, describe() publishes them,
 * and agents can discover every rule without opening core. An absent entry permits any canonical
 * value; an empty list permits none.
 */
export const compatibleLayouts: Readonly<Record<Mode, readonly LayoutIntent['algorithm'][]>> = {
  flow: ['flow', 'layered'],
  state: ['flow', 'layered'],
  er: ['layered', 'grid'],
  modules: ['layered', 'grid'],
  tree: ['tree'],
  sequence: ['sequence'],
  story: ['grid'],
  grid: ['grid'],
};
/** Mode/legal relationship kinds; unrestricted modes omit their entry instead of allow-all lists. */
export const compatibleWires: Readonly<Partial<Record<Mode, readonly RelationshipKind[]>>> = {
  er: ['association', 'reference'],
  modules: ['imports', 'calls', 'implements', 'contains', 'reference'],
  state: ['transition', 'reference'],
  tree: ['parent', 'reference'],
  sequence: [],
};
/** Addressable descendant members per owner kind; unlisted kinds support generic ports/rows. */
export const memberEndpoints: Readonly<Partial<Record<ObjectKind, readonly MemberEndpointKind[]>>> =
  {
    entity: ['field', 'port'],
    module: ['member', 'signature', 'port'],
    interface: ['member', 'signature', 'port'],
    function: ['member', 'signature', 'port'],
  };
/** Generic addressable descendants when the owner kind has no dedicated entry. */
export const genericMemberEndpoints: readonly MemberEndpointKind[] = ['port', 'row'];
/** Relationship source policies; an absent policy means no restriction on that endpoint's kind. */
export const sourceEndpoints: Readonly<Partial<Record<RelationshipKind, readonly ObjectKind[]>>> = {
  association: ['entity'],
  imports: ['module'],
  calls: ['module', 'function', 'participant'],
  implements: ['module', 'function'],
  contains: ['module', 'system'],
  transition: ['start', 'state'],
};
/** Relationship target policies; source and target policies may differ by design. */
export const targetEndpoints: Readonly<Partial<Record<RelationshipKind, readonly ObjectKind[]>>> = {
  association: ['entity'],
  imports: ['module', 'interface', 'function', 'package'],
  calls: ['module', 'interface', 'function'],
  implements: ['interface'],
  transition: ['state', 'end'],
};
