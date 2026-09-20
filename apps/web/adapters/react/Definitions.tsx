import { useSyncExternalStore } from 'react';
import type { ComponentType, ReactElement } from 'react';
import { definitionDisplay, definitionUsages, type TypeExpression } from '@novakai/canvas-model';
import type { DesignSlots, FeatureProps } from '../../contract/react-types.js';
import type { DefinitionSelection } from '../../contract/records/definitions.js';
import { definitionDraftId } from '../definition-session.js';
import { formatFailure } from '../../contract/api.js';
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
        {values.map((definition) => (
          <DefinitionCard
            key={definition.id}
            definition={definition}
            draft={drafts.find((item) => item.definition.id === definition.id)}
            collection={collection}
            selection={selection}
            session={session}
            view={view}
            Field={Field}
            Button={Button}
          />
        ))}
        {state.problem && <p role="alert">{formatFailure(state.problem).join(' · ')}</p>}
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
  Field,
  Button,
}: {
  readonly definition: import('@novakai/canvas-model').Definition;
  readonly draft: import('../../contract/records/definitions.js').DefinitionDraft | undefined;
  readonly collection: import('@novakai/canvas-model').Collection;
  readonly selection: DefinitionSelection;
  readonly session: import('../../contract/records/definitions.js').DefinitionSession;
  readonly view: FeatureProps['view'];
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
            onChange={(event) =>
              session.edit(selection, { ...definition, label: event.target.value })
            }
          />
        )}
      />
      <ExpressionEditor
        expression={definition.expression}
        onChange={(expression) => session.edit(selection, { ...definition, expression })}
        Field={Field}
      />
      <p>Canonical: {display.ok ? display.value : 'Unavailable'}</p>
      <p>Used by {usageCount(usages)} field or definition reference(s)</p>
      {usageList(usages)}
      <div className={styles.choices}>
        <Button
          label="Delete definition"
          disabled={view.busy || !view.connected}
          onClick={() => session.remove(selection, definition)}
        />
        {draftActions(draft, session, view, Button)}
      </div>
    </fieldset>
  );
}

function usageCount(result: ReturnType<typeof definitionUsages>): number {
  return result.ok ? result.value.length : 0;
}

function usageList(result: ReturnType<typeof definitionUsages>): ReactElement | null {
  if (!result.ok || result.value.length === 0) return null;
  return (
    <ul>
      {result.value.map((usage) => (
        <li key={`${usage.kind}:${usage.path}`}>
          {usage.kind === 'field' ? `${usage.object}.${usage.field}` : usage.path}
        </li>
      ))}
    </ul>
  );
}

function draftActions(
  draft: import('../../contract/records/definitions.js').DefinitionDraft | undefined,
  session: import('../../contract/records/definitions.js').DefinitionSession,
  view: FeatureProps['view'],
  Button: DesignSlots['Button'],
): ReactElement | null {
  if (draft === undefined) return null;
  return (
    <>
      <Button
        label={draft.operation === 'remove' ? 'Apply deletion' : 'Apply definition'}
        variant="primary"
        disabled={view.busy || !view.connected}
        pending={view.busy}
        onClick={() => void session.apply(draft.key)}
      />
      <Button label="Discard draft" onClick={() => session.discard(draft.key)} />
    </>
  );
}

function ExpressionEditor({
  expression,
  onChange,
  Field,
}: {
  readonly expression: TypeExpression;
  readonly onChange: (expression: TypeExpression) => void;
  readonly Field: DesignSlots['Field'];
}): ReactElement {
  if (expression.kind === 'union')
    return (
      <>
        {expression.items.map((item, index) => (
          <ExpressionEditor
            key={index}
            expression={item}
            onChange={(next) =>
              onChange({
                kind: 'union',
                items: expression.items.map((value, position) =>
                  position === index ? next : value,
                ),
              })
            }
            Field={Field}
          />
        ))}
      </>
    );
  if (expression.kind !== 'literal') return <p>Expression: {expression.kind}</p>;
  return (
    <Field
      label="Literal"
      control={(props) => (
        <input
          {...props}
          value={String(expression.value)}
          onChange={(event) => onChange({ ...expression, value: event.target.value })}
        />
      )}
    />
  );
}
