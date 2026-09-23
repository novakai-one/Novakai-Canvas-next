import {
  formatFailure,
  functionTarget,
  plainWireProblem,
  wireApplyBlock,
  withNewFunction,
} from '../../contract/api.js';
import type { Collection } from '../../contract/records/owners.js';
import { useSyncExternalStore } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import type { WireFieldsProps } from '../../contract/wire-react.js';
import type {
  EditedWire,
  NewFunction,
  WireDraft,
  WireEdit,
} from '../../contract/records/wire-editor.js';
import type { Diagnostic } from '../../contract/errors.js';
import type { ConnectionDraft, Cardinality } from '../../contract/records/connection.js';
import type { SessionState } from '@novakai/canvas-canvas';
import { selectedWire, wireDraftKey, editedWire } from '../../contract/api.js';
import { relationshipLabel } from '@novakai/canvas-model';
import styles from './ObjectEditor.module.css';
/** Injected field groups stay mounted across ordinary edits and can be reorganized at composition. */
export function createWireEditor({
  Button,
  Field,
  fields,
}: Pick<DesignSlots, 'Button' | 'Field'> & {
  readonly fields: readonly {
    readonly id: string;
    readonly Content: ComponentType<WireFieldsProps>;
  }[];
}): ComponentType<FeatureProps> {
  /** Selection changes show another retained form; they never move the camera or submit an edit. */
  function WireEditor({ controller, view }: FeatureProps): ReactElement {
    const canvas = useSyncExternalStore(
      view.active?.session.subscribe ?? emptySubscribe,
      view.active?.session.getSnapshot ?? emptySnapshot,
    );
    const session = controller.wires;
    const forms = useSyncExternalStore(session.subscribe, session.getSnapshot);
    if (view.connection !== null)
      return (
        <ConnectionForm
          draft={view.connection}
          busy={view.busy}
          connected={view.connected}
          Field={Field}
          Button={Button}
          edit={controller.editConnection}
          apply={controller.applyConnection}
          cancel={controller.cancelConnection}
        />
      );
    return (
      <WireSelectionEditor
        view={view}
        canvas={canvas}
        session={session}
        forms={forms}
        fields={fields}
        Button={Button}
      />
    );
  }
  return WireEditor;
}

