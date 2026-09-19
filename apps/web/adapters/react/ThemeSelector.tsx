import { useSyncExternalStore } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { PreferenceController, ThemeChoice } from '../../contract/records/preferences.js';
import type { DesignSlots, ThemeSelectorProps } from '../../contract/react-types.js';
import styles from './ThemeSelector.module.css';

/** One visible selector owns interface-theme intent wherever the shell places it. */
export function createThemeSelector(
  { Button }: Pick<DesignSlots, 'Button'>,
  preferences: PreferenceController,
  themes: readonly ThemeChoice[],
): ComponentType<ThemeSelectorProps> {
  function ThemeSelector({ compact = false }: ThemeSelectorProps): ReactElement {
    const view = useSyncExternalStore(preferences.subscribe, preferences.getSnapshot);
    const value = view.preferences;
    return (
      <fieldset className={styles.selector} data-compact={compact}>
        <legend>Theme</legend>
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
    );
  }
  return ThemeSelector;
}
