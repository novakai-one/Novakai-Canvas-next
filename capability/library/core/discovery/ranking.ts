import type { LibrarySnapshot } from '../../contract/records/snapshot.js';
import type { QueryRequest, SearchHit } from '../../contract/records/query.js';
import { compareText } from './project.js';

/**
 * Sorts hits for one request, returning a new array. The input arrays are not changed.
 *
 * - `order` (default): the collection entry's `order`, then collection ID, then kind (collection,
 *   section, object), then the hit's own ID.
 * - `title`: the lowercased label, then the `order` sort.
 * - `recent`: the most recently opened collection first (never-opened collections last), then the
 *   `order` sort.
 *
 * Text is compared by code unit (see `compareText`), so the order is the same in every locale.
 *
 * @param hits - The filtered hits.
 * @param snapshot - The validated snapshot (for entry order and recent visits).
 * @param request - The normalized request.
 * @returns The hits in order.
 */
export function sortHits(
  hits: readonly SearchHit[],
  snapshot: LibrarySnapshot,
  request: QueryRequest,
): readonly SearchHit[] {
  const ranked = hits.map((hit) => rankMetadata(hit, snapshot));
  const ordered = ranked.toSorted(comparators[request.sort]);
  return ordered.map((item) => item.hit);
}

/** The sort key of each hit kind in the `order` sort. */
const kindOrder: Readonly<Record<SearchHit['kind'], number>> = {
  collection: 0,
  section: 1,
  object: 2,
};

/** One comparator per sort; `title` and `recent` fall back to the full `order` sort on ties. */
const comparators: Readonly<
  Record<QueryRequest['sort'], (left: RankedHit, right: RankedHit) => number>
> = {
  order: compareOrder,
  title: (left, right) =>
    firstDifference([
      compareText(left.hit.label.toLowerCase(), right.hit.label.toLowerCase()),
      compareOrder(left, right),
    ]),
  recent: (left, right) =>
    firstDifference([right.openedAt - left.openedAt, compareOrder(left, right)]),
};

/**
 * A hit with its sort keys: its collection entry's `order` and last visit time. Validation
 * guarantees every hit's collection has an entry; a collection never visited gets -1, below every
 * real epoch.
 */
function rankMetadata(hit: SearchHit, snapshot: LibrarySnapshot): RankedHit {
  const entry = snapshot.catalog.entries.find((entry) => entry.collection === hit.collection);
  const visit = snapshot.recent.find((visit) => visit.collection === hit.collection);
  return { hit, order: entry?.order ?? 0, openedAt: visit?.openedAt ?? -1 };
}

/** The `order` sort: entry order, collection ID, hit kind, then hit ID. */
function compareOrder(left: RankedHit, right: RankedHit): number {
  const membershipOrder = left.order - right.order;
  const collectionIdentity = compareText(left.hit.collection, right.hit.collection);
  const kind = kindOrder[left.hit.kind] - kindOrder[right.hit.kind];
  const identity = compareText(left.hit.id, right.hit.id);
  return firstDifference([membershipOrder, collectionIdentity, kind, identity]);
}

/** The first nonzero comparison, or 0 for an exact tie. */
function firstDifference(values: readonly number[]): number {
  return values.find((value) => value !== 0) ?? 0;
}

/** A hit with the keys it is sorted by. */
interface RankedHit {
  readonly hit: SearchHit;
  readonly order: number;
  readonly openedAt: number;
}
