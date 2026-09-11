import type { Collection } from '../../contract/records/collection.js';
import type { ContentBlock } from '../../contract/records/content.js';
import type { DiagramObject } from '../../contract/records/object.js';
import { duplicates, issue, required } from '../invariants/issues.js';
export function descendants(
  object: DiagramObject,
): readonly { readonly id: string; readonly kind: string }[] {
  return [
    ...object.ports.map((port) => ({ id: port.id, kind: 'port' })),
    ...object.content.flatMap(blockDescendants),
  ];
}
function blockDescendants(
  block: ContentBlock,
): readonly { readonly id: string; readonly kind: string }[] {
  if (block.kind !== 'table') return [block];
  return [block, ...block.rows.map((row) => ({ id: row.id, kind: 'row' }))];
}
function placement(block: ContentBlock, object: DiagramObject) {
  const kinds: Readonly<Record<string, readonly string[]>> = {
    field: ['entity'],
    keygroup: ['entity'],
    member: ['module', 'interface', 'function'],
    signature: ['module', 'interface', 'function'],
  };
  const permitted = kinds[block.kind] ?? [object.kind];
  return issue(
    !permitted.includes(object.kind),
    'content',
    `objects.${object.id}.content.${block.id}`,
    'Content kind is not legal on this object kind',
  );
}
function table(block: ContentBlock, path: string) {
  if (block.kind !== 'table') return [];
  return block.rows.flatMap((row) =>
    issue(
      row.cells.length !== block.columns.length,
      'content',
      `${path}.${row.id}`,
      'Row width must equal column count',
    ),
  );
}
export function validateContent(collection: Collection) {
  return collection.objects.flatMap((object) => [
    ...duplicates(descendants(object), (item) => item.id, `objects.${object.id}.descendants`),
    ...object.content.flatMap((block) => [
      ...placement(block, object),
      ...table(block, `objects.${object.id}.content.${block.id}`),
    ]),
    ...required(collection.theme.roles.includes(object.role), `objects.${object.id}.role`),
  ]);
}
