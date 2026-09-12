import type { SourceSet, ThemeDelta } from '../../contract/records/source.js';
import { sourceHeader, themeHeader } from '../../contract/records/validation.js';
import type { TokenValue, TokenDefinition, TokenValues } from '../../contract/records/tokens.js';
import { parsed, member } from '../validation/input.js';
import { reject } from '../validation/outcomes.js';
import { flatten } from './flatten.js';
import { readLiteral } from './values.js';
/** Source reader returns detached supported-profile records; Design System owns correction. */
export function readSources(input: unknown): SourceSet {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  if (bytes.length > 4 * 1024 * 1024)
    return reject('limit', 'source', '≤4MiB', 'Token source too large');
  const source = parsed(sourceHeader, input, 'source');
  const definitions = [...flatten(source.definitions), ...flatten(source.semantics)];
  validateNames(definitions);
  validatePolicy(source.preferences, definitions);
  const themes = source.themes.map((theme) =>
    readTheme(theme, definitions, source.definitionVersion),
  );
  return {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    definitions,
    policy: source.preferences,
    themes,
  };
}
/** Tokens and emitted CSS names must be unique and count-bounded. */
function validateNames(definitions: readonly TokenDefinition[]): void {
  if (definitions.length > 1000) reject('limit', 'tokens', '≤1000 tokens', 'Too many tokens');
  const names = definitions.map((item) => item.id);
  if (new Set(names).size !== names.length)
    reject('invalid-input', 'tokens', 'unique names', 'Duplicate token identity');
}
/** Shipped deltas pin the definition release and cannot override derived expressions. */
function readTheme(
  input: unknown,
  definitions: readonly TokenDefinition[],
  baseVersion: string,
): ThemeDelta {
  const theme = parsed(themeHeader, input, 'theme');
  if (theme.baseVersion !== baseVersion)
    return reject('stale-pin', theme.id, baseVersion, 'Theme base version differs');
  const known = Object.fromEntries(definitions.map((item) => [item.id, item]));
  return { ...theme, overrides: readOverrides(theme.overrides, known) };
}
/** Raw theme values have only their known root token's literal type. */
export function readOverrides(
  input: Readonly<Record<string, unknown>>,
  known: Readonly<Record<string, TokenDefinition>>,
): TokenValues {
  return Object.fromEntries(
    Object.entries(input).map(([id, value]) => [id, readOverride(id, value, known)]),
  );
}
/** Derived recipes are closed to deltas; upstream controls remain their sole authority. */
function readOverride(
  id: string,
  value: unknown,
  known: Readonly<Record<string, TokenDefinition>>,
): TokenValue {
  const definition = member(known, id);
  if (definition.expression.op !== 'literal')
    return reject('invalid-input', id, 'base literal token', 'Cannot override a derived token');
  return readLiteral(definition.type, value, id);
}

/** Policy references must name actual tokens; duplicates cannot inflate the primary-coverage metric. */
function validatePolicy(
  policy: SourceSet['policy'],
  definitions: readonly TokenDefinition[],
): void {
  const known = Object.fromEntries(definitions.map((item) => [item.id, item]));
  policy.primary.forEach((id) => member(known, id));
  if (new Set(policy.primary).size !== 16)
    reject('invalid-input', 'primary', '16 unique primary controls', 'Duplicate primary control');
  if (!policy.roles.includes('neutral'))
    reject('invalid-input', 'roles', 'neutral role', 'Default role missing');
}
