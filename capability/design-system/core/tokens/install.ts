import type {
  ScopeTarget,
  ScopeInstaller,
  ScopeLease,
  ScopeSnapshot,
} from '../../contract/ports/scope-target.js';
import type { Result } from '../../contract/errors.js';
import { protect, accepted } from '../validation/outcomes.js';
import { validateResolved } from './scope.js';
/** Bind one scope target. Host owns lifecycle/retry; no installer-local state can overwrite newer generations. */
export function createInstaller(target: ScopeTarget): ScopeInstaller {
  return { install: (input) => protect(() => install(target, input)) };
}
/** Target replacement is atomic after all validation; cleanup captures the precise replaced snapshot. */
function install(target: ScopeTarget, input: unknown): ScopeLease {
  const scope = validateResolved(input);
  const before = accepted(target.read());
  const installed = accepted(target.replace(before.generation, scope.css));
  return { cleanup: () => cleanup(target, before, installed.generation) };
}
/** Stale cleanup is intentionally a no-op, including a newer installation of identical token values. */
function cleanup(
  target: ScopeTarget,
  before: ScopeSnapshot,
  installedGeneration: number,
): Result<{ readonly restored: boolean }> {
  return protect(() => {
    const current = accepted(target.read());
    if (current.generation !== installedGeneration) return { restored: false };
    accepted(target.replace(current.generation, before.variables));
    return { restored: true };
  });
}
