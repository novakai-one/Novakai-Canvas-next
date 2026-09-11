/** Freezes detached results only. Replay is pure; Authoring owns commit/recovery. */
export function freeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null) return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}
