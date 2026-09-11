/**
 * Recursively freezes an already detached, validated JSON result. Callers must not pass
 * caller-owned objects or cycles: this function freezes in place and performs no parsing.
 * Repeated freezing is safe. validate/plan own this final boundary; Authoring owns commits
 * and recovery, so an interrupted freeze exposes no partially committed diagram.
 */
export function freeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null) return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}
