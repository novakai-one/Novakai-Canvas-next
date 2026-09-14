/** JSON canonicalization sorts record keys; array order remains semantically significant. */
export function canonical(value: unknown): string {
  return JSON.stringify(order(value));
}
/** Only JSON-compatible admitted records enter this traversal; boundary validation rejects other values. */
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
/** Narrow records without treating null as an object. */
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object';
}
