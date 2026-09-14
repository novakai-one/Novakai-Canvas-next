import type { ComponentType, ReactElement } from 'react';
import type { WireFieldsProps } from '../../contract/wire-react.js';
import type { DesignSlots } from '../../contract/react-types.js';
import styles from './ObjectEditor.module.css';
/** Route settings affect one diagram appearance; semantic endpoints remain shared. */
export function createWireRouting({
  Field,
  Button,
}: Pick<DesignSlots, 'Field' | 'Button'>): ComponentType<WireFieldsProps> {
  /** Reset is an explicit draft action, applied through Authoring with all other wire edits. */
  function WireRouting({ value: { wire }, edit }: WireFieldsProps): ReactElement {
    return (
      <fieldset className={styles.block}>
        <legend>Route in this diagram</legend>
        <Field
          label="Routing style"
          control={(props) => (
            <select
              {...props}
              value={wire.route}
              onChange={(event) => {
                const value = routes.find((route) => route === event.target.value);
                if (value) edit({ kind: 'route', value });
              }}
            >
              {routes.map((route) => (
                <option key={route}>{route}</option>
              ))}
            </select>
          )}
        />
        {ends.map((side) => (
          <Field
            key={side}
            label={`${endLabels[side]} attachment`}
            control={(props) => (
              <select
                {...props}
                value={wire[side]}
                onChange={(event) => {
                  const value = sides.find((side) => side === event.target.value);
                  if (value) edit({ kind: 'side', side, value });
                }}
              >
                {sides.map((side) => (
                  <option key={side}>{side}</option>
                ))}
              </select>
            )}
          />
        ))}
        <p>
          {wire.manual
            ? 'Manual bends are retained. Drag a bend handle on the selected wire to adjust it.'
            : 'The router determines the path around diagram objects.'}
        </p>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={wire.locked}
            disabled={wire.manual === undefined}
            onChange={(event) => edit({ kind: 'locked', value: event.target.checked })}
          />
          Lock manual route
        </label>
        <Button
          label="Reset to automatic route"
          onClick={() => edit({ kind: 'automatic-route' })}
        />
      </fieldset>
    );
  }
  return WireRouting;
}
const routes = ['orthogonal', 'curve'] as const;
const ends = ['sourceSide', 'targetSide'] as const;
const endLabels = { sourceSide: 'Source', targetSide: 'Target' };
const sides = ['auto', 'top', 'right', 'bottom', 'left'] as const;
