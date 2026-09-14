import type { DiagramObject, ContentBlock } from '../../contract/ports/model.js';
import { header } from './properties.js';
import { body } from './strings.js';
import { printValue } from './values.js';
import type { RawRecord } from '../lowering/fields.js';
/** Objects print content followed by their separate port compartment; both preserve their own order. */
export function printNode(object: DiagramObject): string {
  return body(header('node', object), [
    ...object.content.map(printContent),
    ...object.ports.map((port) => header('port', port)),
  ]);
}
/** Each content kind retains its complete canonical payload; table rows remain individually addressable. */
export function printContent(block: ContentBlock): string {
  if (block.kind === 'table')
    return body(
      header('table', block),
      block.rows.map((row) => header('row', row)),
    );
  if (block.kind === 'link') return printLink(block);
  return header(block.kind, block);
}
/** Navigation target syntax is intentionally more readable than its canonical discriminator record. */
function printLink(block: Extract<ContentBlock, { kind: 'link' }>): string {
  const start = `link @${block.id} ${printValue(block.label, 'string')}`;
  if (block.target.kind === 'uri')
    return `${start} target=${printValue(block.target.uri, 'string')}`;
  return `${start} target=@${block.target.id}${linkSection(block.target)}`;
}
/** Omitted section means navigation to the object without a preferred view. */
function linkSection(target: RawRecord): string {
  if (target.section === undefined) return '';
  return ` section=${printValue(target.section, 'id')}`;
}
