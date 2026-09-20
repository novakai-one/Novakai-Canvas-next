import type { Definition } from '@novakai/canvas-model';
import type { Result, Diagnostic } from '../contract/errors.js';
import type { Request } from '../contract/records/owners.js';
import { failure } from '../contract/errors.js';
import type {
  DefinitionBindings,
  DefinitionDraft,
  DefinitionSelection,
  DefinitionSession,
  DefinitionState,
  LiteralDraft,
} from '../contract/records/definitions.js';
import { captureCollectionBase } from '../contract/api.js';

/** Definitions share the retained-editor lifecycle while keeping one stable ID per draft. */
export function createDefinitionSession(bindings: DefinitionBindings): DefinitionSession {
  let state: DefinitionState = { drafts: [], pending: [], problem: null };
  let workspace = '';
  const listeners = new Set<() => void>();
  const publish = (next: DefinitionState): void => {
    state = next;
    listeners.forEach((listener) => listener());
  };
  const reject = (error: Diagnostic): Result<void> => {
    publish({ ...state, problem: error });
    bindings.report(error);
    return { ok: false, error };
  };
  const write = (drafts: readonly DefinitionDraft[]): Result<void> => {
    const result = bindings.retention.write(`definitions.${workspace}`, drafts.map(encodeDraft));
    if (!result.ok) return reject(result.error);
    publish({ drafts, pending: state.pending, problem: null });
    return result;
  };
  const installWorkspace = (id: string, drafts: readonly DefinitionDraft[]): Result<void> => {
    workspace = id;
    publish({ drafts, pending: draftsWithRequests(drafts), problem: null });
    return { ok: true, value: undefined };
  };
  const restoreStored = (id: string, value: unknown): Result<void> => {
    const checked = bindings.read(value);
    if (!checked.ok) return reject(checked.error);
    if (checked.value.some((draft) => draft.base.workspace !== id))
      return reject(
        failure('wrong-workspace', 'Stored definitions belong to another workspace').error,
      );
    return installWorkspace(id, checked.value);
  };
  const restore = (id: string): Result<void> => {
    workspace = '';
    const stored = bindings.retention.read(`definitions.${id}`);
    if (!stored.ok) return reject(stored.error);
    return stored.value === null ? installWorkspace(id, []) : restoreStored(id, stored.value);
  };
  const retain = (
    selection: DefinitionSelection,
    definition: Definition,
    operation: 'create' | 'replace' | 'remove',
    literalDraft?: LiteralDraft,
    editedPath?: readonly number[],
  ) => {
    const scope = checkScope(selection, workspace);
    if (!scope.ok) return reject(scope.error);
    return retainInScope(selection, definition, operation, literalDraft, editedPath);
  };
  const retainInScope = (
    selection: DefinitionSelection,
    definition: Definition,
    operation: 'create' | 'replace' | 'remove',
    literalDraft?: LiteralDraft,
    editedPath?: readonly number[],
  ): Result<void> => {
    const key = `${selection.collection.id}:${definition.id}`;
    const current = state.drafts.find((draft) => draft.key === key);
    const locked = lockedDefinition(state, current, key);
    if (locked !== null) return reject(locked);
    return saveDefinition(current, key, selection, definition, operation, literalDraft, editedPath);
  };
  const saveDefinition = (
    current: DefinitionDraft | undefined,
    key: string,
    selection: DefinitionSelection,
    definition: Definition,
    operation: DefinitionDraft['operation'],
    literalDraft?: LiteralDraft,
    editedPath?: readonly number[],
  ): Result<void> => {
    if (uncommittedDelete(current, operation))
      return write(state.drafts.filter((item) => item.key !== key));
    const draft = draftValue(
      key,
      current,
      selection,
      definition,
      operation,
      literalDraft,
      editedPath,
    );
    return saveDraftResult(draft, key, state.drafts, write, reject);
  };
  const apply = async (key: string): Promise<Result<void>> => {
    const draft = state.drafts.find((item) => item.key === key);
    if (!draft) return { ok: true, value: undefined };
    const guard = applyGuard(state, key, draft);
    if (!guard.ok) return reject(guard.error);
    publish({ ...state, pending: [...state.pending, key], problem: null });
    return settleApply(key, draft);
  };
  async function settleApply(key: string, draft: DefinitionDraft): Promise<Result<void>> {
    const result = await bindings.apply(draft);
    if (!result.ok) {
      unlockWithoutRequest(key);
      return reject(result.error);
    }
    return write(state.drafts.filter((item) => item.key !== key));
  }
  const bindRequest = (key: string, request: Request): Result<void> => {
    const draft = state.drafts.find((item) => item.key === key);
    if (draft === undefined) return { ok: true, value: undefined };
    return write(state.drafts.map((item) => (item.key === key ? { ...item, request } : item)));
  };
  const confirmed = (requestId: string): void => {
    const draft = state.drafts.find((item) => item.request?.request === requestId);
    if (draft === undefined) return;
    void write(state.drafts.filter((item) => item.key !== draft.key));
    publish({ ...state, pending: state.pending.filter((item) => item !== draft.key) });
  };
  const released = (requestId: string): void => {
    const draft = state.drafts.find((item) => item.request?.request === requestId);
    if (draft === undefined) return;
    void write(
      state.drafts.map((item) => (item.key === draft.key ? { ...item, request: undefined } : item)),
    );
    publish({ ...state, pending: state.pending.filter((item) => item !== draft.key) });
  };
  const unlockWithoutRequest = (key: string): void => {
    const draft = state.drafts.find((item) => item.key === key);
    if (draft?.request !== undefined) return;
    publish({ ...state, pending: state.pending.filter((item) => item !== key) });
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    restore,
    create: (selection, definition) => retain(selection, definition, 'create'),
    edit: (selection, definition, literalDraft, editedPath) =>
      retain(selection, definition, 'replace', literalDraft, editedPath),
    remove: (selection, definition) => retain(selection, definition, 'remove'),
    discard: (key) =>
      state.pending.includes(key) ||
      state.drafts.some((draft) => draft.key === key && draft.request !== undefined)
        ? reject(
            failure('pending-request', 'This definition is being submitted; wait for confirmation')
              .error,
          )
        : write(state.drafts.filter((draft) => draft.key !== key)),
    apply,
    bindRequest,
    confirmed,
    released,
    unlockWithoutRequest,
  };
}

