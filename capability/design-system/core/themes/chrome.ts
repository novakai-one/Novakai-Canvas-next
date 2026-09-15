import type { TokenValues } from '../../contract/records/tokens.js';
import type { SourceSet } from '../../contract/records/source.js';
import { text, member } from '../validation/input.js';
import { resolveDefinitions } from '../tokens/resolve.js';
import { changedDefinitions } from './overrides.js';
/** Extension membership is a versioned token namespace, not a theme-name switch. */
function extension(id: string): boolean {
  return /^(elevation\.|chrome\.|role\.[^.]+\.(header|secondary)$)/.test(id);
}
/** Legacy serialization retains exactly its original token vocabulary and digest. */
export function chromeTokens(values: TokenValues, chrome: unknown): TokenValues {
  if (chrome !== undefined) return values;
  return Object.fromEntries(Object.entries(values).filter(([id]) => !extension(id)));
}
/** Explicit selectors are validated once; absence never inserts a default into a hashed payload. */
export function chromeField(chrome: unknown): { readonly chrome?: string } {
  if (chrome === undefined) return {};
  return { chrome: text(chrome, 'chrome') };
}
/** Hydrate only the new extension namespace; missing legacy tokens still fail normal completeness validation. */
export function completeChromeTokens(
  supplied: TokenValues,
  source: SourceSet,
  chrome: string | undefined,
): TokenValues {
  if (chrome !== undefined) return supplied;
  const roots = Object.fromEntries(
    source.definitions
      .filter((item) => item.expression.op === 'literal')
      .filter((item) => supplied[item.id] !== undefined)
      .map((item) => [item.id, member(supplied, item.id)]),
  );
  const defaults = resolveDefinitions(changedDefinitions(source, roots)).values;
  return {
    ...Object.fromEntries(Object.entries(defaults).filter(([id]) => extension(id))),
    ...supplied,
  };
}
