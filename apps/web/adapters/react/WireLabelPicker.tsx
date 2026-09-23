import { useState, type ReactElement } from 'react';
import { descendantId } from '@novakai/canvas-model';
import type { DesignSlots } from '../../contract/react-types.js';
import type { WireFieldsProps } from '../../contract/wire-react.js';
import type { DiagramObject } from '../../contract/records/owners.js';
import type { WireEdit } from '../../contract/records/wire-editor.js';
import type { ModuleFunction } from '../../contract/api.js';
import { moduleFunctions, newFunctionId, newFunctionProblem } from '../../contract/api.js';
import styles from './ObjectEditor.module.css';
const ADD = '__add__';
const CURRENT = '__current__';
type PickerProps = WireFieldsProps & {
  readonly Field: DesignSlots['Field'];
  readonly target: DiagramObject;
};
/**
 * A module wire names one of its target module's functions. Adding a new one changes the
 * module itself, so that path always shows a notice before anything is applied. Add mode is
 * draft state: Apply, Discard and Undo all end it.
 */
export function WireFunctionPicker(props: PickerProps): ReactElement {
  const { value, target, edit, Field } = props;
  const created = value.created ?? null;
  const adding = created !== null || (value.naming ?? null) !== null;
  const functions = moduleFunctions(target).filter((item) => item.id !== created?.id);
  const member = value.relationship.target.member;
  const choose = (choice: string): void => {
    if (choice === ADD) edit({ kind: 'function-name', name: '' });
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
            value={selectedValue(adding, member, functions)}
            onChange={(event) => choose(event.target.value)}
          >
            {!adding && (
              <CurrentOption
                functions={functions}
                member={member}
                label={value.relationship.label}
              />
            )}
            {functions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
            <option value={ADD}>{`+ Add new function to ${target.label}…`}</option>
          </select>
        )}
      />
      {adding ? <NewFunctionForm {...props} /> : <ReplacedHint {...props} functions={functions} />}
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
}: {
  readonly functions: readonly ModuleFunction[];
  readonly member: string | undefined;
  readonly label: string | undefined;
}): ReactElement | null {
  if (functions.some((item) => item.id === member)) return null;
  return (
    <option value={CURRENT} disabled>
      {label ? `“${label}” · not a function` : 'Choose a function'}
    </option>
  );
}
/** Picking a function moves the wire's target and replaces its label; say so before Apply. */
function ReplacedHint({
  value,
  collection,
  functions,
}: WireFieldsProps & { readonly functions: readonly ModuleFunction[] }): ReactElement | null {
  const saved = collection.relationships.find((item) => item.id === value.relationship.id);
  const picked = functions.find((item) => item.id === value.relationship.target.member);
  if (saved === undefined || picked === undefined) return null;
  if (saved.label === value.relationship.label) return null;
  return (
    <p className={styles.hint} role="status">
      {`Wire will attach to ${picked.label}; the current label “${saved.label ?? ''}” is replaced.`}
    </p>
  );
}
function NewFunctionForm({ value, target, edit, Field }: PickerProps): ReactElement {
  const created = value.created ?? null;
  const pending = created?.id ?? null;
  const [name, setName] = useState(created?.label ?? value.naming ?? '');
  const problem = newFunctionProblem(name, target, pending);
  const stage = (next: string): void => {
    setName(next);
    edit(stagedEdit(target, next, pending));
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
        error={problem ?? ''}
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
/** An unusable name stages nothing; the footer then explains why Apply is off. */
function stagedEdit(target: DiagramObject, name: string, pending: string | null): WireEdit {
  const id = descendantId.safeParse(newFunctionId(name, target, pending));
  if (!id.success || newFunctionProblem(name, target, pending) !== null)
    return { kind: 'function-name', name };
  return functionEdit(target, { id: id.data, label: name.trim() }, true);
}
function functionEdit(target: DiagramObject, picked: ModuleFunction, create: boolean): WireEdit {
  const member = descendantId.parse(picked.id);
  return { kind: 'function', object: target.id, member, label: picked.label, create };
}
