/** Presentation's immutable aggregate admission authority is shared by every projection consumer. */
export const PROJECTION_CAPACITY = Object.freeze({
  maxSections: 32,
  maxNodes: 1000,
  maxWires: 1500,
});
