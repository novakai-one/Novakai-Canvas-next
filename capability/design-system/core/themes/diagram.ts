import {
  hexColor,
  roleName,
  type HexColor,
  type ChromeName,
  type TokenId,
  tokenId,
} from '../../contract/brands.js';
import type { ResolvedTokenSet } from '../../contract/records/resolved.js';
import type {
  StyleProjection,
  Paint,
  FontPin,
  PresetPin,
  TextMetric,
  DiagramTypography,
  ContentSizing,
  SizeBand,
} from '../../contract/records/theme.js';
import type { SourceSet } from '../../contract/records/source.js';
import type { Identity } from '../../contract/ports/identity.js';
import type { TokenValues } from '../../contract/records/tokens.js';
import { member, parsed } from '../validation/input.js';
import { accepted, reject } from '../validation/outcomes.js';
import { canonical } from '../validation/canonical.js';
import { resolveDefinitions } from '../tokens/resolve.js';
import { validateBounds } from '../tokens/bounds.js';
import { validateContrast } from '../tokens/contrast.js';
import { emitVariables } from '../tokens/emit.js';
import { numeric, colorText } from '../tokens/values.js';
import { chromeField } from './chrome.js';
import { fromPortable } from './portable.js';
import { changedDefinitions } from './overrides.js';
import { validateFonts, requirePinnedFont } from './fonts.js';
/** Resolve pinned diagram data; the public facade returns typed failure and the host retains its prior scope. */
export function resolveDiagram(
  source: SourceSet,
  input: unknown,
  fonts: readonly FontPin[],
  pin: PresetPin,
  scope: 'diagram' | 'export',
  identity: Identity,
): ResolvedTokenSet {
  const portable = fromPortable(input, source, fonts);
  const base = rootsOnly(source, portable.values);
  const canonicalValues = resolveDefinitions(changedDefinitions(source, base));
  if (canonical(canonicalValues.values) !== canonical(portable.values))
    return reject(
      'invalid-input',
      'theme.tokens',
      'derived values matching roots',
      'Portable derived values differ',
    );
  const overrides = scope === 'export' ? { ...base, ...noMotion() } : base;
  const resolved = resolveDefinitions(changedDefinitions(source, overrides));
  validateBounds(source, resolved.values, scope);
  validateFonts(source, resolved.values, fonts, scope);
  const contrast = validateContrast(source, resolved.values, portable.theme.roles);
  const inputDigest = accepted(
    identity.hash(
      canonical({ source: source.definitionVersion, theme: portable.theme, pin, scope }),
    ),
  );
  const digest = accepted(identity.hash(canonical({ scope, values: resolved.values, fonts, pin })));
  return {
    ...chromeField(portable.theme.chrome),
    definitionVersion: source.definitionVersion,
    inputDigest,
    digest,
    scope,
    values: resolved.values,
    css: emitVariables(resolved.values),
    dependencies: resolved.dependencies,
    primary: source.policy.primary,
    contrast,
    fonts,
    roles: portable.theme.roles,
    provenance: { ui: null, diagram: pin },
    forcedColors: false,
  };
}
/** Re-evaluate admitted roots; the public resolver owns rejection and the host retains its prior scope. */
export function rootsOnly(source: SourceSet, values: TokenValues): TokenValues {
  return Object.fromEntries(
    source.definitions
      .filter((item) => item.expression.op === 'literal')
      .map((item) => [item.id, member(values, item.id)]),
  );
}
/** Export has no transition timeline; layout dimensions and color remain canonical. */
function noMotion(): TokenValues {
  return {
    [tokenId.parse('motion.duration')]: { type: 'duration', value: 0, unit: 'ms' },
    [tokenId.parse('camera.duration')]: { type: 'duration', value: 0, unit: 'ms' },
  };
}
/** Project exact resolved data; the public facade returns typed failure and the host retains its prior scope. */
export function projectDiagram(resolved: ResolvedTokenSet): StyleProjection {
  if (resolved.scope === 'ui')
    return reject(
      'invalid-input',
      'scope',
      'diagram or export',
      'UI scope cannot measure diagrams',
    );
  const values = resolved.values;
  const color = (id: TokenId): HexColor => tokenColor(values, id);
  return {
    ...chromeProjection(resolved),
    digest: resolved.digest,
    bodyFont: fontReference(requirePinnedFont('font.body', values, resolved.fonts)),
    monoFont: fontReference(requirePinnedFont('font.mono', values, resolved.fonts)),
    strongFont: fontReference(requirePinnedFont('font.strong', values, resolved.fonts)),
    typography: typography(resolved),
    contentSizing: contentSizing(values),
    connection: {
      ...wireOverride(resolved),
      paint: {
        fill: color(tokenId.parse('surface.base')),
        stroke: runtimeStroke(resolved),
        text: color(tokenId.parse('text.primary')),
      },
      width: tokenNumber(values, tokenId.parse('diagram.edgeStroke')),
      dash: [
        tokenNumber(values, tokenId.parse('space.2')),
        tokenNumber(values, tokenId.parse('space.1')),
      ],
    },
    padding: tokenNumber(values, tokenId.parse('space.3')),
    gap: tokenNumber(values, tokenId.parse('space.2')),
    stroke: tokenNumber(values, tokenId.parse('stroke.base')),
    radius: tokenNumber(values, tokenId.parse('shape.radius')),
    roles: Object.fromEntries(
      resolved.roles.map((role) => [
        parsed(roleName, role, 'roles'),
        rolePaint(role, values, resolved.chrome),
      ]),
    ),
    surface: color(tokenId.parse('surface.base')),
    text: color(tokenId.parse('text.primary')),
    secondary: color(tokenId.parse('text.secondary')),
    border: color(tokenId.parse('border.default')),
  };
}
/** Presentation needs exact bytes and family, not the admission-evidence flag. */
function fontReference(font: FontPin): TextMetric['font'] {
  return { family: font.family, digest: font.digest };
}
/** The frozen role-token mapping works for built-in and declared additional roles equally. */
function rolePaint(
  role: ResolvedTokenSet['roles'][number],
  values: TokenValues,
  chrome: ChromeName | undefined,
): Paint {
  const prefix = tokenId.parse('role.' + role);
  return {
    ...secondaryPaint(prefix, values, chrome),
    fill: tokenColor(values, tokenId.parse(prefix + '.fill')),
    stroke: tokenColor(values, tokenId.parse(prefix + '.stroke')),
    text: tokenColor(values, tokenId.parse(prefix + '.text')),
  };
}

