/*
 * Canonical JSON text for digests and byte-identical bundles: the same data always gives the
 * same text, whatever order its keys were written in.
 */

/**
 * Serializes a value as JSON with every object's keys sorted. Array order is kept, because it
 * is meaningful. Keys that look like array indexes (`"2"`, `"10"`) still come first, in numeric
 * order, because JavaScript objects always order them that way.
 *
 * Only JSON-compatible parsed records should be passed in. Every non-array object is rebuilt from
 * its own enumerable string keys, so prototypes and `toJSON` methods are ignored (a `Date`
 * becomes `{}`), and getters are read once.
 *
 * @param value - The value to serialize.
 * @returns The canonical JSON text.
 * @throws RangeError for cyclic input (the traversal recurses without limit), and whatever
 * `JSON.stringify` throws (for example a `TypeError` for a `BigInt`).
 */
export function canonical(value: unknown): string {
  return JSON.stringify(order(value));
}

/** Returns a copy of `value` with every object's keys sorted; arrays keep their order. */
function order(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(order);
  if (isRecord(value))
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, order(value[key])]),
    );
  return value;
}

/** Whether `value` is a non-null object (arrays are handled before this is called). */
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object';
}
