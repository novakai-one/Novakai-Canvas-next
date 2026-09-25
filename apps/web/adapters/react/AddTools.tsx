/*
 * The Add panel: three forms that add a diagram, an object or a group to the open collection.
 * Core builds the panel view from the local drafts; this adapter draws it and forwards edits. An
 * edit sets the local draft, then the controller's; a submit locks the forms before the controller
 * call, and new controller creation state replaces the local copies. The add calls return a
 * Result; a failure is also published as `creation.problem`, which the panel shows in its alert,
 * so the returned Results are deliberately not read here.
 */
import { useEffect, useRef, useState } from 'react';
import type { ComponentType, FormEvent, ReactElement } from 'react';
import { buildCreationPanel } from '../../contract/api.js';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import type {
  AddDiagramDraft,
  AddGroupDraft,
  AddObjectDraft,
  CreationDrafts,
  CreationKind,
  CreationView,
  FormView,
  GroupFormView,
  ObjectFormView,
  SubmitView,
} from '../../contract/records/creation.js';
import type { Section } from '../../contract/records/owners.js';
import type { WorkspaceController } from '../../contract/records/workspace.js';
import styles from './AddTools.module.css';

/** Narrow semantic authoring controls. Drafts stay local until an explicit submit. */
export function createAddTools({
  Field,
  Button,
}: Pick<DesignSlots, 'Field' | 'Button'>): ComponentType<FeatureProps> {
  /** The problem line over the Diagram, Object and Group forms. */
  function AddTools({ controller, view }: FeatureProps): ReactElement {
    const local = useLocalCreation(controller, view.creation);
    const panel = buildCreationPanel(local.drafts, view);
    return (
      <div className={styles.tools}>
        <CreationProblem problem={panel.problem} />
        <DiagramForm
          form={panel.diagram}
          onDraft={local.setDiagram}
          onCancel={() => controller.cancelCreation('diagram')}
          onSubmit={async (request) => {
            local.lock('diagram');
            await controller.addDiagram(request);
          }}
        />
        <ObjectForm
          form={panel.object}
          onDraft={local.setObject}
          onCancel={() => controller.cancelCreation('object')}
          onSubmit={async (request) => {
            local.lock('object');
            await controller.addObject(request);
          }}
        />
        <GroupForm
          form={panel.group}
          onDraft={local.setGroup}
          onCancel={() => controller.cancelCreation('group')}
          onSubmit={async (request) => {
            local.lock('group');
            await controller.addGroup(request);
          }}
        />
      </div>
    );
  }

  /** The Diagram form: a name for a new blank grid diagram. */
  function DiagramForm({
    form,
    onDraft,
    onCancel,
    onSubmit,
  }: FormProps<AddDiagramDraft, FormView<AddDiagramDraft>>): ReactElement {
    const { draft, busy } = form;
    return (
      <section aria-labelledby="add-diagram-title">
        <h3 id="add-diagram-title">Diagram</h3>
        <p className={styles.hint}>
          Start with a blank grid and add the first module when you are ready.
        </p>
        <form className={styles.form} onSubmit={submitWith(() => onSubmit(form.request))}>
          {nameField('Diagram name', draft.title, busy, (title) => onDraft({ ...draft, title }))}
          {formActions(busy, form.submit, onCancel)}
        </form>
      </section>
    );
  }

  /** The Object form: diagram, reuse, module name and group; the empty note with no diagram. */
  function ObjectForm({
    form,
    onDraft,
    onCancel,
    onSubmit,
  }: FormProps<AddObjectDraft, ObjectFormView | null>): ReactElement {
    if (form === null) return <ObjectEmpty />;
    const { draft, busy } = form;
    return (
      <section aria-labelledby="add-object-title">
        <h3 id="add-object-title">Object</h3>
        <form className={styles.form} onSubmit={submitWith(() => onSubmit(form.request))}>
          {diagramField(form.sections, form.section, busy, (section) =>
            onDraft({ ...draft, section }),
          )}
          <Field
            label="Reuse existing object"
            control={(field) => (
              <select
                {...field}
                disabled={busy}
                value={draft.reuseObject ?? ''}
                onChange={(event) => onDraft({ ...draft, reuseObject: event.target.value || null })}
              >
                <option value="">Create a new module</option>
                {form.reuse.map((choice) => (
                  <option key={choice.id} value={choice.id} disabled={choice.disabled}>
                    {choice.label}
                  </option>
                ))}
              </select>
            )}
          />
          {moduleField(form, onDraft)}
          <Field
            label="Group"
            control={(field) => (
              <select
                {...field}
                disabled={busy}
                value={draft.group ?? ''}
                onChange={(event) => onDraft({ ...draft, group: event.target.value || null })}
              >
                <option value="">No group</option>
                {form.groups.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            )}
          />
          {form.duplicate && (
            <p role="alert">
              That object is already in this diagram. Pick another object or diagram.
            </p>
          )}
          {formActions(busy, form.submit, onCancel)}
        </form>
      </section>
    );
  }

  /** The Group form: diagram, name and room to move. With no diagram it shows the Object note. */
  function GroupForm({
    form,
    onDraft,
    onCancel,
    onSubmit,
  }: FormProps<AddGroupDraft, GroupFormView | null>): ReactElement {
    if (form === null) return <ObjectEmpty />;
    const { draft, busy } = form;
    return (
      <section aria-labelledby="add-group-title">
        <h3 id="add-group-title">Group</h3>
        <form className={styles.form} onSubmit={submitWith(() => onSubmit(form.request))}>
          {diagramField(form.sections, form.section, busy, (section) =>
            onDraft({ ...draft, section }),
          )}
          {nameField('Group name', draft.title, busy, (title) => onDraft({ ...draft, title }))}
          <label>
            <input
              type="checkbox"
              checked={form.findRoom}
              disabled={busy}
              onChange={(event) => onDraft({ ...draft, findRoom: event.target.checked })}
            />
            Allow this diagram to move to make room
          </label>
          <p>May move and resize this diagram. Other diagrams keep their saved positions.</p>
          {formActions(busy, form.submit, onCancel)}
        </form>
      </section>
    );
  }

  /** The required Diagram select over the diagrams that take adds. */
  function diagramField(
    sections: readonly Section[],
    section: string,
    busy: boolean,
    onSection: (section: string) => void,
  ): ReactElement {
    return (
      <Field
        label="Diagram"
        required
        control={(field) => (
          <select
            {...field}
            disabled={busy}
            value={section}
            onChange={(event) => onSection(event.target.value)}
          >
            {sections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        )}
      />
    );
  }

  /** The Module name input; none while an existing object is reused. */
  function moduleField(
    form: ObjectFormView,
    onDraft: (draft: AddObjectDraft) => void,
  ): ReactElement | null {
    if (!form.newModule) return null;
    const draft = form.draft;
    return nameField('Module name', draft.label, form.busy, (label) =>
      onDraft({ ...draft, label }),
    );
  }

  /** A required name input. */
  function nameField(
    label: string,
    value: string,
    busy: boolean,
    onName: (name: string) => void,
  ): ReactElement {
    return (
      <Field
        label={label}
        required
        control={(field) => (
          <input
            {...field}
            disabled={busy}
            value={value}
            onChange={(event) => onName(event.target.value)}
          />
        )}
      />
    );
  }

  /** Cancel, and the form's submit button. */
  function formActions(
    busy: boolean,
    submit: SubmitView,
    onCancel: () => void,
  ): ReactElement {
    return (
      <div className={styles.actions}>
        <Button label="Cancel" type="button" disabled={busy} onClick={onCancel} />
        <Button label={submit.label} type="submit" variant="primary" disabled={submit.disabled} />
      </div>
    );
  }

  return AddTools;
}

/** A form's view, and its draft, cancel and submit callbacks. */
interface FormProps<Draft, View> {
  readonly form: View;
  readonly onDraft: (draft: Draft) => void;
  readonly onCancel: () => void;
  readonly onSubmit: (request: Draft) => Promise<void>;
}

/** The local drafts and lock, the lock itself, and draft setters that also tell the controller. */
interface LocalCreation {
  readonly drafts: CreationDrafts;
  readonly lock: (kind: CreationKind) => void;
  readonly setDiagram: (draft: AddDiagramDraft) => void;
  readonly setObject: (draft: AddObjectDraft) => void;
  readonly setGroup: (draft: AddGroupDraft) => void;
}

/**
 * Local copies of the drafts and the lock. An edit sets the copy, then tells the controller; a
 * submit locks before the controller answers; new controller creation state replaces all five.
 */
function useLocalCreation(
  controller: Pick<WorkspaceController, 'setDiagramDraft' | 'setObjectDraft' | 'setGroupDraft'>,
  creation: CreationView,
): LocalCreation {
  const [diagram, setDiagramLocal] = useState(creation.diagram);
  const [object, setObjectLocal] = useState(creation.object);
  const [group, setGroupLocal] = useState(creation.group);
  const [busy, setBusy] = useState(creation.busy);
  const [adding, setAdding] = useState(creation.adding);
  useEffect(() => {
    setDiagramLocal(creation.diagram);
    setObjectLocal(creation.object);
    setGroupLocal(creation.group);
    setBusy(creation.busy);
    setAdding(creation.adding);
  }, [creation]);
  return {
    drafts: { diagram, object, group, busy, adding },
    lock: (kind) => {
      setBusy(true);
      setAdding(kind);
    },
    setDiagram: (draft) => {
      setDiagramLocal(draft);
      controller.setDiagramDraft(draft);
    },
    setObject: (draft) => {
      setObjectLocal(draft);
      controller.setObjectDraft(draft);
    },
    setGroup: (draft) => {
      setGroupLocal(draft);
      controller.setGroupDraft(draft);
    },
  };
}

/** A submit handler: the page stays, and the action runs without being awaited. */
function submitWith(action: () => Promise<void>): (event: FormEvent<HTMLFormElement>) => void {
  return (event) => {
    event.preventDefault();
    void action();
  };
}

/** The Object form when the collection has no diagram to add to. */
function ObjectEmpty(): ReactElement {
  return (
    <section aria-labelledby="add-object-title">
      <h3 id="add-object-title">Object</h3>
      <p className={styles.empty}>Add a diagram before adding an object.</p>
    </section>
  );
}

/** The panel may be scrolled to the form below, so a new problem scrolls itself into view. */
function CreationProblem({ problem }: { problem: string | null }): ReactElement | null {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest' });
  }, [problem]);
  if (problem === null) return null;
  return (
    <p ref={ref} role="alert">
      {problem}
    </p>
  );
}
