import { fileURLToPath } from 'node:url';
import { assert, expect } from 'vitest';
import {
  composeDesignSystem,
  createTokenFileBindings,
  createScopeInstaller,
} from '@novakai/canvas-design-system';
import type { ScopeSnapshot, Environment } from '@novakai/canvas-design-system';
import { createPreferenceController } from '../adapters/sessions/preference-session.js';
import type { DraftRetention } from '../contract/ports/workspace.js';
/** Host case6 extension: real token resolution, checked retention and a deterministic target; visible theme quality remains a browser check. */
export async function verifyPreferenceRecovery(retention: DraftRetention): Promise<void> {
  const files = await createTokenFileBindings(
    fileURLToPath(new URL('../../../capability/design-system/', import.meta.url)),
  );
  assert(files.ok);
  const sources = await files.value.source.read();
  assert(sources.ok);
  let scope: ScopeSnapshot = { generation: 0, variables: {} };
  const installer = createScopeInstaller({
    read: () => ({ ok: true, value: scope }),
    replace: (expected, variables) => {
      expect(expected).toBe(scope.generation);
      scope = { generation: expected + 1, variables };
      return { ok: true, value: scope };
    },
  });
  assert(installer.ok);
  const environment: Environment = {
    scheme: 'light',
    pointer: 'fine',
    reducedMotion: false,
    forcedColors: false,
  };
  const bindings = {
    tokens: composeDesignSystem(),
    sources: sources.value,
    installer: installer.value,
    retention,
    environment,
  };
  const created = createPreferenceController(bindings);
  assert(created.ok);
  const preferences = created.value;
  const initial = preferences.getSnapshot().preferences;
  preferences.change({ ...initial, density: 'spacious', textSize: 18, motion: 'reduced' });
  expect(scope.variables['--nv-space-2']).toBe('12px');
  const admitted = scope.variables;
  preferences.change({ ...initial, textSize: 200 });
  expect(scope.variables).toEqual(admitted);
  expect(preferences.getSnapshot().problem).not.toBeNull();
  expect(preferences.getSnapshot().preferences.textSize).toBe(18);
  expect(preferences.dispose()).toEqual({ ok: true, value: { restored: true } });
  expect(scope.variables).toEqual({});
  const reopened = createPreferenceController(bindings);
  assert(reopened.ok);
  expect(reopened.value.getSnapshot().preferences).toMatchObject({
    textSize: 18,
    density: 'spacious',
    motion: 'reduced',
  });
  const paper = scope.variables;
  reopened.value.environment({ ...environment, scheme: 'dark' });
  expect(scope.variables['--nv-surface-base']).not.toBe(paper['--nv-surface-base']);
  reopened.value.dispose();
  retention.write('ui-preferences', { schemaVersion: 999, textSize: 400 });
  const invalid = createPreferenceController(bindings);
  assert(invalid.ok);
  expect(invalid.value.getSnapshot().preferences.textSize).toBe(14);
  expect(invalid.value.getSnapshot().problem).not.toBeNull();
  expect(retention.read('ui-preferences')).toEqual({
    ok: true,
    value: { schemaVersion: 999, textSize: 400 },
  });
  invalid.value.reset();
  expect(invalid.value.getSnapshot().problem).toBeNull();
  expect(retention.read('source-draft.demo')).toEqual({
    ok: true,
    value: { source: 'unapplied source', base: 7 },
  });
  invalid.value.dispose();
}
