import { useEffect, useRef, useState, type ComponentType, type ReactElement } from 'react';
import { failureSummary, plainMessage } from '../../contract/api.js';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import type {
  AddDiagramDraft,
  AddGroupDraft,
  AddObjectDraft,
} from '../../contract/records/creation.js';
import type { DiagramObject, Section } from '../../contract/records/owners.js';
import styles from './AddTools.module.css';

/** Narrow semantic authoring controls. Drafts stay local until an explicit submit. */
export function createAddTools({
  Field,
  Button,
}: Pick<DesignSlots, 'Field' | 'Button'>): ComponentType<FeatureProps> {
  function AddTools({ controller, view }: FeatureProps): ReactElement {
    const [diagram, setDiagramLocal] = useState<AddDiagramDraft>(view.creation.diagram);
    const [object, setObjectLocal] = useState<AddObjectDraft>(view.creation.object);
    const [group, setGroupLocal] = useState<AddGroupDraft>(view.creation.group);
    const [busy, setBusy] = useState(view.creation.busy);
    const [adding, setAdding] = useState(view.creation.adding);
    const send = (kind: NonNullable<typeof adding>): void => {
      setBusy(true);
      setAdding(kind);
    };
    const setDiagram = (draft: AddDiagramDraft): void => {
      setDiagramLocal(draft);
      controller.setDiagramDraft(draft);
    };
    const setObject = (draft: AddObjectDraft): void => {
      setObjectLocal(draft);
      controller.setObjectDraft(draft);
    };
    const setGroup = (draft: AddGroupDraft): void => {
      setGroupLocal(draft);
      controller.setGroupDraft(draft);
    };
    useEffect(() => {
      setDiagramLocal(view.creation.diagram);
      setObjectLocal(view.creation.object);
      setGroupLocal(view.creation.group);
      setBusy(view.creation.busy);
      setAdding(view.creation.adding);
    }, [view.creation]);
    const sections = (view.active?.document.collection.sections ?? []).filter(
      (section) => section.mode !== 'tree',
    );
    const objects = view.active?.document.collection.objects ?? [];
    const targetSection = selectedSection(object.section, sections);
    const target = sections.find((section) => section.id === targetSection);
    return (
      <div className={styles.tools}>
        <CreationProblem problem={barShowsSame(view) ? null : view.creation.problem} />
        <DiagramForm
          Field={Field}
          Button={Button}
          draft={diagram}
          busy={busy}
          adding={busy && adding === 'diagram'}
          onDraft={setDiagram}
          onCancel={() => controller.cancelCreation('diagram')}
          onSubmit={async () => {
            send('diagram');
            await controller.addDiagram(diagram);
          }}
        />
        <ObjectForm
          Field={Field}
          Button={Button}
          sections={sections}
          objects={objects}
          groups={target?.groups ?? []}
          targetSection={targetSection}
          draft={object}
          busy={busy}
          adding={busy && adding === 'object'}
          onDraft={setObject}
          onCancel={() => controller.cancelCreation('object')}
          onSubmit={async () => {
            send('object');
            await controller.addObject({ ...object, section: targetSection });
          }}
        />
        <GroupForm
          Field={Field}
          Button={Button}
          sections={sections}
          draft={group}
          busy={busy}
          adding={busy && adding === 'group'}
          onDraft={setGroup}
          onCancel={() => controller.cancelCreation('group')}
          onSubmit={async () => {
            send('group');
            await controller.addGroup({
              ...group,
              section: selectedSection(group.section, sections),
            });
          }}
        />
      </div>
    );
  }
  return AddTools;
}

