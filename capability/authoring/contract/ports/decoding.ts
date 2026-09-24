/**
 * A checked shape: anything that can parse untrusted data into `T`.
 *
 * Core code depends on this small structural interface instead of on a parsing library, so a
 * zod schema, or any other parser with the same method, can be passed in.
 */
export interface CheckedShape<T> {
  /**
   * @param value - The untrusted data to parse.
   * @returns `{ success: true, data }` with the parsed value, or `{ success: false }`.
   */
  safeParse(
    value: unknown,
  ): { readonly success: true; readonly data: T } | { readonly success: false };
}
