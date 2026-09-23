import type { DiagramObject } from '../../contract/records/object.js';
import type { Relationship } from '../../contract/records/relationship.js';

type Labelled = Pick<Relationship, 'kind' | 'label' | 'target'>;

/**
 * The one read path for a wire's label. An imports/calls wire into a module or interface that
 * targets one of its functions is named by that function's current label, so a rename shows
 * everywhere with no second write. Any other wire keeps its own label; a member wire without one
 * is named by its target member id; otherwise empty.
 */
export function relationshipLabel(
  relationship: Labelled,
  objects: readonly DiagramObject[],
): string {
  return (
    targetFunctionLabel(relationship, objects) ??
    relationship.label ??
    relationship.target.member ??
    ''
  );
}

const functionWires: readonly Relationship['kind'][] = ['imports', 'calls'];
const functionOwners: readonly DiagramObject['kind'][] = ['module', 'interface'];
type Block = DiagramObject['content'][number];
type FunctionBlock = Extract<Block, { kind: 'signature' | 'member' }>;

function targetFunctionLabel(
  relationship: Labelled,
  objects: readonly DiagramObject[],
): string | undefined {
  if (!functionWires.includes(relationship.kind)) return undefined;
  const owner = objects.find((object) => object.id === relationship.target.object);
  if (owner === undefined || !functionOwners.includes(owner.kind)) return undefined;
  const member = relationship.target.member;
  return owner.content.find((block): block is FunctionBlock => isFunction(block, member))?.label;
}

function isFunction(block: Block, member: string | undefined): boolean {
  return block.id === member && (block.kind === 'signature' || block.kind === 'member');
}
