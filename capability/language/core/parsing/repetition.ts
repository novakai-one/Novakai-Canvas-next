import type { Result } from '../../contract/errors.js';
import { protect, reject } from '../validation/outcomes.js';
import { peek, type Cursor, type Parsed } from './cursor.js';
/** Iterate flat declarations with local scratch state; Language owns typed recovery, no shared cursor exists. */
export function repeat<T>(
  cursor: Cursor,
  continues: (cursor: Cursor) => boolean,
  read: (cursor: Cursor) => Parsed<T>,
  maximum = 250000,
): Result<Parsed<readonly T[]>> {
  return protect(() => collect(cursor, continues, read, maximum));
}
/** Only nesting recurses; each successful reader must move forward to prevent an infinite parser loop. */
function collect<T>(
  initial: Cursor,
  continues: (cursor: Cursor) => boolean,
  read: (cursor: Cursor) => Parsed<T>,
  maximum: number,
): Parsed<readonly T[]> {
  let cursor = initial;
  const values: T[] = [];
  while (continues(cursor)) {
    requireCapacity(values.length, maximum, cursor);
    const parsed = read(cursor);
    checkProgress(cursor, parsed.next);
    values.push(parsed.value);
    cursor = parsed.next;
  }
  return { value: values, next: cursor };
}
/** A non-progressing grammar reader is a provider fault rather than permission to spin forever. */
function checkProgress(before: Cursor, after: Cursor): void {
  if (after.index <= before.index)
    reject(
      'provider-failure',
      peek(before).span,
      'Advancing grammar reader',
      'Parser did not advance',
    );
}

/** Stop allocation at the owning grammar bound, including 1000 patch operations. */
function requireCapacity(count: number, maximum: number, cursor: Cursor): void {
  if (count >= maximum)
    reject('limit', peek(cursor).span, `At most ${maximum} items`, 'Statement limit exceeded');
}
