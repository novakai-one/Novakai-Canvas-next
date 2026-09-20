import { useState, type ComponentType, type ReactElement } from 'react';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import type { AddDiagramDraft, AddObjectDraft } from '../../contract/records/creation.js';
import type { DiagramObject, Section } from '../../contract/records/owners.js';
import styles from './AddTools.module.css';

/** Narrow semantic authoring controls. Drafts stay local until an explicit submit. */
export function createAddTools({
  Field,
  Button,
}: Pick<DesignSlots, 'Field' | 'Button'>): ComponentType<FeatureProps> {
  function AddTools({ controller, view }: FeatureProps): ReactElement {
    const [diagram, setDiagram] = useState<AddDiagramDraft>({ title: '', mode: 'grid' });
    const [object, setObject] = useState<AddObjectDraft>({
      section: '',
      label: '',
      kind: 'module',
      reuseObject: null,
    });
    const [busy, setBusy] = useState(false);
    const sections = view.active?.document.collection.sections ?? [];
    const objects = view.active?.document.collection.objects ?? [];
    const targetSection = selectedSection(object.section, sections);
    return (
      <div className={styles.tools}>
        <DiagramForm
          Field={Field}
          Button={Button}
          draft={diagram}
          busy={busy}
          onDraft={setDiagram}
          onSubmit={async () => {
            setBusy(true);
            const result = await controller.addDiagram(diagram);
            setBusy(false);
            resetDiagram(result, setDiagram);
          }}
        />
        <ObjectForm
          Field={Field}
          Button={Button}
          sections={sections}
          objects={objects}
          targetSection={targetSection}
          draft={object}
          busy={busy}
          onDraft={setObject}
          onSubmit={async () => {
            setBusy(true);
            const result = await controller.addObject({ ...object, section: targetSection });
            setBusy(false);
            resetObject(result, targetSection, setObject);
          }}
        />
      </div>
    );
  }
  return AddTools;
}

function selectedSection(current: string, sections: readonly Section[]): string {
  return current || sections[0]?.id || '';
}
function resetDiagram(
  result: Awaited<ReturnType<FeatureProps['controller']['addDiagram']>>,
  setDraft: (draft: AddDiagramDraft) => void,
): void {
  if (result.ok) setDraft({ title: '', mode: 'grid' });
}
function resetObject(
  result: Awaited<ReturnType<FeatureProps['controller']['addObject']>>,
  section: string,
  setDraft: (draft: AddObjectDraft) => void,
): void {
  if (result.ok) setDraft({ section, label: '', kind: 'module', reuseObject: null });
}

type FormSlots = Pick<DesignSlots, 'Field' | 'Button'>;
function DiagramForm({
  Field,
  Button,
  draft,
  busy,
  onDraft,
  onSubmit,
}: FormSlots & {
  draft: AddDiagramDraft;
  busy: boolean;
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
              value={draft.title}
              onChange={(event) => onDraft({ ...draft, title: event.target.value })}
            />
          )}
        />
        <div className={styles.actions}>
          <Button
            label="Cancel"
            type="button"
            onClick={() => onDraft({ title: '', mode: 'grid' })}
          />
          <Button
            label="Add diagram"
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
  targetSection,
  draft,
  busy,
  onDraft,
  onSubmit,
}: FormSlots & {
  sections: readonly Section[];
  objects: readonly DiagramObject[];
  targetSection: string;
  draft: AddObjectDraft;
  busy: boolean;
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
      targetSection={targetSection}
      draft={draft}
      busy={busy}
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
  targetSection,
  draft,
  busy,
  onDraft,
  onSubmit,
}: FormSlots & {
  sections: readonly Section[];
  objects: readonly DiagramObject[];
  targetSection: string;
  draft: AddObjectDraft;
  busy: boolean;
  onDraft: (draft: AddObjectDraft) => void;
  onSubmit: () => Promise<void>;
}): ReactElement {
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
              value={draft.reuseObject ?? ''}
              onChange={(event) => onDraft({ ...draft, reuseObject: event.target.value || null })}
            >
              <option value="">Create a new module</option>
              {objects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
        />
        {moduleField(Field, draft, onDraft)}
        <div className={styles.actions}>
          <Button
            label="Cancel"
            type="button"
            onClick={() =>
              onDraft({ section: targetSection, label: '', kind: 'module', reuseObject: null })
            }
          />
          <Button
            label={objectActionLabel(draft)}
            type="submit"
            variant="primary"
            disabled={objectDisabled(busy, draft)}
          />
        </div>
      </form>
    </section>
  );
}
function moduleField(
  Field: FormSlots['Field'],
  draft: AddObjectDraft,
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
function objectDisabled(busy: boolean, draft: AddObjectDraft): boolean {
  return busy || (draft.reuseObject === null && draft.label.trim().length === 0);
}
