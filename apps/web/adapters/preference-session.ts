import type { Environment, UiPreferences, ResolvedTokenSet } from '@novakai/canvas-design-system';
import type {
  PreferenceBindings,
  PreferenceController,
  PreferenceView,
  PreferenceInstallation,
} from '../contract/records/preferences.js';
import type { Result, Diagnostic } from '../contract/errors.js';
import { defaultPreferences } from '../contract/api.js';
/** Start with a valid scope, then restore checked preferences. Rejection preserves stored evidence and a usable default session. */
export function createPreferenceController(
  bindings: PreferenceBindings,
): Result<PreferenceController> {
  const preferences = defaultPreferences();
  const resolved = resolve(bindings, preferences, bindings.environment);
  if (!resolved.ok) return resolved;
  const installed = bindings.installer.install(resolved.value);
  if (!installed.ok) return { ok: false, error: diagnostic(installed.error) };
  return { ok: true, value: session(bindings, { lease: installed.value, preferences }) };
}
/** This store owns preference lifetime, never token policy. Failed writes remain visible; callers can retry or reset. */
function session(
  bindings: PreferenceBindings,
  installation: PreferenceInstallation,
): PreferenceController {
  let state: PreferenceView = { preferences: installation.preferences, problem: null };
  let lease = installation.lease;
  let environment = bindings.environment;
  const listeners = new Set<() => void>();
  /** Publish one immutable view so React never reconstructs snapshots while reading. */
  function publish(next: PreferenceView): void {
    state = next;
    listeners.forEach((listener) => listener());
  }
  /** A preference failure retains the last valid installed scope and identifies the recovery action. */
  function report(problem: Diagnostic): void {
    publish({ ...state, problem });
  }
  /** Read the owner's schema before resolving; no host casts or duplicated theme bounds are used. */
  function install(input: unknown): boolean {
    const checked = bindings.tokens.readPreferences(input);
    if (!checked.ok) {
      report(diagnostic(checked.error));
      return false;
    }
    return installChecked(checked.value);
  }
  /** Scope replacement is atomic and preserves its original unmount baseline. */
  function installChecked(preferences: UiPreferences): boolean {
    const resolved = resolve(bindings, preferences, environment);
    if (!resolved.ok) {
      report(resolved.error);
      return false;
    }
    return installResolved(preferences, resolved.value);
  }
  /** A stale DOM lease is a visible failure; it cannot overwrite a newer theme owner. */
  function installResolved(preferences: UiPreferences, resolved: ResolvedTokenSet): boolean {
    const replaced = lease.replace(resolved);
    if (!replaced.ok) {
      report(diagnostic(replaced.error));
      return false;
    }
    lease = replaced.value;
    publish({ preferences, problem: null });
    return true;
  }
  /** Save only admitted preferences. A storage failure leaves the selected theme usable for this session. */
  function change(preferences: UiPreferences): void {
    if (!install(preferences)) return;
    const saved = bindings.retention.write('ui-preferences', preferences);
    if (!saved.ok) report(diagnostic(saved.error));
  }
  /** Restore never rewrites corrupt or stale records; Reset is an explicit user action. */
  function restore(): void {
    const stored = bindings.retention.read('ui-preferences');
    if (!stored.ok) {
      report(diagnostic(stored.error));
      return;
    }
    if (stored.value !== null) install(stored.value);
  }
  restore();
  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    change,
    reset: () => change(defaultPreferences()),
    environment: (next) => {
      environment = next;
      install(state.preferences);
    },
    dispose: () => {
      listeners.clear();
      return lease.cleanup();
    },
  };
}
/** Owner validation controls system/pinned selection, contrast and all emitted CSS variables. */
function resolve(
  bindings: PreferenceBindings,
  preferences: UiPreferences,
  environment: Environment,
): Result<ResolvedTokenSet> {
  const result = bindings.tokens.resolve({
    scope: 'ui',
    sources: bindings.sources,
    preferences,
    environment,
  });
  if (!result.ok) return { ok: false, error: diagnostic(result.error) };
  return result;
}
/** Recovery is local to preferences; changing a theme cannot require resending a diagram edit. */
function diagnostic(error: { readonly code: string; readonly message: string }): Diagnostic {
  return {
    code: error.code,
    message: error.message,
    recovery:
      'Choose an available theme or reset interface preferences. Stored diagram content is unchanged.',
  };
}
