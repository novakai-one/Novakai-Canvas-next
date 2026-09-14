/** Pure view lowering is protected by Language protect; callers retain source on diagnostics and Authoring owns commit recovery. */
import type { Declaration } from '../../contract/records/syntax.js';
import { lowerRecord } from './content.js';
import { id, list, optional, textOr, type RawRecord } from './fields.js';
import { lowerLayout, modeLayout } from './layout.js';
import { lowerSequence } from './sequence.js';
import { lowerValue } from './properties.js';
import { partitionLayout } from './layout-fields.js';
import type { Result } from '../../contract/errors.js';
import { accepted, protect, reject, origin } from '../validation/outcomes.js';
interface ViewParts {
  readonly appearances: readonly RawRecord[];
  readonly groups: readonly RawRecord[];
}
/** A show/connect statement applies one explicit preference set to every listed identity. Retries have no writes; Language owns correction and Authoring owns commit recovery. */
export function lowerShows(item: Declaration, group?: string): Result<readonly RawRecord[]> {
  return protect(() => {
    const { ids: ignored, ...preferences } = lowerRecord(item);
    void ignored;
    return list(item.fields, 'ids').map((value) => ({
      object: lowerValue(value, 'id'),
      ...preferences,
      ...optional('group', group),
    }));
  });
}
/** Canonical wires are referenced here; this never creates a relationship implicitly. Retries have no writes; Language owns correction and Authoring owns commit recovery. */
export function lowerConnections(item: Declaration): Result<readonly RawRecord[]> {
  return protect(() => {
    const { ids: ignored, ...preferences } = lowerRecord(item);
    void ignored;
    return list(item.fields, 'ids').map((value) => ({
      relationship: lowerValue(value, 'id'),
      ...preferences,
    }));
  });
}
/** Combine independent scope projections without mutating shared view arrays. */
function mergeViews(left: ViewParts, right: ViewParts): ViewParts {
  return {
    appearances: [...left.appearances, ...right.appearances],
    groups: [...left.groups, ...right.groups],
  };
}
/** A represented group stays a group; Model resolves its represented object as visible automatically. */
function lowerGroup(item: Declaration, algorithm: string, parent?: string): ViewParts {
  const group = {
    ...lowerRecord(item),
    ...optional('parent', parent),
    layout: accepted(lowerLayout(item.fields, item.children, algorithm)),
  };
  const clean = partitionLayout(group).remaining;
  const nested = lowerViews(item.children, algorithm, id(item.fields));
  return { appearances: nested.appearances, groups: [clean, ...nested.groups] };
}
/** Each layout scope owns its appearance order; interleaving unrelated scopes has no authored meaning. */
function lowerViews(
  children: readonly Declaration[],
  algorithm: string,
  parent?: string,
): ViewParts {
  return children
    .map((item) => lowerView(item, algorithm, parent))
    .reduce(mergeViews, { appearances: [], groups: [] });
}
/** Other section statements are handled by their own projections rather than becoming hidden nodes. */
function lowerView(item: Declaration, algorithm: string, parent?: string): ViewParts {
  if (item.kind === 'show') return { appearances: accepted(lowerShows(item, parent)), groups: [] };
  if (item.kind === 'group') return lowerGroup(item, algorithm, parent);
  return { appearances: [], groups: [] };
}
/** Tree root is singular. Duplicate roots are an authoring error, not last-write-wins. */
function rootField(children: readonly Declaration[]): RawRecord {
  const roots = children.filter((item) => item.kind === 'root');
  if (roots.length > 1)
    reject('syntax', roots[1]?.span ?? origin, 'One tree root', 'Duplicate root');
  const root = roots[0];
  if (root === undefined) return {};
  return { root: id(root.fields) };
}
/** Section semantic configuration includes every mode-specific structure without layout coordinates. Retries have no writes; Language owns correction and Authoring owns commit recovery. */
export function lowerSection(item: Declaration): Result<RawRecord> {
  return protect(() => {
    const mode = textOr(item.fields, 'mode', 'flow');
    const views = lowerViews(item.children, modeLayout(mode));
    return {
      ...partitionLayout(lowerRecord(item)).remaining,
      mode,
      layout: accepted(lowerLayout(item.fields, item.children, modeLayout(mode))),
      ...views,
      wires: item.children
        .filter((child) => child.kind === 'connect')
        .flatMap((child) => accepted(lowerConnections(child))),
      sequence: lowerSequence(item.children),
      ...rootField(item.children),
    };
  });
}