/** Resolve one absolute text role; resolver boundary translates missing tokens into typed failure. */
function metric(resolved: ResolvedTokenSet, font: TokenId, sizeToken: TokenId): TextMetric {
  const size = metricNumber(tokenNumber(resolved.values, sizeToken), sizeToken);
  const ratio = tokenNumber(resolved.values, tokenId.parse('lineHeight.body'));
  return {
    font: fontReference(requirePinnedFont(font, resolved.values, resolved.fonts)),
    size,
    lineHeight: metricNumber(size * ratio, sizeToken + '.lineHeight'),
  };
}
/** Heading roles carry the admitted strong face; body-family roles keep reading weight. */
function typography(resolved: ResolvedTokenSet): DiagramTypography {
  return {
    sectionHeading: metric(resolved, tokenId.parse('font.strong'), tokenId.parse('font.large')),
    nodeHeading: metric(resolved, tokenId.parse('font.strong'), tokenId.parse('font.title')),
    body: metric(resolved, tokenId.parse('font.body'), tokenId.parse('type.base')),
    mono: metric(resolved, tokenId.parse('font.mono'), tokenId.parse('type.base')),
    annotation: metric(resolved, tokenId.parse('font.body'), tokenId.parse('font.caption')),
    caption: metric(resolved, tokenId.parse('font.body'), tokenId.parse('font.caption')),
  };
}
/** Width bands describe interior content; token validation owns finite positive values. */
function band(values: TokenValues, preferred: TokenId, maximum: TokenId): SizeBand {
  return {
    preferred: tokenNumber(values, preferred),
    maximum: tokenNumber(values, maximum),
  };
}
/** Shared content policies are derived from semantic tokens for all renderers. */
function contentSizing(values: TokenValues): ContentSizing {
  return {
    widths: {
      small: band(
        values,
        tokenId.parse('diagram.widthSmall'),
        tokenId.parse('diagram.widthMedium'),
      ),
      medium: band(
        values,
        tokenId.parse('diagram.widthMedium'),
        tokenId.parse('diagram.widthLarge'),
      ),
      large: band(
        values,
        tokenId.parse('diagram.widthLarge'),
        tokenId.parse('diagram.widthExtraLarge'),
      ),
    },
    figureBox: {
      small: tokenNumber(values, tokenId.parse('diagram.figureSmall')),
      medium: tokenNumber(values, tokenId.parse('diagram.figureMedium')),
      large: tokenNumber(values, tokenId.parse('diagram.figureLarge')),
    },
    rowMinimum: tokenNumber(values, tokenId.parse('diagram.rowMin')),
    iconBox: {
      small: tokenNumber(values, tokenId.parse('diagram.iconSmall')),
      medium: tokenNumber(values, tokenId.parse('diagram.iconMedium')),
      large: tokenNumber(values, tokenId.parse('diagram.iconLarge')),
    },
  };
}
/** Numeric token extraction has one local policy for projection consumers. */
function tokenNumber(values: TokenValues, id: TokenId): number {
  return numeric(member(values, id), id);
}
/** Presentation-bound metrics must satisfy its finite positive public schema. */
function metricNumber(value: number, path: string): number {
  if (!Number.isFinite(value) || value <= 0 || value > 10000)
    return reject(
      'invalid-input',
      path,
      'finite positive metric no greater than10000',
      'Derived diagram metric is outside Presentation bounds',
    );
  return value;
}