function applyGuard(state: DefinitionState, key: string, draft: DefinitionDraft): Result<void> {
  if (state.pending.includes(key))
    return failure('pending-request', 'This definition is already being submitted');
  return literalDraftGuard(draft);
}

function literalDraftGuard(draft: DefinitionDraft): Result<void> {
  if (draft.literalDrafts && draft.literalDrafts.length > 0)
    return failure(
      'invalid-literal-draft',
      'Finish the literal value before applying this definition',
    );
  return { ok: true, value: undefined };
}

function capturedBase(
  current: DefinitionDraft['base'] | undefined,
  selection: DefinitionSelection,
): ReturnType<typeof captureCollectionBase> {
  return current === undefined
    ? captureCollectionBase(selection.base, selection.collection.id)
    : captureCollectionBase(current, selection.collection.id);
}

function checkScope(selection: DefinitionSelection, workspace: string): Result<void> {
  return selection.base.workspace === workspace
    ? { ok: true, value: undefined }
    : failure('wrong-workspace', 'Recover the original workspace before editing');
}

function lockedDefinition(
  state: DefinitionState,
  current: DefinitionDraft | undefined,
  key: string,
): Diagnostic | null {
  return state.pending.includes(key) || current?.request !== undefined
    ? failure('pending-request', 'This definition is being submitted; wait for confirmation').error
    : null;
}

