/** Collection-level layout arrangement; lane L1 fills scope/track semantics. */
import type { Declaration } from '../../../contract/records/syntax.js';
import { lowerLayout } from '../layout.js';
import { accepted } from '../../validation/outcomes.js';
import type { RawRecord } from '../fields.js';

// lane L1
export function lowerCollectionLayout(collection: Declaration): RawRecord {
  return accepted(lowerLayout(collection.fields, [], 'grid'));
}
