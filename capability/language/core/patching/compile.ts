import type { Collection, Change } from '../../contract/ports/model.js';
import type { Patch, Operation } from '../../contract/records/syntax.js';
import type { LowerRequest, LoweredIntent } from '../../contract/records/requests.js';
import type { Dependencies } from '../../contract/types.js';
import type { RawRecord } from '../lowering/fields.js';
import { ownerValue } from '../lowering/diagnostics.js';
import { patchResources } from '../lowering/resources.js';
import { requireSnapshot, structuralChange, resetChange } from './structural.js';
import { editBlocks } from './blocks.js';
import { editMembership } from './views.js';
import { editProperties } from './properties.js';
import { reject } from '../validation/outcomes.js';
interface Compilation {
  readonly candidate: Collection;
  readonly changes: readonly Change[];
  readonly deletedSections: readonly string[];
}
/** Ordered compilation reads exact Model-staged prefixes; final planning is the sole validity proof. */
export function lowerPatch(patch: Patch, request: LowerRequest, deps: Dependencies): LoweredIntent {
  if (request.mode !== 'patch')
    reject(
      'invalid-input',
      patch.span,
      'patch mode',
      'Patch cannot create or replace a collection',
    );
  const original = requireSnapshot(request.snapshot, patch);
  const initial = ownerValue(deps.stage.stage(original, []), [], patch.span);
  const compiled = patch.operations.reduce<Compilation>(
    (state, operation) => compileNext(state, operation, original, request, deps.stage),
    { candidate: initial.candidate, changes: initial.changes, deletedSections: [] },
  );
  const mappings = patch.operations.map((operation) => ({
    path: operation.address.id,
    span: operation.span,
  }));
  const plan = ownerValue(deps.planner.plan(original, compiled.changes), mappings, patch.span);
  const resources = patch.operations.flatMap(patchResources);
  return {
    mode: 'patch',
    collection: plan.candidate,
    changes: compiled.changes,
    resources,
    sourceMap: mappings,
  };
}
/** Stage from the valid original plus the whole prefix, retaining cascades and temporary forward references. */
function compileNext(
  state: Compilation,
  operation: Operation,
  original: Collection,
  request: LowerRequest,
  stage: Dependencies['stage'],
): Compilation {
  checkSectionIdentity(state, operation);
  const change = compileOperation(state.candidate, operation, request);
  const staged = ownerValue(stage.stage(original, [...state.changes, change]), [], operation.span);
  return {
    candidate: staged.candidate,
    changes: staged.changes,
    deletedSections: deletedSections(state, operation),
  };
}
/** Delete/recreate would discard one identity's semantics ambiguously; bounded replace is explicit instead. */
function checkSectionIdentity(state: Compilation, operation: Operation): void {
  if (operation.target !== 'section' || operation.action !== 'add') return;
  if (state.deletedSections.includes(operation.address.id))
    reject(
      'invalid-value',
      operation.span,
      'replace section',
      'Cannot delete and recreate a section in one patch',
    );
}
/** Track only actual section deletes; this is compiler policy, not duplicated Model cascade behavior. */
function deletedSections(state: Compilation, operation: Operation): readonly string[] {
  if (operation.target !== 'section' || operation.action !== 'delete') return state.deletedSections;
  return [...state.deletedSections, operation.address.id];
}
/** Fixed actions dispatch to focused semantic compilers; no generic write or JSON path escapes the vocabulary. */
function compileOperation(
  collection: Collection,
  operation: Operation,
  request: LowerRequest,
): RawRecord {
  if (operation.action === 'set' || operation.action === 'unset')
    return editProperties(collection, operation, request.resources);
  if (operation.target === 'block') return editBlocks(collection, operation);
  return compileStructuralOrView(collection, operation, request);
}
/** Membership and reset commands delegate canonical effects through the same Model changes as human edits. */
function compileStructuralOrView(
  collection: Collection,
  operation: Operation,
  request: LowerRequest,
): RawRecord {
  const compilers: Readonly<Record<string, () => RawRecord>> = {
    show: () => editMembership(collection, operation),
    hide: () => editMembership(collection, operation),
    connect: () => editMembership(collection, operation),
    disconnect: () => editMembership(collection, operation),
    reset: () => resetChange(operation),
  };
  const compile = compilers[operation.action];
  return compile === undefined ? structuralChange(operation, request.resources) : compile();
}
