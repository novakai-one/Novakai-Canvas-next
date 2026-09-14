import type { Catalog, Selection, Preset, Query } from '../../contract/records/preset.js';
import type { Summary } from '../../contract/types.js';
import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import { success } from '../validation/outcomes.js';
import { pinOf } from '../validation/catalog.js';
/** Numeric tuple comparison makes2.10.0 later than2.9.0; input grammar was already validated. */
export function compareVersions(left: string, right: string): number {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  return (
    a.map((value, index) => value - (b[index] ?? 0)).find((difference) => difference !== 0) ?? 0
  );
}
/** Selection permits latest only when no release was submitted; resolved output is always a complete record. */
export function select(records: Catalog, request: Selection): Result<Preset> {
  const choices = records.filter((value) => value.kind === request.kind && value.id === request.id);
  const releases = choices.filter(
    (value) => request.version === undefined || value.version === request.version,
  );
  const selected = releases.toSorted((a, b) => compareVersions(b.version, a.version))[0];
  if (!selected) return fail('missing-preset', request.id, 'No matching preset version');
  return verifySelection(selected, request);
}
/** A supplied digest is an exact precondition, never an advisory search hint. */
function verifySelection(value: Preset, request: Selection): Result<Preset> {
  if (request.digest && request.digest !== value.digest)
    return fail('digest-mismatch', request.id, 'Requested content digest differs');
  return success(value);
}
/** Query matches readable metadata; source text and token contents are not a second search index. */
function matches(value: Preset, query: Query): boolean {
  if (query.kind && value.kind !== query.kind) return false;
  return searchable(value).includes(query.search.toLowerCase());
}
/** Recipe family participates in discovery; themes have no invented diagram family. */
function searchable(value: Preset): string {
  const family = value.kind === 'recipe' ? value.payload.family : '';
  return [value.id, value.title, value.description, family].join(' ').toLowerCase();
}
/** Stable ordering compares namespace and identity before numeric release order. */
function compare(left: Preset, right: Preset): number {
  const identity = `${left.kind}/${left.id}`.localeCompare(`${right.kind}/${right.id}`, 'en');
  if (identity !== 0) return identity;
  return compareVersions(left.version, right.version);
}
/** Public summaries contain exact pins, never mutable aliases or private canonical payloads. */
function summarize(value: Preset): Summary {
  const family = value.kind === 'recipe' ? value.payload.family : null;
  return { pin: pinOf(value), title: value.title, description: value.description, family };
}
/** Stateless discovery returns an immutable projection; caller owns any UI query state. */
export function list(records: Catalog, query: Query): readonly Summary[] {
  return records
    .filter((value) => matches(value, query))
    .toSorted(compare)
    .map(summarize);
}
