import { useEffect, useState, useSyncExternalStore } from 'react';
import type { ComponentType, ReactElement } from 'react';
import {
  definitionDisplay,
  definitionUsages,
  type TypeExpression,
  type Collection,
} from '@novakai/canvas-model';
import type { DesignSlots, FeatureProps } from '../../contract/react-types.js';
import type { DefinitionSelection, LiteralDraft } from '../../contract/records/definitions.js';
import { definitionDraftId, failureSummary, formatFailure } from '../../contract/api.js';
import styles from './ObjectEditor.module.css';

/** Collection owned definitions are edited through the same retained session as object forms. */
export function createDefinitionsEditor({
  Button,
  Field,
}: Pick<DesignSlots, 'Button' | 'Field'>): ComponentType<FeatureProps> {
  function Definitions({ controller, view }: FeatureProps): ReactElement {
    const session = controller.definitions;
    const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
    const collection = view.active?.document.collection ?? null;
    if (collection === null || view.active === null)
      return <p>Open a collection to edit shared definitions.</p>;
    const selection: DefinitionSelection = {
      base: view.active.base,
      generation: view.active.generation,
      collection,
    };
    const drafts = state.drafts.filter((draft) => draft.collection.id === collection.id);
    const values = collection.definitions.map(
      (definition) =>
        drafts.find((draft) => draft.definition.id === definition.id)?.definition ?? definition,
    );
    const created = drafts
      .filter(
        (draft) =>
          !collection.definitions.some((definition) => definition.id === draft.definition.id),
      )
      .map((draft) => draft.definition);
    const create = (): void => {
      const id = definitionDraftId(`definition-${crypto.randomUUID()}`);
      session.create(selection, {
        id,
        label: 'New definition',
        expression: {
          kind: 'union',
          items: [
            { kind: 'literal', value: 'Human' },
            { kind: 'literal', value: 'Agent' },
          ],
        },
      });
    };
    return (
      <div className={styles.editor}>
        <header>
          <strong>Shared definitions</strong>
          <p>Collection owned · {collection.definitions.length} saved</p>
        </header>
        <Button label="New definition" onClick={create} disabled={view.busy || !view.connected} />
        {[...values, ...created].map((definition) => (
          <DefinitionCard
            key={definition.id}
            definition={definition}
            draft={drafts.find((item) => item.definition.id === definition.id)}
            collection={collection}
            selection={selection}
            session={session}
            view={view}
            pending={state.pending.includes(
              drafts.find((item) => item.definition.id === definition.id)?.key ?? '',
            )}
            Field={Field}
            Button={Button}
          />
        ))}
        {state.problem && (
          <div role="alert">
            <p>{failureSummary(state.problem)}</p>
            <details>
              <summary>Technical details</summary>
              {formatFailure(state.problem).join(' · ')}
            </details>
          </div>
        )}
      </div>
    );
  }
  return Definitions;
}

function DefinitionCard({
  definition,
  draft,
  collection,
  selection,
  session,
  view,
  pending,
  Field,
  Button,
}: {
  readonly definition: import('@novakai/canvas-model').Definition;
  readonly draft: import('../../contract/records/definitions.js').DefinitionDraft | undefined;
  readonly collection: import('@novakai/canvas-model').Collection;
  readonly selection: DefinitionSelection;
  readonly session: import('../../contract/records/definitions.js').DefinitionSession;
  readonly view: FeatureProps['view'];
  readonly pending: boolean;
  readonly Field: DesignSlots['Field'];
  readonly Button: DesignSlots['Button'];
}): ReactElement {
  const usages = definitionUsages(collection, definition.id);
  const display = definitionDisplay(collection, definition.id);
  return (
    <fieldset className={styles.block}>
      <legend>{definition.label || 'Untitled definition'}</legend>
      <Field
        label="Name"
        control={(props) => (
          <input
            {...props}
            value={definition.label}
            disabled={pending}
            onChange={(event) =>
              session.edit(selection, { ...definition, label: event.target.value })
            }
          />
        )}
      />
      <ExpressionEditor
        expression={definition.expression}
        literalDrafts={draft?.literalDrafts ?? []}
        collection={collection}
        disabled={pending}
        onChange={(expression, editedPath) =>
          session.edit(selection, { ...definition, expression }, undefined, editedPath)
        }
        onLiteralDraft={(literalDraft) => session.edit(selection, definition, literalDraft)}
        Field={Field}
        Button={Button}
      />
      <p>Canonical: {display.ok ? display.value : 'Unavailable'}</p>
      <p>Used by {usageCount(usages)} field or definition reference(s)</p>
      {usageList(usages, view)}
      <div className={styles.choices}>
        <Button
          label="Delete definition"
          disabled={view.busy || !view.connected}
          onClick={() => session.remove(selection, definition)}
        />
        {draftActions(draft, session, view, Button, pending)}
      </div>
    </fieldset>
  );
}

