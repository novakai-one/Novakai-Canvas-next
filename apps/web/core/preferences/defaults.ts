import type { PreferenceView } from '../../contract/records/preferences.js';
/** Safe session fallback is explicit; invalid retained preferences are preserved until the user changes or resets them. */
export function defaultPreferences(): PreferenceView['preferences'] {
  return {
    schemaVersion: 1,
    theme: { mode: 'system' },
    textSize: 14,
    density: 'comfortable',
    motion: 'system',
  };
}
