/*
 * Locale-independent text handling for search: comparing strings and splitting search text into
 * words. Pure; reads no locale or clock. Authoring owns commit and recovery.
 */

/**
 * Compares two strings by UTF-16 code unit, so the order is the same on every machine and in every
 * locale.
 *
 * @param left - The first string.
 * @param right - The second string.
 * @returns -1 when `left` sorts first, 1 when it sorts after, 0 when equal.
 * @throws Never.
 */
export function compareText(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

/**
 * Splits search text into its words: split on runs of whitespace, empty pieces dropped.
 *
 * @param text - The search text.
 * @returns The words, in order.
 * @throws Never.
 */
export function searchWords(text: string): readonly string[] {
  const pieces = text.split(/\s+/);
  return pieces.filter(/** Whether the piece is a word. */ (piece) => piece.length > 0);
}
