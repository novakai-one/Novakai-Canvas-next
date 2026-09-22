import type { ComponentType, ReactElement } from 'react';
import type { WireFieldsProps } from '../../contract/wire-react.js';
import type { DesignSlots } from '../../contract/react-types.js';
import { relationshipLabel } from '@novakai/canvas-model';
import styles from './ObjectEditor.module.css';
/** Shared wire meaning is explicit; no local routing control can change these fields. */
export function createWireSemantics({
  Field,
}: Pick<DesignSlots, 'Field'>): ComponentType<WireFieldsProps> {
  /** Controlled fields retain invalid intermediate labels for correction instead of dropping input. */
  function WireSemantics({ value: { relationship }, edit }: WireFieldsProps): ReactElement {
    return (
      <fieldset className={styles.block}>
        <legend>Shared relationship</legend>
        <Field
          label="Wire label"
          control={(props) => (
            <input
              {...props}
              value={relationshipLabel(relationship)}
              onChange={(event) => edit({ kind: 'label', value: event.target.value })}
            />
          )}
        />
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
