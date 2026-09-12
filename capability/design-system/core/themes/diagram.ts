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
import { member } from '../validation/input.js';
import { accepted, reject } from '../validation/outcomes.js';
import { canonical } from '../validation/canonical.js';
import { resolveDefinitions } from '../tokens/resolve.js';
import { validateBounds } from '../tokens/bounds.js';
import { validateContrast } from '../tokens/contrast.js';
import { emitVariables } from '../tokens/emit.js';
import { numeric, colorText } from '../tokens/values.js';
import { fromPortable } from './portable.js';
import { changedDefinitions } from './overrides.js';
import { validateFonts, requirePinnedFont } from './fonts.js';
/** Pinned diagram data ignores UI preferences; export changes motion only. Host owns admission provenance. */
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
/** Re-evaluate semantic aliases from complete admitted root values, detecting forged derived values. */
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
    'motion.duration': { type: 'duration', value: 0, unit: 'ms' },
    'camera.duration': { type: 'duration', value: 0, unit: 'ms' },
  };
}
/** Project exact resolved data to Presentation; host supplies no palette or measurement defaults. */
export function projectDiagram(resolved: ResolvedTokenSet): StyleProjection {
  if (resolved.scope === 'ui')
    return reject(
      'invalid-input',
      'scope',
      'diagram or export',
      'UI scope cannot measure diagrams',
    );
  const values = resolved.values;
  const number = (id: string): number => numeric(member(values, id), id);
  const color = (id: string): string => colorText(member(values, id), id);
  return {
    digest: resolved.digest,
    bodyFont: fontReference(requirePinnedFont('font.body', values, resolved.fonts)),
    monoFont: fontReference(requirePinnedFont('font.mono', values, resolved.fonts)),
    typography: typography(resolved),
    contentSizing: contentSizing(values),
    padding: number('space.3'),
    gap: number('space.2'),
    stroke: number('stroke.base'),
    radius: number('shape.radius'),
    roles: Object.fromEntries(resolved.roles.map((role) => [role, rolePaint(role, values)])),
    surface: color('surface.base'),
    text: color('text.primary'),
    secondary: color('text.secondary'),
    border: color('border.default'),
  };
}
/** Presentation needs exact bytes and family, not the admission-evidence flag. */
function fontReference(font: FontPin): TextMetric['font'] {
  return { family: font.family, digest: font.digest };
}
/** The frozen role-token mapping works for built-in and declared additional roles equally. */
function rolePaint(role: string, values: TokenValues): Paint {
  const prefix = 'role.' + role;
  return {
    fill: colorText(member(values, prefix + '.fill'), prefix),
    stroke: colorText(member(values, prefix + '.stroke'), prefix),
    text: colorText(member(values, prefix + '.text'), prefix),
  };
}

/** Resolve one absolute text role; resolver boundary translates missing tokens into typed failure. */
function metric(resolved: ResolvedTokenSet, font: string, sizeToken: string): TextMetric {
  const size = numeric(member(resolved.values, sizeToken), sizeToken);
  const ratio = numeric(member(resolved.values, 'lineHeight.body'), 'lineHeight.body');
  return {
    font: fontReference(requirePinnedFont(font, resolved.values, resolved.fonts)),
    size,
    lineHeight: size * ratio,
  };
}
/** Each semantic role maps to the existing type hierarchy with no new font authority. */
function typography(resolved: ResolvedTokenSet): DiagramTypography {
  return {
    sectionHeading: metric(resolved, 'font.body', 'font.large'),
    nodeHeading: metric(resolved, 'font.body', 'font.title'),
    body: metric(resolved, 'font.body', 'type.base'),
    mono: metric(resolved, 'font.mono', 'type.base'),
    annotation: metric(resolved, 'font.body', 'font.caption'),
  };
}
/** Width bands describe interior content; token validation owns finite positive values. */
function band(values: TokenValues, preferred: string, maximum: string): SizeBand {
  return {
    preferred: numeric(member(values, preferred), preferred),
    maximum: numeric(member(values, maximum), maximum),
  };
}
/** Shared content policies are derived from semantic tokens for all renderers. */
function contentSizing(values: TokenValues): ContentSizing {
  const number = (id: string): number => numeric(member(values, id), id);
  return {
    widths: {
      small: band(values, 'diagram.widthSmall', 'diagram.widthMedium'),
      medium: band(values, 'diagram.widthMedium', 'diagram.widthLarge'),
      large: band(values, 'diagram.widthLarge', 'diagram.widthExtraLarge'),
    },
    rowMinimum: number('diagram.rowMin'),
    iconBox: {
      small: number('diagram.iconSmall'),
      medium: number('diagram.iconMedium'),
      large: number('diagram.iconLarge'),
    },
  };
}
