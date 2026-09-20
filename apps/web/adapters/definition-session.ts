import type { Definition } from '@novakai/canvas-model';
import { definitionId } from '@novakai/canvas-model';
import type { Result, Diagnostic } from '../contract/errors.js';
import { failure } from '../contract/errors.js';
import type {
  DefinitionBindings,
  DefinitionDraft,
  DefinitionSelection,
  DefinitionSession,
  DefinitionState,
} from '../contract/records/definitions.js';
import { captureCollectionBase } from '../contract/api.js';

/** Definitions share the retained-editor lifecycle while keeping one stable ID per draft. */
export function createDefinitionSession(bindings: DefinitionBindings): DefinitionSession {
  let state: DefinitionState = { drafts: [], problem: null };
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
    publish({ drafts, problem: null });
    return result;
  };
  const installWorkspace = (id: string, drafts: readonly DefinitionDraft[]): Result<void> => {
    workspace = id;
    publish({ drafts, problem: null });
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
  ) => {
    if (selection.base.workspace !== workspace)
      return reject(
        failure('wrong-workspace', 'Recover the original workspace before editing').error,
      );
    const key = `${selection.collection.id}:${definition.id}`;
    const current = state.drafts.find((draft) => draft.key === key);
    const base = capturedBase(current?.base, selection);
    if (!base.ok) return reject(base.error);
    const draft: DefinitionDraft = {
      key,
      base: base.value,
      generation: current?.generation ?? selection.generation,
      collection: current?.collection ?? selection.collection,
      definition,
      operation: nextOperation(current?.operation, operation),
    };
    return write([...state.drafts.filter((item) => item.key !== key), draft]);
  };
  const apply = async (key: string): Promise<Result<void>> => {
    const draft = state.drafts.find((item) => item.key === key);
    if (!draft) return { ok: true, value: undefined };
    const result = await bindings.apply(draft);
    if (!result.ok) return reject(result.error);
    return write(state.drafts.filter((item) => item.key !== key));
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    restore,
    create: (selection, definition) => retain(selection, definition, 'create'),
    edit: (selection, definition) => retain(selection, definition, 'replace'),
    remove: (selection, definition) => retain(selection, definition, 'remove'),
    discard: (key) => write(state.drafts.filter((draft) => draft.key !== key)),
    apply,
  };
}

function capturedBase(
  current: DefinitionDraft['base'] | undefined,
  selection: DefinitionSelection,
): ReturnType<typeof captureCollectionBase> {
  return current === undefined
    ? captureCollectionBase(selection.base, selection.collection.id)
    : captureCollectionBase(current, selection.collection.id);
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
  };
}

export function definitionDraftId(value: string): Definition['id'] {
  return definitionId.parse(value);
}
