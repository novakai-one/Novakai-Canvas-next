/*
 * Splitting a lowered collection or section record into its layout fields and everything else.
 * No side effects: the input is not changed. Language owns correcting the source; Authoring owns
 * commit recovery.
 */
import { layoutProperties } from '../vocabulary/properties.js';
import type { RawRecord } from './fields.js';

/**
 * Splits a record into the layout fields (`columns`, `algorithm`, `direction`, `gap`) and the
 * rest. Both parts keep the record's key order.
 *
 * Pure: a retry with the same input returns the same result. Language owns correcting the
 * source; Authoring owns commit recovery.
 *
 * @param record - A lowered collection or section record.
 * @returns `layout` with the layout fields, and `remaining` with every other field.
 * @throws Never.
 */
export function partitionLayout(record: RawRecord): {
  readonly layout: RawRecord;
  readonly remaining: RawRecord;
} {
  const entries = Object.entries(record);
  return {
    layout: Object.fromEntries(
      entries.filter(/** Whether this is a layout field. */ ([field]) => fields.includes(field)),
    ),
    remaining: Object.fromEntries(
      entries.filter(
        /** Whether this is not a layout field. */ ([field]) => !fields.includes(field),
      ),
    ),
  };
}

/** The layout properties, in table order. */
const layoutPropertyList = Object.values(layoutProperties);

/** The Model field names of the layout properties. */
const fields: readonly string[] = layoutPropertyList.map(
  /** The property's Model field name. */ (property) => property.field,
);
