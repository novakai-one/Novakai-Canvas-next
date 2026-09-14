import {
  requestSchema,
  requestId,
  actorId,
  type Snapshot,
  type Request,
  type RecordKey,
} from '../contract/index.js';
import { observed, workspace, record } from './fixtures.js';
import { z } from 'zod';
/** Each inverse is a new request with the exact current participant observations, not database rewind. */
export function inverse(
  snapshot: Snapshot,
  id: string,
  original: string,
  kind: 'undo' | 'redo',
  keys: readonly RecordKey[],
): Request {
  return requestSchema.parse({
    workspace,
    request: requestId.parse(id),
    actor: { id: actorId.parse('human'), kind: 'human' },
    version: 1,
    expected: keys.map((key) => observed(snapshot, key)),
    scope: keys,
    assets: [],
    intent: { kind, transaction: requestId.parse(original) },
  });
}

/** Deliberately corrupt only the returned before-image identity; this is never a storage mutation helper. */
export function replaceHistoryBefore(
  snapshot: Snapshot,
  transaction: string,
  other: RecordKey,
): Snapshot {
  const donor = record(snapshot, other);
  const records = snapshot.records.map((item) => {
    if (item.key.id !== `tx:${transaction}`) return item;
    const fields = z.record(z.string(), z.json()).parse(item.value);
    const transitions = z.array(z.record(z.string(), z.json())).parse(fields.transitions);
    const altered = transitions.map((transition) => ({
      ...transition,
      before: z.json().parse(donor),
    }));
    return { ...item, value: { ...fields, transitions: altered } };
  });
  return { ...snapshot, records };
}
