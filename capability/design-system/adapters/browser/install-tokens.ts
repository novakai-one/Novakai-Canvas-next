import type { ScopeTarget, ScopeSnapshot } from '../../contract/ports/scope-target.js';
import type { Result } from '../../contract/errors.js';
/** Explicit element target; no ambient document or global theme store. Host owns lifecycle/retry. */
export function createDomScopeTarget(element: HTMLElement): ScopeTarget {
  return {
    read: () => read(element),
    replace: (expected, variables) => replace(element, expected, variables),
  };
}
/** Read owned variables and generation from the same style attribute snapshot. */
function read(element: HTMLElement): Result<ScopeSnapshot> {
  try {
    return { ok: true, value: snapshot(element.style) };
  } catch {
    return failure('Could not read token scope');
  }
}
/** All mutation occurs on a detached style declaration before one atomic attribute replacement. */
function replace(
  element: HTMLElement,
  expected: number,
  variables: Readonly<Record<string, string>>,
): Result<ScopeSnapshot> {
  try {
    const current = snapshot(element.style);
    if (current.generation !== expected) return failure('Token scope changed before replacement');
    const detached = element.ownerDocument.createElement('span').style;
    detached.cssText = element.style.cssText;
    Object.keys(current.variables).forEach((name) => detached.removeProperty(name));
    Object.entries(variables).forEach(([name, value]) => detached.setProperty(name, value));
    detached.setProperty('--nv-scope-generation', String(expected + 1));
    element.setAttribute('style', detached.cssText);
    return { ok: true, value: snapshot(element.style) };
  } catch {
    return failure('Could not replace token scope');
  }
}
/** Numeric generation belongs to installer lifecycle, not a visual design token. */
function snapshot(style: CSSStyleDeclaration): ScopeSnapshot {
  const generation = Number(style.getPropertyValue('--nv-scope-generation') || '0');
  const names = Array.from({ length: style.length }, (_, index) => style.item(index)).filter(
    isOwned,
  );
  return {
    generation,
    variables: Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)])),
  };
}
/** Preserve measured geometry and unrelated host styles; generation is separately tracked. */
function isOwned(name: string): boolean {
  return name.startsWith('--nv-') && name !== '--nv-scope-generation';
}
/** Typed target failure leaves host responsible for retaining/reinstalling its latest accepted scope. */
function failure(message: string): Result<never> {
  return {
    ok: false,
    error: {
      code: 'provider-failure',
      path: 'scope',
      targets: [],
      expected: 'current writable DOM scope',
      message,
      recovery: 'Host retains the current scope; re-read target before retrying.',
    },
  };
}
