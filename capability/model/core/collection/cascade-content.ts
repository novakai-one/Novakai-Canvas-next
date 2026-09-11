import type { ContentBlock } from '../../contract/records/content.js';
import type { DiagramObject } from '../../contract/records/object.js';
function referenced(block: ContentBlock, id: string): boolean {
  if (block.kind !== 'keygroup') return false;
  return block.references?.some((endpoint) => endpoint.object === id) ?? false;
}
function linkTo(block: ContentBlock, id: string): boolean {
  if (block.kind !== 'link') return false;
  return block.target.kind === 'object' && block.target.id === id;
}
function field(block: ContentBlock, id: string): ContentBlock {
  if (block.kind !== 'field' || block.references?.object !== id) return block;
  const { key, references, ...rest } = block;
  void key;
  void references;
  return rest;
}
export function cascadeContent(object: DiagramObject, id: string): DiagramObject {
  return {
    ...object,
    content: object.content
      .filter((block) => !referenced(block, id) && !linkTo(block, id))
      .map((block) => field(block, id)),
  };
}
