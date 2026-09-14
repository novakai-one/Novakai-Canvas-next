import type { ComponentType, ReactElement } from 'react';
import type { WireFieldsProps } from '../../contract/wire-react.js';
import type { DesignSlots } from '../../contract/react-types.js';
import { endpointChoices, endpointKey } from '../../contract/api.js';
import styles from './ObjectEditor.module.css';
/** Endpoint forms bind canonical identities; the application computes all attachment coordinates. */
export function createWireEndpoints({
  Field,
}: Pick<DesignSlots, 'Field'>): ComponentType<WireFieldsProps> {
  /** Both sides expose their full identity, including typed members, without guessing valid pairings. */
  function WireEndpoints({ value, collection, edit }: WireFieldsProps): ReactElement {
    const options = endpointChoices(collection);
    return (
      <fieldset className={styles.block}>
        <legend>Shared endpoints</legend>
        {sides.map((side) => (
          <Field
            key={side}
            label={`${labels[side]} endpoint`}
            control={(props) => (
              <select
                {...props}
                value={endpointKey(value.relationship[side])}
                onChange={(event) => {
                  const selected = options.find((option) => option.value === event.target.value);
                  if (selected) edit({ kind: 'endpoint', side, value: selected.endpoint });
                }}
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          />
        ))}
      </fieldset>
    );
  }
  return WireEndpoints;
}
const sides = ['source', 'target'] as const;
const labels = { source: 'Source', target: 'Target' };
