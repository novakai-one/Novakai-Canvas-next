import { formatFailure } from '../../contract/api.js';
import { useSyncExternalStore } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { PreferenceController } from '../../contract/records/preferences.js';
import type { FeatureProps, DesignSlots, ThemeSelectorProps } from '../../contract/react-types.js';
import styles from './InterfacePreferences.module.css';
/** Personal controls consume one preference session, so panel movement or collapse never resets them. */
export function createInterfacePreferences(
  { Button, Field }: Pick<DesignSlots, 'Button' | 'Field'>,
  preferences: PreferenceController,
  ThemeSelector: ComponentType<ThemeSelectorProps>,
): ComponentType<FeatureProps> {
  /** Diagram themes are separate authored data; these controls affect this browser's interface only. */
  function InterfacePreferences(): ReactElement {
    const view = useSyncExternalStore(preferences.subscribe, preferences.getSnapshot);
    const value = view.preferences;
    return (
      <div className={styles.preferences}>
        <p>Personal to this browser</p>
        <ThemeSelector />
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
