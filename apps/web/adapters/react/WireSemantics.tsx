import type { ComponentType, ReactElement } from 'react';
import type { WireFieldsProps, WireFunctionPickerProps } from '../../contract/wire-react.js';
import type { DesignSlots } from '../../contract/react-types.js';
import { relationshipLabel } from '@novakai/canvas-model';
import { functionTarget } from '../../contract/api.js';
import styles from './ObjectEditor.module.css';
/** Shared wire meaning is explicit; no local routing control can change these fields. */
export function createWireSemantics({
  Field,
  FunctionPicker,
}: Pick<DesignSlots, 'Field'> & {
  readonly FunctionPicker: ComponentType<WireFunctionPickerProps>;
}): ComponentType<WireFieldsProps> {
  /** Controlled fields retain invalid intermediate labels for correction instead of dropping input. */
  function WireSemantics(props: WireFieldsProps): ReactElement {
    const {
      value: { relationship },
      edit,
    } = props;
    return (
      <fieldset className={styles.block}>
        <legend>Shared relationship</legend>
        <WireLabel {...props} Field={Field} FunctionPicker={FunctionPicker} />
        <Field
          label="Relationship kind"
          control={(props) => (
            <select
              {...props}
              value={relationship.kind}
              onChange={(event) => {
                const value = kinds.find((kind) => kind === event.target.value);
                if (value) edit({ kind: 'relationship-kind', value });
              }}
            >
              {kinds.map((kind) => (
                <option key={kind}>{kind}</option>
              ))}
            </select>
          )}
        />
        <Field
          label="Wire style"
          control={(props) => (
            <select
              {...props}
              value={relationship.style}
              onChange={(event) => {
                const value = stylesOfWire.find((style) => style === event.target.value);
                if (value) edit({ kind: 'style', value });
              }}
            >
              {stylesOfWire.map((style) => (
                <option key={style}>{style}</option>
              ))}
            </select>
          )}
        />
        {cardinalitySides.map((side) => (
          <Field
            key={side}
            label={`${sideLabels[side]} cardinality`}
            control={(props) => (
              <select
                {...props}
                value={relationship[side] ?? 'none'}
                onChange={(event) => {
                  const value = multiplicities.find((item) => item === event.target.value);
                  if (value) edit({ kind: 'cardinality', side, value });
                }}
              >
                {multiplicities.map((value) => (
                  <option key={value} value={value}>
                    {multiplicityLabels[value]}
                  </option>
                ))}
              </select>
            )}
          />
        ))}
        {relationship.kind === 'transition' && (
          <>
            <Field
              label="Transition guard"
              control={(props) => (
                <input
                  {...props}
                  value={relationship.guard ?? ''}
                  onChange={(event) => edit({ kind: 'guard', value: event.target.value })}
                />
              )}
            />
            <Field
              label="Transition effect"
              control={(props) => (
                <input
                  {...props}
                  value={relationship.effect ?? ''}
                  onChange={(event) => edit({ kind: 'effect', value: event.target.value })}
                />
              )}
            />
          </>
        )}
      </fieldset>
    );
  }
  return WireSemantics;
}
/** Module and interface wires pick one of the target's functions; other wires take free text. */
function WireLabel({
  FunctionPicker,
  ...props
}: WireFieldsProps &
  Pick<DesignSlots, 'Field'> & {
    readonly FunctionPicker: ComponentType<WireFunctionPickerProps>;
  }): ReactElement {
  const target = functionTarget(props.collection, props.value.relationship);
  if (target !== null) return <FunctionPicker {...props} target={target} />;
  return <WireLabelText {...props} />;
}
function WireLabelText({
  value: { relationship },
  edit,
  Field,
}: WireFieldsProps & Pick<DesignSlots, 'Field'>): ReactElement {
  const label = relationshipLabel(relationship);
  return (
    <Field
      label="Wire label"
      required
      error={relationship.label?.trim() === '' ? 'The wire label cannot be empty.' : ''}
      control={(controlProps) => (
        <input
          {...controlProps}
          value={label}
          onChange={(event) => edit({ kind: 'label', value: event.target.value })}
        />
      )}
    />
  );
}
const kinds = [
  'flow',
  'association',
  'imports',
  'calls',
  'implements',
  'contains',
  'parent',
  'reference',
  'transition',
] as const;
const stylesOfWire = ['solid', 'dashed'] as const;
const cardinalitySides = ['from', 'to'] as const;
const sideLabels = { from: 'Source', to: 'Target' };
const multiplicities = ['none', '0..1', '1', '0..many', '1..many'] as const;
const multiplicityLabels = {
  none: 'Not specified',
  '0..1': 'Zero or one',
  '1': 'Exactly one',
  '0..many': 'Zero or many',
  '1..many': 'One or many',
};
