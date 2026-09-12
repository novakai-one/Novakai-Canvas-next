import type { ResolvedTokenSet } from '../../contract/records/resolved.js';
import type { StyleProjection, Paint, FontPin, PresetPin } from '../../contract/records/theme.js';
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
    fontSize: number('type.base'),
    lineHeight: number('lineHeight.body'),
    padding: number('space.3'),
    gap: number('space.2'),
    stroke: number('stroke.base'),
    radius: number('shape.radius'),
    widths: {
      small: number('diagram.widthSmall'),
      medium: number('diagram.widthMedium'),
      large: number('diagram.widthLarge'),
    },
    roles: Object.fromEntries(resolved.roles.map((role) => [role, rolePaint(role, values)])),
    surface: color('surface.base'),
    text: color('text.primary'),
    secondary: color('text.secondary'),
    border: color('border.default'),
  };
}
/** Presentation needs exact bytes and family, not the admission-evidence flag. */
function fontReference(font: FontPin): { readonly family: string; readonly digest: string } {
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
