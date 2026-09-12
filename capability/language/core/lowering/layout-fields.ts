import { layoutProperties } from '../vocabulary/properties.js';
import type { RawRecord } from './fields.js';
const fields: readonly string[] = Object.values(layoutProperties).map((property) => property.field);
/** Partition canonical scope fields without writes; callers retain their input and Language owns correction. */
export function partitionLayout(record: RawRecord): {
  readonly layout: RawRecord;
  readonly remaining: RawRecord;
} {
  const entries = Object.entries(record);
  return {
    layout: Object.fromEntries(entries.filter(([field]) => fields.includes(field))),
    remaining: Object.fromEntries(entries.filter(([field]) => !fields.includes(field))),
  };
}