function WireSelectionEditor({
  view,
  canvas,
  session,
  forms,
  fields,
  Button,
}: Pick<FeatureProps, 'view'> & {
  readonly canvas: SessionState | null;
  readonly session: FeatureProps['controller']['wires'];
  readonly forms: ReturnType<FeatureProps['controller']['wires']['getSnapshot']>;
  readonly fields: readonly {
    readonly id: string;
    readonly Content: ComponentType<WireFieldsProps>;
  }[];
  readonly Button: DesignSlots['Button'];
}): ReactElement {
  const selection = selectedWire(view, canvas?.selection[0]);
  if (selection === null) return <p>Select a wire to edit its label, endpoints or route.</p>;
  const key = wireDraftKey(
    selection.collection.id,
    selection.section.id,
    selection.relationship.id,
  );
  const draft = forms.drafts.find((item) => item.key === key);
  const value: EditedWire = draft ? editedWire(draft) : selection;
  const collection = withNewFunction(selection.collection, value.created ?? null);
  const edit = (command: WireEdit): void => {
    session.edit(selection, command);
  };
  return (
    <div className={styles.editor}>
      <header>
        <strong>{relationshipLabel(selection.relationship)}</strong>
        <p>
          {selection.section.title} · {selection.relationship.id}
        </p>
      </header>
      {fields.map(({ id, Content }) => (
        <Content key={id} value={value} collection={collection} edit={edit} />
      ))}
      <WireProblem problem={forms.problem} value={value} collection={collection} />
      {draft && (
        <WireFooter
          draft={draft}
          value={value}
          collection={collection}
          view={view}
          Button={Button}
          apply={() => void session.apply(key)}
          discard={() => session.discard(key)}
        />
      )}
    </div>
  );
}
/** A failed Apply reads as one plain sentence; the owner's exact evidence stays one click away. */
function WireProblem({
  problem,
  value,
  collection,
}: {
  readonly problem: Diagnostic | null;
  readonly value: EditedWire;
  readonly collection: Collection;
}): ReactElement | null {
  if (problem === null) return null;
  const context = {
    kind: value.relationship.kind,
    moduleWire: functionTarget(collection, value.relationship) !== null,
  };
  return (
    <div role="alert">
      <p>{plainWireProblem(problem, context)}</p>
      <details>
        <summary>Technical details</summary>
        {formatFailure(problem).map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </details>
    </div>
  );
}
/** Apply is blocked, with a reason, while the label is blank; a staged module change is restated. */
function WireFooter({
  draft,
  value,
  collection,
  view,
  Button,
  apply,
  discard,
}: Pick<FeatureProps, 'view'> & {
  readonly draft: WireDraft;
  readonly value: EditedWire;
  readonly collection: Collection;
  readonly Button: DesignSlots['Button'];
  readonly apply: () => void;
  readonly discard: () => void;
}): ReactElement {
  const created = value.created ?? null;
  const blocked = wireApplyBlock(collection, value);
  return (
    <footer>
      <p>
        Draft from revision {draft.collection.revision}. Shared meaning and local routing apply
        together.
      </p>
      <CreatedHint created={created} collection={collection} />
      {blocked !== null && (
        <p className={styles.hint} role="status">
          {`Apply is off. ${blocked}`}
        </p>
      )}
      <div className={styles.choices}>
        <Button
          label={created ? 'Add function and apply wire' : 'Apply wire'}
          variant="primary"
          disabled={view.busy || !view.connected || blocked !== null}
          pending={view.busy}
          onClick={apply}
        />
        <Button label="Discard wire draft" onClick={discard} />
      </div>
    </footer>
  );
}
function CreatedHint({
  created,
  collection,
}: {
  readonly created: NewFunction | null;
  readonly collection: Collection;
}): ReactElement | null {
  if (created === null) return null;
  const owner = collection.objects.find((item) => item.id === created.object);
  return (
    <p className={styles.hint}>
      {`Apply also adds function '${created.label}' to module ${owner?.label ?? created.object}.`}
    </p>
  );
}

function ConnectionForm({
  draft,
  busy,
  connected,
  Field,
  Button,
  edit,
  apply,
  cancel,
}: {
  readonly draft: ConnectionDraft;
  readonly busy: boolean;
  readonly connected: boolean;
  readonly Field: DesignSlots['Field'];
  readonly Button: DesignSlots['Button'];
  readonly edit: (edit: import('../../contract/records/connection.js').ConnectionEdit) => void;
  readonly apply: () => Promise<unknown>;
  readonly cancel: () => void;
}): ReactElement {
  const endpoint = (side: 'Source' | 'Target', value: ConnectionDraft['source']): string =>
    `${side}: ${value.label}${value.memberLabel ? ` · ${value.memberLabel}` : ''}`;
  const locked = busy || draft.requestState !== 'draft';
  return (
    <div className={styles.editor}>
      <header>
        <strong>New connection</strong>
        <p>{draft.section.title}</p>
      </header>
      <p>{endpoint('Source', draft.source)}</p>
      <p>{endpoint('Target', draft.target)}</p>
      <Field
        label="Connection label"
        required
        control={(props) => (
          <input
            {...props}
            value={draft.label}
            disabled={locked}
            onChange={(event) => edit({ kind: 'label', value: event.target.value })}
          />
        )}
      />
      <Field
        label="Relationship kind"
        control={(props) => (
          <select
            {...props}
            value={draft.kind}
            disabled={locked}
            onChange={(event) => {
              const value = draft.kinds.find((kind) => kind === event.target.value);
              if (value !== undefined) edit({ kind: 'relationship-kind', value });
            }}
          >
            {draft.kinds.map((kind) => (
              <option key={kind}>{kind}</option>
            ))}
          </select>
        )}
      />
      {draft.kind === 'association' && (
        <>
          <CardinalityField
            label="Source cardinality"
            value={draft.from}
            disabled={locked}
            Field={Field}
            edit={(value) => edit({ kind: 'cardinality', side: 'from', value })}
          />
          <CardinalityField
            label="Target cardinality"
            value={draft.to}
            disabled={locked}
            Field={Field}
            edit={(value) => edit({ kind: 'cardinality', side: 'to', value })}
          />
        </>
      )}
      {draft.requestState !== 'draft' && (
        <p role="status">This request is unresolved. Reconcile or retry it from pending edits.</p>
      )}
      {draft.problem !== null && <p role="alert">{draft.problem}</p>}
      <div className={styles.choices}>
        <Button label="Cancel connection" disabled={locked} onClick={cancel} />
        <Button
          label="Apply connection"
          variant="primary"
          disabled={locked || !connected || draft.label.trim().length === 0}
          pending={busy}
          onClick={() => {
            void apply();
          }}
        />
      </div>
    </div>
  );
}

function CardinalityField({
  label,
  value,
  disabled,
  Field,
  edit,
}: {
  readonly label: string;
  readonly value: Cardinality;
  readonly disabled: boolean;
  readonly Field: DesignSlots['Field'];
  readonly edit: (value: Cardinality) => void;
}): ReactElement {
  const values: readonly Cardinality[] = ['none', '0..1', '1', '0..many', '1..many'];
  return (
    <Field
      label={label}
      control={(props) => (
        <select
          {...props}
          value={value}
          disabled={disabled}
          onChange={(event) => edit(values.find((item) => item === event.target.value) ?? 'none')}
        >
          {values.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      )}
    />
  );
}
/** Empty subscriptions preserve hook order while no collection is open. */
function emptySubscribe(): () => void {
  return () => undefined;
}
/** An absent Canvas has no fabricated selection. */
function emptySnapshot(): null {
  return null;
}