function usageCount(result: ReturnType<typeof definitionUsages>): number {
  return result.ok ? result.value.length : 0;
}

function usageList(
  result: ReturnType<typeof definitionUsages>,
  view: FeatureProps['view'],
): ReactElement | null {
  if (!result.ok || result.value.length === 0) return null;
  return (
    <ul>
      {result.value.map((usage) => (
        <li key={`${usage.kind}:${usage.path}`}>
          {usage.kind === 'field' ? (
            <button
              type="button"
              disabled={findUsageNode(view, usage.object) === undefined}
              onClick={() => navigateUsage(view, usage.object)}
            >
              {usage.object}.{usage.field}
              {findUsageNode(view, usage.object) === undefined && ' · Not shown on canvas'}
            </button>
          ) : (
            usage.path
          )}
        </li>
      ))}
    </ul>
  );
}

function navigateUsage(
  view: FeatureProps['view'],
  objectId: string | undefined,
): void {
  if (view.active === null || objectId === undefined) return;
  const node = findUsageNode(view, objectId);
  if (node === undefined) return;
  view.active.session.dispatch({
    kind: 'select',
    targets: [{ kind: 'node', section: node.section, id: node.node.id }],
    mode: 'replace',
  });
}

function findUsageNode(
  view: FeatureProps['view'],
  objectId: string | undefined,
) {
  if (view.active === null || objectId === undefined) return undefined;
  return view.active.document.scene.sections
    .flatMap((section) => section.nodes.map((item) => ({ section: section.id, node: item })))
    .find((item) => item.node.measured.objectId === objectId);
}

function draftActions(
  draft: import('../../contract/records/definitions.js').DefinitionDraft | undefined,
  session: import('../../contract/records/definitions.js').DefinitionSession,
  view: FeatureProps['view'],
  Button: DesignSlots['Button'],
  pending: boolean,
): ReactElement | null {
  if (draft === undefined) return null;
  return (
    <>
      <Button
        label={draft.operation === 'remove' ? 'Apply deletion' : 'Apply definition'}
        variant="primary"
        disabled={pending || view.busy || !view.connected}
        pending={view.busy}
        onClick={() => void session.apply(draft.key)}
      />
      <Button label="Discard draft" disabled={pending} onClick={() => session.discard(draft.key)} />
    </>
  );
}