/** Legacy projections stay structurally identical; chrome values only enter explicitly selected presets. */
function chromeProjection(resolved: ResolvedTokenSet): Partial<StyleProjection> {
  if (resolved.chrome === undefined) return {};
  const values = resolved.values;
  return {
    chrome: resolved.chrome,
    headers: Object.fromEntries(
      resolved.roles.map((role) => [
        parsed(roleName, role, 'roles'),
        tokenColor(values, tokenId.parse('role.' + role + '.header')),
      ]),
    ),
    elevation: {
      offsetX: tokenNumber(values, tokenId.parse('elevation.offsetX')),
      offsetY: tokenNumber(values, tokenId.parse('elevation.offsetY')),
      blur: tokenNumber(values, tokenId.parse('elevation.blur')),
      extent: tokenNumber(values, tokenId.parse('elevation.extent')),
      color: tokenColor(values, tokenId.parse('elevation.color')),
    },
    chromeMetrics: {
      tabWidth: tokenNumber(values, tokenId.parse('chrome.tabWidth')),
      tabHeight: tokenNumber(values, tokenId.parse('chrome.tabHeight')),
      accentWidth: tokenNumber(values, tokenId.parse('chrome.accentWidth')),
    },
  };
}

/** Existing presets retain their original wire paint; chrome presets select runtime ink through tokens. */
function runtimeStroke(resolved: ResolvedTokenSet): Paint['stroke'] {
  const id = tokenId.parse(resolved.chrome === undefined ? 'text.secondary' : 'chrome.wire');
  return tokenColor(resolved.values, id);
}
/** Type-only and external interactions retain their own muted ink without changing marker or routing policy. */
function wireOverride(resolved: ResolvedTokenSet): Partial<StyleProjection['connection']> {
  if (resolved.chrome === undefined) return {};
  const color = (id: TokenId): HexColor => tokenColor(resolved.values, id);
  return {
    dashedPaint: {
      fill: color(tokenId.parse('surface.base')),
      stroke: color(tokenId.parse('chrome.externalWire')),
      text: color(tokenId.parse('text.primary')),
    },
  };
}

/** Secondary role ink stays absent from legacy paint records and readable on each role's own fill. */
function secondaryPaint(
  prefix: TokenId,
  values: TokenValues,
  chrome: ChromeName | undefined,
): Partial<Paint> {
  if (chrome === undefined) return {};
  return {
    secondary: tokenColor(values, tokenId.parse(prefix + '.secondary')),
  };
}

/** Mint canonical ink at token projection; token emission already lowercases component bytes. */
function tokenColor(values: TokenValues, id: TokenId): HexColor {
  return parsed(hexColor, colorText(member(values, id), id), id);
}
