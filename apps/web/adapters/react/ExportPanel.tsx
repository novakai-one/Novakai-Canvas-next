import { useState, type ComponentType, type ReactElement } from 'react';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import styles from './ExportPanel.module.css';

/** Export keeps format and scope choices local while the controller owns the authenticated bytes transport. */
export function createExportPanel({
  Field,
  Button,
}: Pick<DesignSlots, 'Field' | 'Button'>): ComponentType<FeatureProps> {
  function ExportPanel({ controller, view }: FeatureProps): ReactElement {
    const [format, setFormat] = useState<'dsl' | 'svg' | 'png' | 'markdown'>('dsl');
    const [scope, setScope] = useState('all');
    const [busy, setBusy] = useState(false);
    const [problem, setProblem] = useState<string | null>(null);
    const collection = view.active?.document.collection;
    const sections = view.active?.document.scene.sections ?? [];
    if (collection === undefined)
      return (
        <section className={styles.panel} aria-labelledby="export-title">
          <h2 id="export-title">Export</h2>
          <p className={styles.hint}>Open a collection to export it.</p>
        </section>
      );
    const whole = format === 'dsl' || scope === 'all';
    return (
      <section className={styles.panel} aria-labelledby="export-title">
        <h2 id="export-title">Export</h2>
        <p className={styles.hint}>Download the exact revision currently on canvas.</p>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            setBusy(true);
            setProblem(null);
            void controller
              .exportArtifact({
                identity: { collectionId: collection.id, revision: collection.revision },
                format,
                scope: whole ? { kind: 'all' } : { kind: 'section', id: scope },
              })
              .then((result) => {
                if (!result.ok) {
                  setProblem(result.error.message);
                  return;
                }
                const copy = new Uint8Array(result.value.bytes);
                const blob = new Blob([copy.buffer], { type: result.value.mediaType });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = result.value.filename ?? `${collection.id}.${format}`;
                anchor.click();
                URL.revokeObjectURL(url);
              })
              .finally(() => setBusy(false));
          }}
        >
          <Field
            label="Format"
            control={(field) => (
              <select
                {...field}
                value={format}
                onChange={(event) => setFormat(event.target.value as typeof format)}
              >
                <option value="dsl">Canonical DSL</option>
                <option value="markdown">Markdown</option>
                <option value="svg">SVG</option>
                <option value="png">PNG</option>
              </select>
            )}
          />
          <Field
            label="Scope"
            {...(format === 'dsl' ? { help: 'Canonical DSL includes the whole collection.' } : {})}
            control={(field) => (
              <select
                {...field}
                value={whole ? 'all' : scope}
                onChange={(event) => setScope(event.target.value)}
                disabled={format === 'dsl'}
              >
                <option value="all">Whole collection</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.id}
                  </option>
                ))}
              </select>
            )}
          />
          {problem !== null && (
            <p className={styles.error} role="alert">
              {problem}
            </p>
          )}
          <Button
            label={`Export ${format.toUpperCase()}`}
            type="submit"
            variant="primary"
            pending={busy}
            disabled={busy}
          />
        </form>
      </section>
    );
  }
  return ExportPanel;
}
