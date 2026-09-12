import { formatFailure } from '../../contract/api.js';
import { useSyncExternalStore } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { PreferenceController, ThemeChoice } from '../../contract/records/preferences.js';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import styles from './InterfacePreferences.module.css';
/** Personal controls consume one preference session, so panel movement or collapse never resets them. */
export function createInterfacePreferences(
  { Button, Field }: Pick<DesignSlots, 'Button' | 'Field'>,
  preferences: PreferenceController,
  themes: readonly ThemeChoice[],
): ComponentType<FeatureProps> {
  /** Diagram themes are separate authored data; these controls affect this browser's interface only. */
  function InterfacePreferences(): ReactElement {
    const view = useSyncExternalStore(preferences.subscribe, preferences.getSnapshot);
    const value = view.preferences;
    return (
      <div className={styles.preferences}>
        <p>Personal to this browser</p>
        <fieldset>
          <legend>Interface theme</legend>
          <div className={styles.choices}>
            <Button
              label="System"
              selected={value.theme.mode === 'system'}
              onClick={() => preferences.change({ ...value, theme: { mode: 'system' } })}
            />
            {themes.map((theme) => (
              <Button
                key={theme.pin.id}
                label={theme.label}
                selected={value.theme.mode === 'pinned' && value.theme.theme.id === theme.pin.id}
                onClick={() =>
                  preferences.change({ ...value, theme: { mode: 'pinned', theme: theme.pin } })
                }
              />
            ))}
          </div>
        </fieldset>
        <Field
          label="Interface text size"
          help="12–20 px; diagram text is unchanged"
          control={(props) => (
            <input
              {...props}
              type="number"
              value={value.textSize}
              onChange={(event) =>
                preferences.change({ ...value, textSize: event.target.valueAsNumber })
              }
            />
          )}
        />
        <fieldset>
          <legend>Density</legend>
          <div className={styles.choices}>
            {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
              <Button
                key={density}
                label={density}
                selected={value.density === density}
                onClick={() => preferences.change({ ...value, density })}
              />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Motion</legend>
          <div className={styles.choices}>
            {(['system', 'reduced', 'full'] as const).map((motion) => (
              <Button
                key={motion}
                label={motion}
                selected={value.motion === motion}
                onClick={() => preferences.change({ ...value, motion })}
              />
            ))}
          </div>
        </fieldset>
        {view.problem && <p role="alert">{formatFailure(view.problem).join(' · ')}</p>}
        <Button label="Reset interface preferences" onClick={preferences.reset} />
      </div>
    );
  }
  return InterfacePreferences;
}
