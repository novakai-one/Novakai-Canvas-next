import type { ComponentType, ReactElement } from 'react';
import type { ContentEditorProps } from '../../contract/inspector-react.js';
import type { DesignSlots } from '../../contract/react-types.js';
import type { ContentBlock } from '../../contract/records/owners.js';
import styles from './ObjectEditor.module.css';
/** Shared row frame delegates every field to typed draft commands; stable IDs retain React input identity. */
export function createContentEditor({
  Button,
  Field,
  Engineering,
}: Pick<DesignSlots, 'Button' | 'Field'> & {
  readonly Engineering: ComponentType<ContentEditorProps>;
}): ComponentType<ContentEditorProps> {
  /** Each supported block exposes the properties relevant to its notation, with no raw JSON editing. */
  function ContentEditor({ item, collection, edit }: ContentEditorProps): ReactElement {
    return (
      <fieldset className={styles.block}>
        <legend>
          {item.kind} · {item.id}
        </legend>
        {textFields(item).map((field) => (
          <Field
            key={field.name}
            label={field.label}
            control={(props) => (
              <input
                {...props}
                value={field.value}
                onChange={(event) =>
                  edit({
                    kind: 'content-text',
                    id: item.id,
                    field: field.name,
                    value: event.target.value,
                  })
                }
              />
            )}
          />
        ))}
        {item.kind === 'field' && (
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={item.nullable}
              onChange={(event) =>
                edit({ kind: 'nullable', id: item.id, value: event.target.checked })
              }
            />
            Allow null values
          </label>
        )}
        <Engineering item={item} collection={collection} edit={edit} />
        <Button
          label={`Remove ${item.kind} ${item.id}`}
          onClick={() => edit({ kind: 'remove-content', id: item.id })}
        />
      </fieldset>
    );
  }
  return ContentEditor;
}
interface TextField {
  readonly name: 'label' | 'type' | 'text' | 'returns';
  readonly label: string;
  readonly value: string;
}
/** Structural narrowing exposes available text fields without casts or duplicating Model validation. */
function textFields(item: ContentBlock): readonly TextField[] {
  return [...labelField(item), ...typeField(item), ...bodyField(item), ...returnField(item)];
}
/** Labels belong to named engineering members and links. */
function labelField(item: ContentBlock): readonly TextField[] {
  if (!('label' in item)) return [];
  return [{ name: 'label', label: 'Name', value: item.label }];
}
/** Engineering types are explicit strings owned by the semantic record. */
function typeField(item: ContentBlock): readonly TextField[] {
  if (!('type' in item)) return [];
  if (linkedField(item)) return [];
  return [
    {
      name: 'type',
      label: 'Type',
      value: typeValue(item.type),
    },
  ];
}

function typeValue(type: Extract<ContentBlock, { readonly type: unknown }>['type']): string {
  if (typeof type === 'string') return type;
  return `@${type.id}`;
}

function linkedField(item: ContentBlock & { readonly type?: unknown }): boolean {
  if (item.kind !== 'field') return false;
  return typeof item.type !== 'string';
}
/** Text and code retain their authored content exactly. */
function bodyField(item: ContentBlock): readonly TextField[] {
  if (!('text' in item)) return [];
  return [{ name: 'text', label: 'Text', value: item.text }];
}
/** Return types are distinct from member types in callable signatures. */
function returnField(item: ContentBlock): readonly TextField[] {
  if (item.kind !== 'signature') return [];
  return [{ name: 'returns', label: 'Returns', value: typeValue(item.returns) }];
}