/** The form keeps its own error unless the error bar already says the same thing. */
function barShowsSame(view: FeatureProps['view']): boolean {
  if (view.problem === null) return false;
  const shown = [failureSummary(view.problem), plainMessage(view.problem.message)];
  return shown.includes(view.creation.problem ?? '');
}
/** A section from another collection (or none) falls back to the first diagram, so the select and the submit agree. */
function selectedSection(
  current: string,
  sections: readonly Section[],
): string {
  return sections.some((section) => section.id === current) ? current : (sections[0]?.id ?? '');
}
type FormSlots = Pick<DesignSlots, 'Field' | 'Button'>;
function DiagramForm({
  Field,
  Button,
  draft,
  busy,
  adding,
  onCancel,
  onDraft,
  onSubmit,
}: FormSlots & {
  draft: AddDiagramDraft;
  busy: boolean;
  adding: boolean;
  onCancel: () => void;
  onDraft: (draft: AddDiagramDraft) => void;
  onSubmit: () => Promise<void>;
}): ReactElement {
  return (
    <section aria-labelledby="add-diagram-title">
      <h3 id="add-diagram-title">Diagram</h3>
      <p className={styles.hint}>
        Start with a blank grid and add the first module when you are ready.
      </p>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <Field
          label="Diagram name"
          required
          control={(field) => (
            <input
              {...field}
              disabled={busy}
              value={draft.title}
              onChange={(event) => onDraft({ ...draft, title: event.target.value })}
            />
          )}
        />
        <div className={styles.actions}>
          <Button label="Cancel" type="button" disabled={busy} onClick={onCancel} />
          <Button
            label={adding ? 'Adding…' : 'Add diagram'}
            type="submit"
            variant="primary"
            disabled={busy || draft.title.trim().length === 0}
          />
        </div>
      </form>
    </section>
  );
}
function ObjectForm({
  Field,
  Button,
  sections,
  objects,
  groups,
  targetSection,
  draft,
  busy,
  adding,
  onCancel,
  onDraft,
  onSubmit,
}: FormSlots & {
  sections: readonly Section[];
  objects: readonly DiagramObject[];
  groups: ReadonlyArray<Section['groups'][number]>;
  targetSection: string;
  draft: AddObjectDraft;
  busy: boolean;
  adding: boolean;
  onCancel: () => void;
  onDraft: (draft: AddObjectDraft) => void;
  onSubmit: () => Promise<void>;
}): ReactElement {
  if (sections.length === 0) return <ObjectEmpty />;
  return (
    <ObjectReady
      Field={Field}
      Button={Button}
      sections={sections}
      objects={objects}
      groups={groups}
      targetSection={targetSection}
      draft={draft}
      busy={busy}
      adding={adding}
      onCancel={onCancel}
      onDraft={onDraft}
      onSubmit={onSubmit}
    />
  );
}
function ObjectEmpty(): ReactElement {
  return (
    <section aria-labelledby="add-object-title">
      <h3 id="add-object-title">Object</h3>
      <p className={styles.empty}>Add a diagram before adding an object.</p>
    </section>
  );
}
function ObjectReady({
  Field,
  Button,
  sections,
  objects,
  groups,
  targetSection,
  draft,
  busy,
  adding,
  onCancel,
  onDraft,
  onSubmit,
}: FormSlots & {
  sections: readonly Section[];
  objects: readonly DiagramObject[];
  groups: ReadonlyArray<Section['groups'][number]>;
  targetSection: string;
  draft: AddObjectDraft;
  busy: boolean;
  adding: boolean;
  onCancel: () => void;
  onDraft: (draft: AddObjectDraft) => void;
  onSubmit: () => Promise<void>;
}): ReactElement {
  const present = presentObjects(sections, targetSection);
  const duplicate = draft.reuseObject !== null && present.has(draft.reuseObject);
  return (
    <section aria-labelledby="add-object-title">
      <h3 id="add-object-title">Object</h3>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <Field
          label="Diagram"
          required
          control={(field) => (
            <select
              {...field}
              disabled={busy}
              value={targetSection}
              onChange={(event) => onDraft({ ...draft, section: event.target.value })}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          )}
        />
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
              {objects.map((item) => (
                <option key={item.id} value={item.id} disabled={present.has(item.id)}>
                  {reuseLabel(item, present)}
                </option>
              ))}
            </select>
          )}
        />
        {moduleField(Field, draft, busy, onDraft)}
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
              {groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          )}
        />
        {duplicate && (
          <p role="alert">
            That object is already in this diagram. Pick another object or diagram.
          </p>
        )}
        <div className={styles.actions}>
          <Button label="Cancel" type="button" disabled={busy} onClick={onCancel} />
          <Button
            label={adding ? 'Adding…' : objectActionLabel(draft)}
            type="submit"
            variant="primary"
            disabled={duplicate || objectDisabled(busy, draft)}
          />
        </div>
      </form>
    </section>
  );
}

function GroupForm({
  Field,
  Button,
  sections,
  draft,
  busy,
  adding,
  onCancel,
  onDraft,
  onSubmit,
}: FormSlots & {
  sections: readonly Section[];
  draft: AddGroupDraft;
  busy: boolean;
  adding: boolean;
  onCancel: () => void;
  onDraft: (draft: AddGroupDraft) => void;
  onSubmit: () => Promise<void>;
}): ReactElement {
  if (sections.length === 0) return <ObjectEmpty />;
  return (
    <section aria-labelledby="add-group-title">
      <h3 id="add-group-title">Group</h3>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <Field
          label="Diagram"
          required
          control={(field) => (
            <select
              {...field}
              disabled={busy}
              value={selectedSection(draft.section, sections)}
              onChange={(event) => onDraft({ ...draft, section: event.target.value })}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          )}
        />
        <Field
          label="Group name"
          required
          control={(field) => (
            <input
              {...field}
              disabled={busy}
              value={draft.title}
              onChange={(event) => onDraft({ ...draft, title: event.target.value })}
            />
          )}
        />
        <label>
          <input
            type="checkbox"
            checked={draft.findRoom ?? false}
            disabled={busy}
            onChange={(event) => onDraft({ ...draft, findRoom: event.target.checked })}
          />
          Allow this diagram to move to make room
        </label>
        <p>May move and resize this diagram. Other diagrams keep their saved positions.</p>
        <div className={styles.actions}>
          <Button label="Cancel" type="button" disabled={busy} onClick={onCancel} />
          <Button
            label={adding ? 'Adding…' : 'Add group'}
            type="submit"
            variant="primary"
            disabled={busy || draft.title.trim().length === 0}
          />
        </div>
      </form>
    </section>
  );
}
function moduleField(
  Field: FormSlots['Field'],
  draft: AddObjectDraft,
  busy: boolean,
  onDraft: (draft: AddObjectDraft) => void,
): ReactElement | null {
  if (draft.reuseObject !== null) return null;
  return (
    <Field
      label="Module name"
      required
      control={(field) => (
        <input
          {...field}
          disabled={busy}
          value={draft.label}
          onChange={(event) => onDraft({ ...draft, label: event.target.value })}
        />
      )}
    />
  );
}
function objectActionLabel(draft: AddObjectDraft): string {
  return draft.reuseObject === null ? 'Add module' : 'Reuse object';
}
function objectDisabled(
  busy: boolean,
  draft: AddObjectDraft,
): boolean {
  return busy || (draft.reuseObject === null && draft.label.trim().length === 0);
}

/** Objects that already appear in the target diagram cannot be reused there again. */
function presentObjects(
  sections: readonly Section[],
  target: string,
): ReadonlySet<string> {
  const section = sections.find((item) => item.id === target);
  return new Set(section?.appearances.map((appearance) => appearance.object) ?? []);
}
function reuseLabel(
  item: DiagramObject,
  present: ReadonlySet<string>,
): string {
  return present.has(item.id) ? `${item.label} · already in this diagram` : item.label;
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
