import type { TokenValues } from '../../contract/records/tokens.js';
import type { SourceSet } from '../../contract/records/source.js';
import { chromeName, type ChromeName, tokenId, type TokenId } from '../../contract/brands.js';
import { parsed, member } from '../validation/input.js';
import { resolveDefinitions } from '../tokens/resolve.js';
import { changedDefinitions } from './overrides.js';
/** Extension membership is a versioned token namespace, not a theme-name switch. */
function extension(id: TokenId): boolean {
  return /^(elevation\.|chrome\.|role\.[^.]+\.(header|secondary)$)/.test(id);
}
/** Legacy serialization retains exactly its original token vocabulary and digest. */
export function chromeTokens(values: TokenValues, chrome: ChromeName | undefined): TokenValues {
  if (chrome !== undefined) return values;
  return Object.fromEntries(Object.entries(values).filter(([id]) => !extension(tokenId.parse(id))));
}
/** Explicit selectors are validated once; absence never inserts a default into a hashed payload. */
export function chromeField(chrome: unknown): { readonly chrome?: ChromeName } {
  if (chrome === undefined) return {};
  return { chrome: parsed(chromeName, chrome, 'chrome') };
}
/** Hydrate only the new extension namespace; missing legacy tokens still fail normal completeness validation. */
export function completeChromeTokens(
  supplied: TokenValues,
  source: SourceSet,
  chrome: ChromeName | undefined,
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
    ...Object.fromEntries(Object.entries(defaults).filter(([id]) => extension(tokenId.parse(id)))),
    ...supplied,
  };
}
