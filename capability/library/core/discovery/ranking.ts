import type { LibrarySnapshot } from '../../contract/records/snapshot.js';
import type { QueryRequest, SearchHit } from '../../contract/records/query.js';
import { compareText } from './project.js';

interface RankedHit {
  readonly hit: SearchHit;
  readonly order: number;
  readonly openedAt: number;
}
const kindOrder: Readonly<Record<SearchHit['kind'], number>> = {
  collection: 0,
  section: 1,
  object: 2,
};

/** Membership is guaranteed by validation; missing visits deliberately rank after all real epochs. */
function rankMetadata(hit: SearchHit, snapshot: LibrarySnapshot): RankedHit {
  const entry = snapshot.catalog.entries.find((entry) => entry.collection === hit.collection);
  const visit = snapshot.recent.find((visit) => visit.collection === hit.collection);
  return { hit, order: entry?.order ?? 0, openedAt: visit?.openedAt ?? -1 };
}
/** Return the first differing ordered key; zero denotes an exact tie. */
function firstDifference(values: readonly number[]): number {
  return values.find((value) => value !== 0) ?? 0;
}
/** Default order is collection order/ID, then hit kind and local identity. */
function compareOrder(left: RankedHit, right: RankedHit): number {
  const membershipOrder = left.order - right.order;
  const collectionIdentity = compareText(left.hit.collection, right.hit.collection);
  const kind = kindOrder[left.hit.kind] - kindOrder[right.hit.kind];
  const identity = compareText(left.hit.id, right.hit.id);
  return firstDifference([membershipOrder, collectionIdentity, kind, identity]);
}
/** Title and recent sorts retain the complete default tie-breaker. */
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
/** Sort a copied projection without mutating source record or result arrays. */
export function sortHits(
  hits: readonly SearchHit[],
  snapshot: LibrarySnapshot,
  request: QueryRequest,
): readonly SearchHit[] {
  const ranked = hits.map((hit) => rankMetadata(hit, snapshot));
  const ordered = ranked.toSorted(comparators[request.sort]);
  return ordered.map((item) => item.hit);
}
