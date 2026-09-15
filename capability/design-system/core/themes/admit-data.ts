import { tokenId } from '../../contract/brands.js';
import type { SourceSet } from '../../contract/records/source.js';
import type { Identity } from '../../contract/ports/identity.js';
import type { PortableTheme, FontPin, PresetPin } from '../../contract/records/theme.js';
import { fontPin, presetPin } from '../../contract/records/theme.js';
import { uiThemePin } from '../../contract/records/preferences.js';
import type { TokenValues } from '../../contract/records/tokens.js';
import { record, keys, text, parsed, member } from '../validation/input.js';
import { reject } from '../validation/outcomes.js';
import { canonical } from '../validation/canonical.js';
import { namedTheme, themePin } from './resolve.js';
import { changedDefinitions } from './overrides.js';
import { readOverrides } from '../tokens/read.js';
import { resolveDefinitions } from '../tokens/resolve.js';
import { validateBounds } from '../tokens/bounds.js';
import { validateContrast } from '../tokens/contrast.js';
import { validateFonts, readFonts } from './fonts.js';
import { toPortable, fromPortable } from './portable.js';
import { rootsOnly } from './diagram.js';
/** Resolve submitted theme data only; Templates owns immutable admission and hash allocation. */
export function resolveThemeData(
  source: SourceSet,
  input: unknown,
  identity: Identity,
): PortableTheme {
  const data = record(input, 'theme-request');
  keys(data, ['base', 'overrides', 'fonts', 'chrome'], 'theme-request');
  const selectedFonts = record(data.fonts, 'fonts');
  keys(selectedFonts, ['body', 'mono', 'strong'], 'fonts');
  const body = parsed(fontPin, selectedFonts.body, 'font.body');
  const mono = parsed(fontPin, selectedFonts.mono, 'font.mono');
  const strong = parsed(fontPin, selectedFonts.strong, 'font.strong');
  const fonts = uniqueFonts([body, mono, strong]);
  const base = baseValues(source, data.base, fonts, identity);
  const known = Object.fromEntries(source.definitions.map((item) => [item.id, item]));
  const overrides = readOverrides(record(data.overrides, 'overrides'), known);
  const fontValues: TokenValues = {
    [tokenId.parse('font.body')]: { type: 'fontFamily', value: [body.family] },
    [tokenId.parse('font.mono')]: { type: 'fontFamily', value: [mono.family] },
    [tokenId.parse('font.strong')]: { type: 'fontFamily', value: [strong.family] },
  };
  const resolved = resolveDefinitions(
    changedDefinitions(source, { ...base.values, ...overrides, ...fontValues }),
  );
  validateBounds(source, resolved.values, 'diagram');
  validateFonts(source, resolved.values, fonts, 'diagram');
  validateContrast(source, resolved.values, base.roles);
  return toPortable(resolved.values, base.roles, fonts, base.pin, data.chrome);
}
/** Repeated identical admission evidence is one pin; conflicting same-family digests remain detectable. */
function uniqueFonts(fonts: readonly FontPin[]): readonly FontPin[] {
  return [...new Map(fonts.map((font) => [font.digest, font])).values()];
}
/** A base can be an exact shipped UI selection or an exact already admitted preset. */
function baseValues(
  source: SourceSet,
  input: unknown,
  fonts: readonly FontPin[],
  identity: Identity,
): {
  readonly values: TokenValues;
  readonly roles: readonly string[];
  readonly pin: PresetPin | null;
} {
  const data = record(input, 'base');
  const kind = text(data.kind, 'base.kind');
  if (kind === 'ui') return uiBase(source, data, identity);
  if (kind === 'preset') return presetBase(source, data, fonts);
  return reject('invalid-input', 'base.kind', 'ui or preset', 'Unknown base kind');
}
/** UI-to-diagram admission explicitly chooses diagram typography and later replaces OS aliases with pins. */
function uiBase(
  source: SourceSet,
  data: Readonly<Record<string, unknown>>,
  identity: Identity,
): { readonly values: TokenValues; readonly roles: readonly string[]; readonly pin: null } {
  keys(data, ['kind', 'pin'], 'base');
  const pin = parsed(uiThemePin, data.pin, 'base.pin');
  const theme = namedTheme(source, pin.id);
  if (canonical(themePin(source, theme, identity)) !== canonical(pin))
    return reject('stale-pin', pin.id, 'exact UI theme', 'Base pin differs');
  return {
    values: {
      ...theme.overrides,
      [tokenId.parse('type.base')]: member(
        resolveDefinitions(source.definitions).values,
        'type.diagramDefault',
      ),
    },
    roles: source.policy.roles,
    pin: null,
  };
}
/** Complete existing presets preserve their exact base provenance; no lookup fallback occurs. */
function presetBase(
  source: SourceSet,
  data: Readonly<Record<string, unknown>>,
  fonts: readonly FontPin[],
): { readonly values: TokenValues; readonly roles: readonly string[]; readonly pin: PresetPin } {
  keys(data, ['kind', 'pin', 'payload', 'fonts'], 'base');
  const pin = parsed(presetPin, data.pin, 'base.pin');
  const baseFonts = admittedBaseFonts(data, fonts);
  const portable = fromPortable(data.payload, source, baseFonts);
  return { values: rootsOnly(source, portable.values), roles: portable.theme.roles, pin };
}

/** Base decoding and replacement selection use distinct admitted byte sets; legacy callers may reuse unchanged pins. */
function admittedBaseFonts(
  data: Readonly<Record<string, unknown>>,
  selected: readonly FontPin[],
): readonly FontPin[] {
  if (data.fonts === undefined) return selected;
  return readFonts(data.fonts);
}
