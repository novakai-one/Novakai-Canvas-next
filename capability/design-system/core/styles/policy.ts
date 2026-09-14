import type { StyleDeclaration } from '../../contract/records/artifacts.js';
/** Shared structural literals carry no palette/spacing choice and are excluded from the visual denominator. */
const structural = new Set([
  '0',
  '100%',
  '100dvh',
  'auto',
  'none',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'normal',
  'currentColor',
  'currentcolor',
  'transparent',
  'underline',
  'line-through',
  'fit-content',
  'min-content',
  'max-content',
  'solid',
  'dashed',
  'dotted',
  'double',
  'inset',
  'outset',
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'all',
  'color',
  'background',
  'background-color',
  'border-color',
  'box-shadow',
  'opacity',
  'transform',
  'text-decoration',
  'Canvas',
  'CanvasText',
  'ButtonFace',
  'ButtonText',
  'Highlight',
  'HighlightText',
  'GrayText',
  'calc',
  'min',
  'max',
  'clamp',
  '+',
  '-',
  '*',
]);
const eligible =
  /^(?:color$|fill$|stroke(?:-|$)|background(?:-|$)|font(?:-|$)|line-height$|letter-spacing$|word-spacing$|text-(?:shadow|decoration|indent)|margin(?:-|$)|padding(?:-|$)|gap$|row-gap$|column-gap$|(?:min-|max-)?(?:width|height|inline-size|block-size)$|border(?:-|$)|outline(?:-|$)|box-shadow$|transition(?:-|$)|animation(?:-|$))/;
/** Classify authored visual declarations consistently across native, shared and Canvas vendor overrides. */
export function isEligible(declaration: StyleDeclaration): boolean {
  if (!eligible.test(declaration.property)) return false;
  return (
    meaningfulLiterals(declaration.value).length > 0 || variables(declaration.value).length > 0
  );
}
/** Extract CSS variable names; fallback values remain visible to the literal check below. */
export function variables(value: string): readonly string[] {
  return [...value.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)].map((match) => match[1] ?? '');
}
/** Browser safe-area insets and full dynamic viewport are structural. Authored fractions and fallback literals still require tokens. */
export function meaningfulLiterals(value: string): readonly string[] {
  const rest = value
    .replace(/env\(\s*safe-area-inset-(top|right|bottom|left)\s*\)/g, ' ')
    .replace(/var\(\s*--[a-zA-Z0-9-]+\s*\)/g, ' ')
    .replace(/[(),/]/g, ' ');
  return rest.split(/\s+/).filter((part) => part.length > 0 && !structural.has(part));
}
/** Layer and !important violations apply even to otherwise structural declarations. */
export function policyViolations(declaration: StyleDeclaration): readonly string[] {
  const layerValid = [
    'reset',
    'vendor',
    'tokens',
    'themes',
    'preferences',
    'components',
    'utilities',
  ].includes(declaration.layer);
  const problems = [
    layerValid ? '' : 'unlayered-or-unknown-layer',
    declaration.important ? 'important-not-permitted' : '',
  ];
  return problems.filter(Boolean);
}
