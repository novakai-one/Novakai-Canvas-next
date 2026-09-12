import type {
  PortableTheme,
  PortableToken,
  FontPin,
  PresetPin,
} from '../../contract/records/theme.js';
import type { TokenValues } from '../../contract/records/tokens.js';
import type { SourceSet } from '../../contract/records/source.js';
import { portableTheme } from '../../contract/records/portable-schema.js';
import { parsed, member } from '../validation/input.js';
import { reject } from '../validation/outcomes.js';
import { requirePinnedFont } from './fonts.js';
/** Serialize the same canonical primitives into Templates' portable shape; Templates owns admission. */
export function toPortable(
  values: TokenValues,
  roles: readonly string[],
  fonts: readonly FontPin[],
  base: PresetPin | null,
): PortableTheme {
  return {
    tokens: Object.fromEntries(
      Object.entries(values).map(([id, value]) => [id, portableValue(id, value, values, fonts)]),
    ),
    roles,
    fonts: [...new Set(fonts.map((font) => font.digest))],
    base,
  };
}
/** The unit mapping is explicit; no scene camera scale enters token data. */
function portableValue(
  id: string,
  value: TokenValues[string],
  values: TokenValues,
  fonts: readonly FontPin[],
): PortableToken {
  if (value.type === 'fontFamily') {
    const font = requirePinnedFont(id, values, fonts);
    return { type: 'font', family: font.family, digest: font.digest };
  }
  return nonFontPortable(value);
}
/** Scalar/duration use the existing portable dimension envelope with distinct units. */
function nonFontPortable(value: TokenValues[string]): PortableToken {
  if (value.type === 'color') return value;
  if (typeof value.value !== 'number')
    return reject('type-mismatch', 'font', 'numeric token', 'Unexpected font');
  return { type: 'dimension', value: value.value, unit: portableUnit(value.type) };
}
/** Finite supported unit vocabulary stays local to this translation boundary. */
function portableUnit(type: TokenValues[string]['type']): 'px' | 'ms' | 'scalar' {
  if (type === 'duration') return 'ms';
  if (type === 'number') return 'scalar';
  return 'px';
}
/** Decode a complete portable payload; declared roles and exact font identities cannot be discarded. */
export function fromPortable(
  input: unknown,
  source: SourceSet,
  fonts: readonly FontPin[],
): { readonly theme: PortableTheme; readonly values: TokenValues } {
  const theme = parsed(portableTheme, input, 'theme');
  const values = Object.fromEntries(
    Object.entries(theme.tokens).map(([id, value]) => [id, unpackValue(id, value, fonts)]),
  );
  validateMembers(values, source, theme.roles);
  const actual = [
    ...new Set(
      Object.values(theme.tokens)
        .filter((token) => token.type === 'font')
        .map((token) => token.digest),
    ),
  ].sort();
  if (JSON.stringify(actual) !== JSON.stringify([...theme.fonts].sort()))
    return reject(
      'missing-font',
      'theme.fonts',
      'exact referenced font set',
      'Portable font manifest differs',
    );
  return { theme, values };
}
/** Unknown, missing or role-incomplete values fail before any scope can be emitted. */
function validateMembers(values: TokenValues, source: SourceSet, roles: readonly string[]): void {
  const known = Object.fromEntries(source.definitions.map((item) => [item.id, item]));
  Object.keys(values).forEach((id) => member(known, id));
  source.definitions.forEach((definition) => member(values, definition.id));
  if (!roles.includes('neutral'))
    reject('invalid-input', 'roles', 'neutral role', 'Default role missing');
  roles.forEach((role) =>
    ['fill', 'stroke', 'text'].forEach((part) => member(values, 'role.' + role + '.' + part)),
  );
}
/** Exact admitted font digest/family correspondence is verified before dropping its portable envelope. */
function unpackValue(
  id: string,
  value: PortableToken,
  fonts: readonly FontPin[],
): TokenValues[string] {
  if (value.type === 'font') return unpackFont(id, value, fonts);
  if (value.type === 'color') return value;
  return unpackNumber(value);
}
/** Portable numeric units map one-to-one to supported evaluator types. */
function unpackNumber(value: Extract<PortableToken, { type: 'dimension' }>): TokenValues[string] {
  return numberReaders[value.unit](value.value);
}
const numberReaders = {
  px: (value: number): TokenValues[string] => ({ type: 'dimension', value, unit: 'px' }),
  world: (value: number): TokenValues[string] => ({ type: 'dimension', value, unit: 'px' }),
  ms: (value: number): TokenValues[string] => ({ type: 'duration', value, unit: 'ms' }),
  scalar: (value: number): TokenValues[string] => ({ type: 'number', value }),
};
/** Fonts with the right family but wrong bytes are not interchangeable. */
function unpackFont(
  id: string,
  value: Extract<PortableToken, { type: 'font' }>,
  fonts: readonly FontPin[],
): TokenValues[string] {
  const found = fonts.some((font) => font.family === value.family && font.digest === value.digest);
  if (!found) return reject('missing-font', id, 'exact admitted font', 'Portable font unavailable');
  return { type: 'fontFamily', value: [value.family] };
}
