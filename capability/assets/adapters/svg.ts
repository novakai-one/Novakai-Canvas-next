import { SaxesParser } from 'saxes';
import type { SaxesTagPlain } from 'saxes';
import { fail } from '../contract/errors.js';
import type { Result } from '../contract/errors.js';
import { limits } from '../contract/records/media.js';
import type { NormalizedMedia } from '../contract/records/media.js';
import type { MediaHandler } from '../contract/ports/media.js';
const namespace = 'http://www.w3.org/2000/svg';
const elements = new Set(
  'svg g defs path rect circle ellipse line polyline polygon text tspan title desc marker clipPath linearGradient radialGradient stop'.split(
    ' ',
  ),
);
const attributes = new Set(
  'id xmlns viewBox width height x y x1 y1 x2 y2 cx cy r rx ry d points transform fill fill-rule stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-dashoffset stroke-miterlimit opacity fill-opacity stroke-opacity clip-path clip-rule marker-start marker-mid marker-end markerWidth markerHeight markerUnits refX refY orient font-family font-size font-weight text-anchor dominant-baseline letter-spacing gradientUnits gradientTransform offset stop-color stop-opacity'.split(
    ' ',
  ),
);
const definitionElements = new Set([
  'defs',
  'marker',
  'clipPath',
  'linearGradient',
  'radialGradient',
]);
interface SvgState {
  readonly tags: SaxesTagPlain[];
  readonly stack: SaxesTagPlain[];
  readonly parts: string[];
  readonly ids: Set<string>;
  readonly references: string[];
}
/** Strict sanitizer rejects unsupported syntax instead of attempting to repair executable SVG. */
function rejectUnsafe(): never {
  throw new Error('Unsupported or unsafe SVG');
}
/** XML content is always escaped when emitting canonical markup, including entity-decoded attribute values. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
/** Exact attribute allowlist excludes event handlers, CSS, links and base-URI tricks. */
function checkAttribute(name: string, value: string): void {
  if (!attributes.has(name) || value.length > 65536) rejectUnsafe();
  if (name === 'xmlns') {
    checkNamespace(value);
    return;
  }
  checkAttributeValue(value);
}
/** Namespace changes are not normalized into apparent safety; unsupported namespace is rejected. */
function checkNamespace(value: string): void {
  if (value !== namespace) rejectUnsafe();
}
/** Only a complete local url(#id) may carry URL syntax; no external resources can be requested. */
function checkAttributeValue(value: string): void {
  if (/(?:https?:|file:|data:|javascript:|\/\/)/i.test(value)) rejectUnsafe();
  if (value.includes('\\')) rejectUnsafe();
  checkLocalUrl(value);
}
/** Local URL grammar is checked independently from external-scheme rejection. */
function checkLocalUrl(value: string): void {
  if (!/url\s*\(/i.test(value)) return;
  if (!/^url\(#[A-Za-z_][A-Za-z0-9_.:-]*\)$/.test(value)) rejectUnsafe();
}
/** IDs are unique stable local targets; malformed identities never enter browser URL parsing. */
function recordId(state: SvgState, id: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(id) || state.ids.has(id)) rejectUnsafe();
  state.ids.add(id);
}
/** Definition-to-definition references are excluded, preventing recursive clip/marker expansion. */
function recordReference(state: SvgState, value: string): void {
  if (!value.startsWith('url(#')) return;
  if (state.stack.some((tag) => definitionElements.has(tag.name))) rejectUnsafe();
  state.references.push(value.slice(5, -1));
}
/** Record checked identity/reference facts separately from serialization. */
function inspectAttribute(state: SvgState, name: string, value: string): void {
  checkAttribute(name, value);
  if (name === 'id') recordId(state, value);
  recordReference(state, value);
}
/** Root and resource bounds are checked on streaming events before accepting further elements. */
function checkElement(state: SvgState, tag: SaxesTagPlain): void {
  if (!elements.has(tag.name)) rejectUnsafe();
  checkRoot(state, tag);
  checkElementBounds(state);
}
/** The one XML document root must be an SVG element. */
function checkRoot(state: SvgState, tag: SaxesTagPlain): void {
  if (state.tags.length !== 0) return;
  if (tag.name !== 'svg') rejectUnsafe();
}
/** Bounding both element count and nesting prevents oversized or deeply recursive input trees. */
function checkElementBounds(state: SvgState): void {
  if (state.tags.length >= limits.svgElements) rejectUnsafe();
  if (state.stack.length >= limits.svgDepth) rejectUnsafe();
}
/** Normalize root viewport while retaining checked geometry and typography attributes. */
function rootAttributes(tag: SaxesTagPlain): Readonly<Record<string, string>> {
  const [width, height] = dimensions(tag);
  return { ...tag.attributes, xmlns: namespace, width: String(width), height: String(height) };
}
/** Attribute ordering is canonical, so an already-admitted SVG normalizes to identical bytes on restore. */
function serializeTag(tag: SaxesTagPlain, root: boolean): string {
  const values = root ? rootAttributes(tag) : tag.attributes;
  const serialized = Object.entries(values)
    .sort(([a], [b]) => a.localeCompare(b, 'en'))
    .map(([name, value]) => `${name}="${escapeXml(value)}"`)
    .join(' ');
  const suffix = serialized ? ' ' + serialized : '';
  return `<${tag.name}${suffix}>`;
}
/** Stream event state is local to one normalization, never shared between submissions. */
function openTag(state: SvgState, tag: SaxesTagPlain): void {
  checkElement(state, tag);
  state.stack.push(tag);
  Object.entries(tag.attributes).forEach(([name, value]) => inspectAttribute(state, name, value));
  state.parts.push(serializeTag(tag, state.tags.length === 0));
  state.tags.push(tag);
}
/** Every close event corresponds to the strict XML parser's checked stack. */
function closeTag(state: SvgState): void {
  const tag = state.stack.pop();
  if (!tag) rejectUnsafe();
  state.parts.push(`</${tag.name}>`);
}
/** Positive finite root dimensions accept optional px units or a numeric viewBox fallback. */
function dimension(value: string | undefined, fallback: number | undefined): number {
  const parsed = value === undefined ? fallback : Number(value.replace(/px$/, ''));
  if (typeof parsed !== 'number') rejectUnsafe();
  return boundedDimension(parsed);
}
/** Explicit dimension ceiling is independent of total serialized SVG byte size. */
function boundedDimension(value: number): number {
  if (!Number.isFinite(value) || value <= 0) rejectUnsafe();
  if (value > limits.dimension) rejectUnsafe();
  return value;
}
/** SVG without an explicit positive viewport is ambiguous for measurement and therefore rejected. */
function dimensions(tag: SaxesTagPlain): readonly [number, number] {
  const viewBox =
    tag.attributes.viewBox
      ?.trim()
      .split(/[\s,]+/)
      .map(Number) ?? [];
  return [
    dimension(tag.attributes.width, viewBox[2]),
    dimension(tag.attributes.height, viewBox[3]),
  ];
}
/** Bind strict XML events; declarations may describe UTF-8, but no processing instructions or DTD are allowed. */
function parseSvg(source: string, state: SvgState): void {
  const parser = new SaxesParser({ xmlns: false });
  parser.on('doctype', rejectUnsafe);
  parser.on('processinginstruction', rejectUnsafe);
  parser.on('error', rejectUnsafe);
  parser.on('opentag', (tag) => openTag(state, tag));
  parser.on('closetag', () => closeTag(state));
  parser.on('text', (text) => state.parts.push(escapeXml(text)));
  parser.on('cdata', (text) => state.parts.push(escapeXml(text)));
  parser.write(source).close();
}
/** Resolve every local reference after the whole document is known, then emit canonical safe SVG. */
function finishSvg(state: SvgState): NormalizedMedia {
  if (state.references.some((id) => !state.ids.has(id))) rejectUnsafe();
  const root = state.tags[0];
  if (!root) rejectUnsafe();
  const [width, height] = dimensions(root);
  const canonical = boundedMarkup(state.parts);
  return {
    base64: Buffer.from(canonical, 'utf8').toString('base64'),
    mediaType: 'image/svg+xml',
    kind: 'icon',
    width,
    height,
    fontFamily: null,
  };
}
/** Canonical escaping may expand input; enforce the same byte bound required by later restore validation. */
function boundedMarkup(parts: readonly string[]): string {
  const canonical = parts.join('').trim();
  if (Buffer.byteLength(canonical, 'utf8') > limits.svgBytes) rejectUnsafe();
  return canonical;
}
/** Input decoded before parsing is bounded; fatal UTF-8 decoding prevents silent character replacement. */
function normalizeSvg(encoded: string): NormalizedMedia {
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.byteLength > limits.svgBytes) rejectUnsafe();
  const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const state: SvgState = { tags: [], stack: [], parts: [], ids: new Set(), references: [] };
  parseSvg(source, state);
  return finishSvg(state);
}
/** All XML-policy/native failures are typed; caller corrects source and no rejected SVG is staged. */
async function protectSvg(encoded: string): Promise<Result<NormalizedMedia>> {
  try {
    return { ok: true, value: normalizeSvg(encoded) };
  } catch {
    return fail('unsafe-media', 'svg', 'SVG violates the supported safe vector subset');
  }
}
/** SVG remains vector content; it is not flattened into a diagram background raster. */
export function createSvg(): MediaHandler {
  return { mediaTypes: ['image/svg+xml'], normalize: protectSvg };
}