function ExpressionEditor({
  expression,
  literalDrafts,
  path = [],
  onLiteralDraft,
  onChange,
  Field,
  collection,
  Button,
  disabled = false,
}: {
  readonly expression: TypeExpression;
  readonly literalDrafts: readonly LiteralDraft[];
  readonly path?: readonly number[];
  readonly onChange: (expression: TypeExpression, editedPath?: readonly number[]) => void;
  readonly onLiteralDraft: (literalDraft: LiteralDraft) => void;
  readonly Field: DesignSlots['Field'];
  readonly collection: Collection;
  readonly Button: DesignSlots['Button'];
  readonly disabled?: boolean;
}): ReactElement {
  switch (expression.kind) {
    case 'union':
      return (
        <>
          {expression.items.map((item, index) => (
            <ExpressionEditor
              key={index}
              expression={item}
              literalDrafts={literalDrafts}
              path={[...path, index]}
              Field={Field}
              collection={collection}
              Button={Button}
              disabled={disabled}
              onChange={(next, editedPath) =>
                onChange(
                  {
                    kind: 'union',
                    items: expression.items.map((value, position) =>
                      position === index ? next : value,
                    ),
                  },
                  editedPath,
                )
              }
              onLiteralDraft={onLiteralDraft}
            />
          ))}
          <Button
            label="Add union alternative"
            disabled={disabled}
            onClick={() =>
              onChange({
                kind: 'union',
                items: [...expression.items, { kind: 'literal', value: '' }],
              })
            }
          />
          <Button
            label="Remove last alternative"
            disabled={disabled || expression.items.length <= 2}
            onClick={() => onChange({ kind: 'union', items: expression.items.slice(0, -1) })}
          />
        </>
      );
    case 'primitive':
      return (
        <Field
          label="Primitive"
          control={(props) => (
            <select
              {...props}
              disabled={disabled}
              value={expression.name}
              onChange={(event) =>
                onChange(
                  {
                    kind: 'primitive',
                    name: event.target.value as Extract<
                      TypeExpression,
                      { kind: 'primitive' }
                    >['name'],
                  },
                  path,
                )
              }
            >
              {['string', 'number', 'boolean', 'unknown', 'void'].map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        />
      );
    case 'reference':
      return (
        <Field
          label="Reference"
          control={(props) => (
            <select
              {...props}
              disabled={disabled}
              value={expression.id}
              onChange={(event) =>
                onChange(
                  {
                    kind: 'reference',
                    id: event.target.value as TypeExpression extends {
                      kind: 'reference';
                      id: infer I;
                    }
                      ? I
                      : never,
                  },
                  path,
                )
              }
            >
              {collection.definitions.map((definition) => (
                <option key={definition.id} value={definition.id}>
                  {definition.label} · @{definition.id}
                </option>
              ))}
            </select>
          )}
        />
      );
    case 'literal':
      return (
        <LiteralEditor
          value={expression.value}
          raw={literalDrafts.find((item) => samePath(item.path, path))}
          path={path}
          onChange={onChange}
          onRawChange={onLiteralDraft}
          Field={Field}
          disabled={disabled}
        />
      );
    default:
      return <p>Expression unavailable</p>;
  }
}

function LiteralEditor({
  value,
  raw,
  path,
  onChange,
  onRawChange,
  Field,
  disabled,
}: {
  readonly value: string | number | boolean;
  readonly raw: LiteralDraft | undefined;
  readonly path: readonly number[];
  readonly onChange: (
    expression: Extract<TypeExpression, { kind: 'literal' }>,
    editedPath?: readonly number[],
  ) => void;
  readonly onRawChange: (literalDraft: LiteralDraft) => void;
  readonly Field: DesignSlots['Field'];
  readonly disabled: boolean;
}): ReactElement {
  const kind = literalKind(value);
  const [kindDraft, setKindDraft] = useState(raw?.kind ?? kind);
  const [draft, setDraft] = useState(raw?.text ?? String(value));
  useEffect(() => {
    setDraft(raw?.text ?? String(value));
    setKindDraft(raw?.kind ?? kind);
  }, [value, kind, raw]);
  return (
    <Field
      label="Literal kind and value"
      control={(props) => (
        <div>
          <select
            id={props.id + '-kind'}
            aria-label="Literal kind"
            aria-invalid={props['aria-invalid']}
            aria-describedby={props['aria-describedby']}
            required={props.required}
            disabled={disabled}
            value={kindDraft}
            onChange={(event) => {
              setKindDraft(event.target.value as typeof kindDraft);
              setLiteralKind(event.target.value, draft, path, onChange, onRawChange);
            }}
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
          </select>
          {kindDraft === 'boolean' ? (
            <select
              id={props.id + '-value'}
              aria-label="Literal value"
              disabled={disabled}
              value={draft}
              onChange={(event) =>
                onChange({ kind: 'literal', value: event.target.value === 'true' }, path)
              }
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <input
              id={props.id + '-value'}
              aria-label="Literal value"
              disabled={disabled}
              value={draft}
              onChange={(event) =>
                updateLiteralText(
                  kindDraft,
                  event.target.value,
                  path,
                  setDraft,
                  onChange,
                  onRawChange,
                )
              }
            />
          )}
        </div>
      )}
    />
  );
}

function literalKind(value: string | number | boolean): 'string' | 'number' | 'boolean' {
  const kinds: Record<string, 'string' | 'number' | 'boolean'> = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
  };
  return kinds[typeof value] ?? 'string';
}

function setLiteralKind(
  kind: string,
  value: string,
  path: readonly number[],
  onChange: (
    expression: Extract<TypeExpression, { kind: 'literal' }>,
    editedPath?: readonly number[],
  ) => void,
  onRawChange: (literalDraft: LiteralDraft) => void,
): void {
  const number = finiteNumber(value);
  const handlers: Record<string, () => void> = {
    boolean: () => onChange({ kind: 'literal', value: value === 'true' }, path),
    string: () => onChange({ kind: 'literal', value }, path),
    number: () =>
      number === null
        ? onRawChange({ path, kind: 'number', text: value })
        : onChange({ kind: 'literal', value: number }, path),
  };
  handlers[kind]?.();
}

function updateLiteralText(
  kind: 'string' | 'number',
  value: string,
  path: readonly number[],
  setDraft: (value: string) => void,
  onChange: (
    expression: Extract<TypeExpression, { kind: 'literal' }>,
    editedPath?: readonly number[],
  ) => void,
  onRawChange: (literalDraft: LiteralDraft) => void,
): void {
  setDraft(value);
  const handlers: Record<'string' | 'number', () => void> = {
    string: () => onChange({ kind: 'literal', value }, path),
    number: () => {
      const number = finiteNumber(value);
      if (number === null) onRawChange({ path, kind, text: value });
      else onChange({ kind: 'literal', value: number }, path);
    },
  };
  handlers[kind]();
}

function completeNumber(value: string): boolean {
  return /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(value);
}

function finiteNumber(value: string): number | null {
  return completeNumber(value) && Number.isFinite(Number(value)) ? Number(value) : null;
}

function samePath(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
