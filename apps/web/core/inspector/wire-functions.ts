import type {
  Change,
  Collection,
  ContentBlock,
  DiagramObject,
  Relationship,
} from '../../contract/records/owners.js';
import type { EditedWire, NewFunction } from '../../contract/records/wire-editor.js';
import type { ConnectionDraft, ConnectionEdit } from '../../contract/records/connection.js';
import { pickFunction } from './wire-problems.js';
type Signature = Extract<ContentBlock, { kind: 'signature' }>;
type Member = Extract<ContentBlock, { kind: 'member' }>;
/** One function a module wire can name: a signature or member identity and its display name. */
export interface ModuleFunction {
  readonly id: string;
  readonly label: string;
}
/** Only these kinds name a module function. */
export const functionWires: readonly Relationship['kind'][] = ['imports', 'calls'];
const functionOwners: readonly DiagramObject['kind'][] = ['module', 'interface'];
/** Imports and calls wires into a module or interface name one of its functions. */
export function functionTarget(
  collection: Collection,
  relationship: Pick<Relationship, 'kind' | 'target'>,
): DiagramObject | null {
  if (!functionWires.includes(relationship.kind)) return null;
  return functionOwner(collection, relationship.target.object);
}
function functionOwner(collection: Collection, id: string): DiagramObject | null {
  const object = collection.objects.find((item) => item.id === id);
  return object !== undefined && functionOwners.includes(object.kind) ? object : null;
}
/** Signatures and members are the module's functions, in authored order. */
export function moduleFunctions(object: DiagramObject): readonly ModuleFunction[] {
  return object.content.filter(isFunction).map((item) => ({ id: item.id, label: item.label }));
}
function isFunction(block: ContentBlock): block is Signature | Member {
  return block.kind === 'signature' || block.kind === 'member';
}
/** The collection as it will be after Apply: the staged function is appended to its module. */
export function withNewFunction(collection: Collection, created: NewFunction | null): Collection {
  if (created === null) return collection;
  return { ...collection, objects: collection.objects.map((item) => extended(item, created)) };
}
function extended(object: DiagramObject, created: NewFunction): DiagramObject {
  if (object.id !== created.object) return object;
  if (takenIds(object).includes(created.id)) return object;
  return { ...object, content: [...object.content, signature(created)] };
}
/** A new function starts with no parameters and returns void; its module can refine it later. */
function signature(created: NewFunction): Signature {
  return {
    kind: 'signature',
    id: created.id,
    label: created.label,
    parameters: [],
    returns: 'void',
  };
}
/** The module record is replaced before the relationship so the wire's target member exists. */
export function newFunctionChange(
  collection: Collection,
  created: NewFunction | null,
): readonly Change[] {
  if (created === null) return [];
  const object = withNewFunction(collection, created).objects.find(
    (item) => item.id === created.object,
  );
  if (object === undefined) return [];
  return [{ op: 'replace', target: 'objects', value: object }];
}
/** Readable, unique identity derived from the typed name; blank when no identity can be formed. */
export function newFunctionId(name: string, object: DiagramObject, pending: string | null): string {
  const base = identityBase(name);
  if (base === '') return '';
  const taken = takenIds(object).filter((id) => id !== pending);
  return uniqueId(base, taken, 1);
}
function identityBase(name: string): string {
  const slug = name
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return /^[A-Za-z]/.test(slug) || slug === '' ? slug : `fn-${slug}`;
}
function uniqueId(base: string, taken: readonly string[], attempt: number): string {
  const candidate = attempt === 1 ? base : `${base}-${attempt}`;
  if (!taken.includes(candidate)) return candidate;
  return uniqueId(base, taken, attempt + 1);
}
/** Ports, content blocks and table rows share one identity namespace inside an object. */
function takenIds(object: DiagramObject): readonly string[] {
  const rows = object.content.flatMap((block) => (block.kind === 'table' ? block.rows : []));
  return [...object.ports, ...object.content, ...rows].map((item) => item.id);
}
/** An existing function with the same name should be picked, not duplicated. */
export function existingFunction(
  functions: readonly ModuleFunction[],
  name: string,
): ModuleFunction | null {
  const wanted = name.trim().toLowerCase();
  return functions.find((item) => item.label.toLowerCase() === wanted) ?? null;
}
/** Why a typed name cannot become a new function yet; null when it can. */
export function newFunctionProblem(
  name: string,
  object: DiagramObject,
  pending: string | null,
): string | null {
  if (name.trim() === '') return 'Type a name for the new function.';
  if (!identifier.test(name.trim()))
    return 'Use letters, digits and _ only, starting with a letter. No spaces. Example: submitIssue';
  return duplicateProblem(name, object, pending);
}
const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
/** A clash with an existing function is resolved by picking it from the list. */
function duplicateProblem(
  name: string,
  object: DiagramObject,
  pending: string | null,
): string | null {
  const functions = moduleFunctions(object).filter((item) => item.id !== pending);
  const duplicate = existingFunction(functions, name);
  if (duplicate === null) return null;
  return `${object.label} already has function '${duplicate.label}'. Pick it from the list instead.`;
}
/** A new connection shown as a wire, so it can use the same function picker. */
export function connectionAsWire(draft: ConnectionDraft): EditedWire {
  const end = (value: ConnectionDraft['source']) =>
    value.member === undefined
      ? { object: value.object }
      : { object: value.object, member: value.member };
  const relationship = {
    id: `relationship-${draft.id}`,
    kind: draft.kind,
    label: connectionLabel(draft),
    source: end(draft.source),
    target: end(draft.target),
    style: 'solid',
    sources: [],
  } as unknown as Relationship;
  const wire = {
    relationship: relationship.id,
    route: 'orthogonal',
    sourceSide: 'auto',
    targetSide: 'auto',
    locked: false,
  } as const;
  return { relationship, wire, created: draft.created ?? null, naming: draft.naming ?? null };
}
/** The module a new imports/calls connection must name a function of, with any staged one added. */
export function connectionFunctionOwner(draft: ConnectionDraft): DiagramObject | null {
  const collection = withNewFunction(draft.collection, draft.created ?? null);
  return functionTarget(collection, {
    kind: draft.kind,
    target: { object: draft.target.object },
  } as Pick<Relationship, 'kind' | 'target'>);
}
/** A module connection is labelled with its function's name; anything else keeps the typed label. */
export function connectionLabel(draft: ConnectionDraft): string {
  const owner = connectionFunctionOwner(draft);
  if (owner === null) return draft.label.trim();
  return moduleFunctions(owner).find((item) => item.id === draft.target.member)?.label ?? '';
}
/** Why Apply connection is off; null when a plain wire has a label or a module wire a function. */
export function connectionProblem(draft: ConnectionDraft): string | null {
  const owner = connectionFunctionOwner(draft);
  return owner === null ? typedLabelProblem(draft) : functionProblem(draft, owner);
}
function typedLabelProblem(draft: ConnectionDraft): string | null {
  return draft.label.trim() === '' ? 'Type a connection label.' : null;
}
function functionProblem(draft: ConnectionDraft, owner: DiagramObject): string | null {
  if (typeof draft.naming === 'string') return namingProblem(draft.naming, owner);
  return connectionLabel(draft) === '' ? pickFunction : null;
}
function namingProblem(name: string, owner: DiagramObject): string {
  return newFunctionProblem(name, owner, null) ?? pickFunction;
}
/** Picking a function attaches the new wire to it; `create` also stages it on the module. */
export function chosenConnectionFunction(
  draft: ConnectionDraft,
  edit: Extract<ConnectionEdit, { kind: 'function' }>,
): ConnectionDraft {
  const target = { ...draft.target, member: edit.member, memberLabel: edit.label };
  const staged = { object: draft.target.object, id: edit.member, label: edit.label };
  const created = edit.create ? (staged as NewFunction) : null;
  return { ...draft, target, label: edit.label, created, naming: null };
}
/** An unusable name stages nothing; the typed text stays so the form can explain why. */
export function namedConnectionFunction(draft: ConnectionDraft, name: string): ConnectionDraft {
  return { ...unstaged(draft), naming: name };
}
/** Leaving imports/calls drops a staged function and any name being typed. */
export function connectionKindChanged(
  draft: ConnectionDraft,
  kind: Relationship['kind'],
): ConnectionDraft {
  return functionWires.includes(kind) ? draft : { ...unstaged(draft), naming: null };
}
/** A staged function that is dropped takes the wire's attachment to it along. */
function unstaged(draft: ConnectionDraft): ConnectionDraft {
  const created = draft.created ?? null;
  if (created === null) return draft;
  const { member, memberLabel, ...target } = draft.target;
  void memberLabel;
  return { ...draft, created: null, target: member === created.id ? target : draft.target };
}
