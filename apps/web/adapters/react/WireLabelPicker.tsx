import { useState, type ReactElement } from 'react';
import { descendantId } from '@novakai/canvas-model';
import type { DesignSlots } from '../../contract/react-types.js';
import type { WireFieldsProps } from '../../contract/wire-react.js';
import type { DiagramObject } from '../../contract/records/owners.js';
import type { ModuleFunction } from '../../contract/api.js';
import { existingFunction, moduleFunctions, newFunctionId } from '../../contract/api.js';
import styles from './ObjectEditor.module.css';
const ADD = '__add__';
const CURRENT = '__current__';
type PickerProps = WireFieldsProps & {
  readonly Field: DesignSlots['Field'];
  readonly target: DiagramObject;
};
/**
 * A module wire names one of its target module's functions. Adding a new one changes the
 * module itself, so that path always shows a notice before anything is applied.
 */
export function WireFunctionPicker(props: PickerProps): ReactElement {
  const { value, target, edit, Field } = props;
  const created = value.created ?? null;
  // Add mode belongs to the target the wire had when it opened; an applied function ends it.
  const member = value.relationship.target.member ?? '';
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const adding = created !== null || openedAt === member;
  const functions = moduleFunctions(target).filter((item) => item.id !== created?.id);
  const choose = (choice: string): void => {
    setOpenedAt(choice === ADD ? member : null);
    const picked = functions.find((item) => item.id === choice);
    if (picked !== undefined) edit(functionEdit(target, picked, false));
  };
  return (
    <>
      <Field
        label="Wire label"
        help={`Functions of ${target.label}`}
        control={(controlProps) => (
          <select
            {...controlProps}
            value={selectedValue(adding, value.relationship.target.member, functions)}
            onChange={(event) => choose(event.target.value)}
          >
            <CurrentOption
              functions={functions}
              member={value.relationship.target.member}
              label={value.relationship.label}
              target={target}
            />
            {functions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
            <option value={ADD}>{`+ Add new function to ${target.label}…`}</option>
          </select>
        )}
      />
      {adding && <NewFunctionForm {...props} functions={functions} />}
    </>
  );
}
function selectedValue(
  adding: boolean,
  member: string | undefined,
  functions: readonly ModuleFunction[],
): string {
  if (adding) return ADD;
  return functions.some((item) => item.id === member) ? (member ?? CURRENT) : CURRENT;
}
/** The wire's present label stays visible when it does not yet name one of the module's functions. */
function CurrentOption({
  functions,
  member,
  label,
  target,
}: {
  readonly functions: readonly ModuleFunction[];
  readonly member: string | undefined;
  readonly label: string | undefined;
  readonly target: DiagramObject;
}): ReactElement | null {
  if (functions.some((item) => item.id === member)) return null;
  const text = label ? `“${label}” — not a function of ${target.label}` : 'Choose a function';
  return (
    <option value={CURRENT} disabled>
      {text}
    </option>
  );
}
function NewFunctionForm({
  value,
  target,
  edit,
  Field,
  functions,
}: PickerProps & { readonly functions: readonly ModuleFunction[] }): ReactElement {
  const created = value.created ?? null;
  const [name, setName] = useState(created?.label ?? '');
  const duplicate = existingFunction(functions, name);
  const stage = (next: string): void => {
    setName(next);
    edit(stagedEdit(target, next, created?.id ?? null, functions));
  };
  return (
    <div className={styles.notice} role="status">
      <strong>{`Adds a new function to module ${target.label}`}</strong>
      <p>
        {`This adds a new function '${name.trim() || '…'}' to module ${target.label}. The module's definition changes.`}
      </p>
      <Field
        label="New function name"
        required
        error={nameProblem(name, duplicate, target) ?? ''}
        control={(controlProps) => (
          <input
            {...controlProps}
            value={name}
            placeholder="e.g. submitIssue"
            onChange={(event) => stage(event.target.value)}
          />
        )}
      />
      <p>Apply wire adds the function and points this wire at it. Undo reverts both.</p>
    </div>
  );
}
function nameProblem(
  name: string,
  duplicate: ModuleFunction | null,
  target: DiagramObject,
): string | undefined {
  if (name.trim() === '') return 'Type a name for the new function.';
  if (duplicate === null) return undefined;
  return `${target.label} already has '${duplicate.label}'. Pick it from the list instead.`;
}
/** A blank or duplicate name leaves the label blank, which keeps Apply disabled. */
function stagedEdit(
  target: DiagramObject,
  name: string,
  pending: string | null,
  functions: readonly ModuleFunction[],
): Parameters<WireFieldsProps['edit']>[0] {
  const id = descendantId.safeParse(newFunctionId(name, target, pending));
  if (!id.success || existingFunction(functions, name) !== null)
    return { kind: 'label', value: '' };
  return functionEdit(target, { id: id.data, label: name.trim() }, true);
}
function functionEdit(
  target: DiagramObject,
  picked: ModuleFunction,
  create: boolean,
): Parameters<WireFieldsProps['edit']>[0] {
  const member = descendantId.parse(picked.id);
  return { kind: 'function', object: target.id, member, label: picked.label, create };
}
