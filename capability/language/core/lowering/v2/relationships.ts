/** v2 wires lower cleanly through the shared record mapper; kept as its own seam for slice 6. */
import type { Declaration } from '../../../contract/records/syntax.js';
import { lowerRecord } from '../content.js';
import type { RawRecord } from '../fields.js';
import { constructsV2 } from '../../vocabulary/constructs-v2.js';
export function lowerV2Wire(item: Declaration): RawRecord {
  return lowerRecord(item, constructsV2);
}