function uncommittedDelete(
  current: DefinitionDraft | undefined,
  operation: DefinitionDraft['operation'],
): boolean {
  return current?.operation === 'create' && operation === 'remove';
}

function saveDraftResult(
  draft: Result<DefinitionDraft>,
  key: string,
  drafts: readonly DefinitionDraft[],
  write: (next: readonly DefinitionDraft[]) => Result<void>,
  reject: (error: Diagnostic) => Result<void>,
): Result<void> {
  return draft.ok
    ? write([...drafts.filter((item) => item.key !== key), draft.value])
    : reject(draft.error);
}

function draftValue(
  key: string,
  current: DefinitionDraft | undefined,
  selection: DefinitionSelection,
  definition: Definition,
  operation: DefinitionDraft['operation'],
  literalDraft?: LiteralDraft,
  editedPath?: readonly number[],
): Result<DefinitionDraft> {
  const base = capturedBase(current?.base, selection);
  if (!base.ok) return base;
  const literalDrafts = nextLiteralDrafts(current, definition, literalDraft, editedPath);
  return {
    ok: true,
    value: {
      key,
      base: base.value,
      generation: current?.generation ?? selection.generation,
      collection: current?.collection ?? selection.collection,
      definition,
      operation: nextOperation(current?.operation, operation),
      request: current?.request,
      literalDrafts,
    },
  };
}

function nextLiteralDrafts(
  current: DefinitionDraft | undefined,
  definition: Definition,
  literalDraft: LiteralDraft | undefined,
  editedPath: readonly number[] | undefined,
): readonly LiteralDraft[] | undefined {
  const retained = (current?.literalDrafts ?? []).filter((item) =>
    canRetainLiteralDraft(definition, item, editedPath),
  );
  return withLiteralDraft(retained, literalDraft);
}

function withLiteralDraft(
  retained: readonly LiteralDraft[],
  literalDraft: LiteralDraft | undefined,
): readonly LiteralDraft[] | undefined {
  return literalDraft === undefined
    ? emptyRetained(retained)
    : [...retained.filter((item) => !samePath(item.path, literalDraft.path)), literalDraft];
}

function emptyRetained(retained: readonly LiteralDraft[]): readonly LiteralDraft[] | undefined {
  return retained.length > 0 ? retained : undefined;
}

function canRetainLiteralDraft(
  definition: Definition,
  literalDraft: LiteralDraft,
  editedPath: readonly number[] | undefined,
): boolean {
  const next = expressionAtPath(definition.expression, literalDraft.path);
  return (
    next?.kind === 'literal' &&
    (editedPath === undefined || !isPathWithin(literalDraft.path, editedPath))
  );
}

function expressionAtPath(
  expression: Definition['expression'],
  path: readonly number[],
): Definition['expression'] | undefined {
  return path.reduce<Definition['expression'] | undefined>(
    (current, index) => (current?.kind === 'union' ? current.items[index] : undefined),
    expression,
  );
}

function samePath(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isPathWithin(path: readonly number[], ancestor: readonly number[]): boolean {
  return ancestor.length <= path.length && ancestor.every((value, index) => path[index] === value);
}

function nextOperation(
  current: DefinitionDraft['operation'] | undefined,
  requested: DefinitionDraft['operation'],
): DefinitionDraft['operation'] {
  if (requested === 'remove') return 'remove';
  if (current === 'remove') return 'replace';
  return current ?? requested;
}

function encodeDraft(draft: DefinitionDraft): unknown {
  return {
    kind: 'definition-draft',
    schemaVersion: 1,
    key: draft.key,
    base: draft.base,
    generation: draft.generation,
    collection: draft.collection.id,
    definition: draft.definition,
    operation: draft.operation,
    request: draft.request,
    literalDrafts: draft.literalDrafts,
  };
}

function draftsWithRequests(drafts: readonly DefinitionDraft[]): readonly string[] {
  return drafts.filter((draft) => draft.request !== undefined).map((draft) => draft.key);
}
