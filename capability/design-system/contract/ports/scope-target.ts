import type { Result } from '../errors.js';
/** Atomic target snapshot includes only owned token properties; unrelated scene geometry remains untouched. */
export interface ScopeSnapshot {
  readonly generation: number;
  readonly variables: Readonly<Record<string, string>>;
}
export interface ScopeTarget {
  read(): Result<ScopeSnapshot>;
  replace(
    expectedGeneration: number,
    variables: Readonly<Record<string, string>>,
  ): Result<ScopeSnapshot>;
}
export interface ScopeLease {
  /** Replace this lease atomically, keeping its original cleanup baseline. A stale lease cannot overwrite another owner. */
  replace(resolved: unknown): Result<ScopeLease>;
  cleanup(): Result<{ readonly restored: boolean }>;
}
export interface ScopeInstaller {
  install(resolved: unknown): Result<ScopeLease>;
}
