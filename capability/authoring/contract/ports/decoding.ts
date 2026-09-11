/** Structural schema seam keeps the core independent of a parsing framework. */
export interface CheckedShape<T> {
  safeParse(
    value: unknown,
  ): { readonly success: true; readonly data: T } | { readonly success: false };
}
