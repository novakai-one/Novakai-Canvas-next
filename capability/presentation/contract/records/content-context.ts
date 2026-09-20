import type { InputCollection, DiagramObject, ContentBlock } from './input.js';
import type { ResolvedStyle } from './style.js';
import type { MeasurementPort } from '../ports/measurement.js';
import type { AssetReader } from '../ports/resources.js';
/** Shared local measurement inputs; field columns derive from sibling fields inside the same node. */
export interface ContentContext {
  readonly chromePolicies?: import('./chrome.js').ChromePolicies | undefined;
  readonly collection: InputCollection;
  readonly width: number;
  readonly style: ResolvedStyle;
  readonly metrics: MeasurementPort;
  readonly assets: AssetReader;
  readonly fields?: FieldColumns;
  /** Canonical owner scopes descendant IDs, including fields omitted by compact appearance detail. */
  readonly owner?: DiagramObject;
  readonly resolveFieldType?: (field: Extract<ContentBlock, { kind: 'field' }>) => string;
}
export interface FieldColumns {
  readonly key: number;
  readonly name: number;
  readonly type: number;
}
