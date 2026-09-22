/** Declared nested show lowers to tree parent-edges or, elsewhere, to represented groups. */
import type { Declaration, Reference, Span } from '../../../contract/records/syntax.js';
import { list, optional, type RawRecord } from '../fields.js';
import { lowerLayout, modeLayout } from '../layout.js';
import { reject, accepted } from '../../validation/outcomes.js';
import type { SymbolTable } from './symbols.js';
export interface SectionViews {
  readonly appearances: readonly RawRecord[];
  readonly groups: readonly RawRecord[];
  readonly wires: readonly RawRecord[];
  readonly derived: readonly RawRecord[];
  readonly root?: string;
}
interface ViewState {
  appearances: RawRecord[];
  groups: RawRecord[];
  derived: RawRecord[];
  wires: RawRecord[];
  seen: Set<string>;
}
export function lowerDeclaredViews(
  item: Declaration,
  mode: string,
  symbols: SymbolTable,
): SectionViews {
  const shows = item.children.filter((child) => child.kind === 'show');
  checkNodeShows(shows, symbols);
  return mode === 'tree' ? lowerTreeViews(shows, item.span) : lowerGroupViews(shows, mode, symbols);
}
function newState(): ViewState {
  return { appearances: [], groups: [], derived: [], wires: [], seen: new Set<string>() };
}
function showIds(child: Declaration): readonly string[] {
  return list(child.fields, 'ids').map((value) => (value as Reference).id);
}
/** E305: a scenario is shown only by a sequence section. */
function checkNodeShows(shows: readonly Declaration[], symbols: SymbolTable): void {
  shows.forEach((child) => {
    const scenario = showIds(child).find((shown) => symbols.scenarios.has(shown));
    if (scenario !== undefined)
      reject(
        'unrepresentable',
        child.span,
        'A node',
        `E305 view: @${scenario} is a scenario; show takes nodes.`,
      );
    checkNodeShows(child.children, symbols);
  });
}
/** One object may be shown once per section, across appearances and represented groups alike. */
function markShown(seen: Set<string>, shown: string, span: Span): void {
  if (seen.has(shown))
    reject(
      'unknown-target',
      span,
      'A node not yet shown',
      `E305 view: @${shown} is already shown.`,
    );
  seen.add(shown);
}
/** A show with a body must name exactly one node; it is the container it lowers to. */
function checkSingleContainerId(ids: readonly string[], span: Span): void {
  if (ids.length === 1) return;
  const found = ids.map((item) => `@${item}`).join(', ');
  reject(
    'unrepresentable',
    span,
    'One node per container show',
    `E305 view: a container show names one node; found ${found}.`,
  );
}
/** Tree mode has exactly one outermost show naming exactly one root id. */
function checkSingleRoot(shows: readonly Declaration[], span: Span): void {
  const ids = shows.flatMap(showIds);
  if (ids.length === 1) return;
  const found = ids.map((item) => `@${item}`).join(', ');
  reject(
    'unrepresentable',
    span,
    'One outermost show',
    `E306 tree: exactly one outermost show; found ${found}.`,
  );
}
function addTreeEdge(state: ViewState, parentId: string, childId: string, span: Span): void {
  markShown(state.seen, childId, span);
  state.appearances.push({ object: childId });
  const relationshipId = `parent-${parentId}-${childId}`;
  const source = { object: parentId };
  const target = { object: childId };
  state.derived.push({ id: relationshipId, kind: 'parent', source, target });
  state.wires.push({ relationship: relationshipId });
}
function lowerTreeChild(state: ViewState, parentId: string, child: Declaration): void {
  const ids = showIds(child);
  if (child.children.length > 0) return lowerTreeContainer(state, parentId, child, ids);
  ids.forEach((childId) => addTreeEdge(state, parentId, childId, child.span));
}
function lowerTreeContainer(
  state: ViewState,
  parentId: string,
  child: Declaration,
  ids: readonly string[],
): void {
  checkSingleContainerId(ids, child.span);
  const containerId = ids[0] as string;
  addTreeEdge(state, parentId, containerId, child.span);
  child.children.forEach((grandchild) => lowerTreeChild(state, containerId, grandchild));
}
function lowerTreeViews(shows: readonly Declaration[], sectionSpan: Span): SectionViews {
  checkSingleRoot(shows, sectionSpan);
  const rootShow = shows[0] as Declaration;
  const rootId = showIds(rootShow)[0] as string;
  const state = newState();
  markShown(state.seen, rootId, rootShow.span);
  state.appearances.push({ object: rootId });
  rootShow.children.forEach((child) => lowerTreeChild(state, rootId, child));
  return {
    appearances: state.appearances,
    groups: [],
    wires: state.wires,
    derived: state.derived,
    root: rootId,
  };
}
function lowerGroupLeaf(
  state: ViewState,
  ids: readonly string[],
  span: Span,
  parent: string | undefined,
): void {
  ids.forEach((objectId) => {
    markShown(state.seen, objectId, span);
    state.appearances.push({ object: objectId, ...optional('group', parent) });
  });
}
function lowerGroupContainer(
  state: ViewState,
  child: Declaration,
  ids: readonly string[],
  mode: string,
  symbols: SymbolTable,
  parent: string | undefined,
): void {
  checkSingleContainerId(ids, child.span);
  const objectId = ids[0] as string;
  markShown(state.seen, objectId, child.span);
  state.groups.push({
    id: objectId,
    title: symbols.labels.get(objectId) ?? objectId,
    represents: objectId,
    layout: accepted(lowerLayout(child.fields, [], modeLayout(mode))),
    ...optional('parent', parent),
  });
  child.children.forEach((grandchild) =>
    lowerGroupChild(state, grandchild, mode, symbols, objectId),
  );
}
function lowerGroupChild(
  state: ViewState,
  child: Declaration,
  mode: string,
  symbols: SymbolTable,
  parent: string | undefined,
): void {
  const ids = showIds(child);
  if (child.children.length > 0)
    return lowerGroupContainer(state, child, ids, mode, symbols, parent);
  lowerGroupLeaf(state, ids, child.span, parent);
}
function lowerGroupViews(
  shows: readonly Declaration[],
  mode: string,
  symbols: SymbolTable,
): SectionViews {
  const state = newState();
  shows.forEach((child) => lowerGroupChild(state, child, mode, symbols, undefined));
  return { appearances: state.appearances, groups: state.groups, wires: [], derived: [] };
}
