import type {
  Change,
  Collection,
  ContentBlock,
  DiagramObject,
  Relationship,
} from '../../contract/records/owners.js';
import type { NewFunction } from '../../contract/records/wire-editor.js';
type Signature = Extract<ContentBlock, { kind: 'signature' }>;
/** One function a module wire can name: the module's signature identity and its display name. */
export interface ModuleFunction {
  readonly id: string;
  readonly label: string;
}
const functionWires: readonly Relationship['kind'][] = ['imports', 'calls'];
const functionOwners: readonly DiagramObject['kind'][] = ['module', 'interface'];
/** Imports and calls wires into a module or interface name one of its functions. */
export function functionTarget(
  collection: Collection,
  relationship: Relationship,
): DiagramObject | null {
  if (!functionWires.includes(relationship.kind)) return null;
  return functionOwner(collection, relationship.target.object);
}
function functionOwner(collection: Collection, id: string): DiagramObject | null {
  const object = collection.objects.find((item) => item.id === id);
  return object !== undefined && functionOwners.includes(object.kind) ? object : null;
}
/** Signatures are the module's functions, in authored order. */
export function moduleFunctions(object: DiagramObject): readonly ModuleFunction[] {
  return object.content.filter(isSignature).map((item) => ({ id: item.id, label: item.label }));
}
function isSignature(block: ContentBlock): block is Signature {
  return block.kind === 'signature';
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
  if (identityBase(name) === '') return 'Name needs a letter or digit.';
  return duplicateProblem(name, object, pending);
}
/** A function clash is resolved by picking it; any other labelled part needs a new name. */
function duplicateProblem(
  name: string,
  object: DiagramObject,
  pending: string | null,
): string | null {
  const labelled = object.content.flatMap(labelledPart).filter((item) => item.id !== pending);
  const duplicate = existingFunction(labelled, name);
  if (duplicate === null) return null;
  const signature = moduleFunctions(object).some((item) => item.id === duplicate.id);
  return signature
    ? `${object.label} already has function '${duplicate.label}'. Pick it from the list instead.`
    : `${object.label} already has '${duplicate.label}'. Choose another name.`;
}
function labelledPart(block: ContentBlock): readonly ModuleFunction[] {
  return 'label' in block && typeof block.label === 'string'
    ? [{ id: block.id, label: block.label }]
    : [];
}
