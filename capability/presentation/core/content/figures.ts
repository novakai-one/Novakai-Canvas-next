import type { ContentBlock } from '../../contract/records/input.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import type { ResolvedStyle } from '../../contract/records/style.js';

type FigureBlock = Extract<ContentBlock, { kind: 'figure' }>;
type FigureForm = FigureBlock['form'];

/** Fixed drawing canvas; the emitted media primitive scales it like any admitted asset. */
const VIEW = { width: 240, height: 150 } as const;
/** Semantic levels map to liquid height fractions exactly once; authored DSL never carries raw numbers. */
type FigureLevel = 'low' | 'half' | 'full';
const LEVEL_FRACTION: Readonly<Record<FigureLevel, number>> = {
  low: 0.3,
  half: 0.55,
  full: 0.8,
};
/** Gauge needles rest at fixed angles per level; zero is straight up. */
const NEEDLE_ANGLE: Readonly<Record<FigureLevel, number>> = {
  low: -55,
  half: 0,
  full: 55,
};

/** Theme-derived figure palette; roles fall back to neutral inks when a theme omits them. */
interface Palette {
  readonly ink: string;
  readonly wash: string;
  readonly tint: string;
  readonly soft: string;
  readonly accent: string;
  readonly success: string;
}

/** Measure one parametric figure as a media primitive; renderers already draw admitted media unchanged. */
export function measureFigure(
  block: FigureBlock,
  width: number,
  style: ResolvedStyle,
  emphasis: 'inline' | 'figure' = 'inline',
): MeasuredContent {
  const preferred =
    emphasis === 'figure'
      ? style.contentSizing.figureBox[block.size]
      : style.contentSizing.widths[block.size].preferred;
  const targetWidth = Math.min(width, preferred);
  const height = targetWidth * (VIEW.height / VIEW.width);
  const svg = document_(drawFigure(block, palette(style)));
  return {
    width,
    height,
    anchors: [],
    outline: [altText(block)],
    primitives: [
      {
        kind: 'media',
        digest: `figure:${digestOf(svg)}`,
        alt: altText(block),
        dataUri: `data:image/svg+xml;base64,${encodeBase64(svg)}`,
        x: (width - targetWidth) / 2,
        y: 0,
        width: targetWidth,
        height,
        fit: 'contain',
      },
    ],
  };
}

/** Closed form dispatch keeps new artwork inside this module; projection orchestration never learns shapes. */
const drawers: Readonly<Record<FigureForm, (block: FigureBlock, palette: Palette) => string>> = {
  vessel: (block, palette) => vessel(block, palette),
  'layered-bed': (block, palette) => layeredBed(block, palette),
  screen: (block, palette) => screen(block, palette),
  gauge: (block, palette) => gauge(block, palette),
};

/** Draw the admitted form once; Model owns parameter validity before projection runs. */
function drawFigure(block: FigureBlock, palette: Palette): string {
  return drawers[block.form](block, palette);
}

/** Vessel: outlined tank with token-washed liquid, settling particles and optional agitator or mark. */
function vessel(block: FigureBlock, palette: Palette): string {
  const specific =
    block.form === 'vessel'
      ? block
      : { level: 'half' as const, agitator: false, mark: 'none' as const };
  const top = 30;
  const depth = 100;
  const liquid = liquidBand(top, depth, LEVEL_FRACTION[specific.level], palette.accent);
  const parts = [
    tank(palette),
    liquid,
    sediment(2 + Number(specific.agitator) * 3, top + depth, palette.ink),
    agitatorMark(specific.agitator, top, palette.ink),
    markBadge(specific.mark, 168, 96, palette),
  ];
  return parts.join('');
}

/** Agitated vessels carry a shaft; calm vessels carry nothing. */
function agitatorMark(on: boolean, top: number, ink: string): string {
  return on ? agitator(top, ink) : '';
}

/** Layered bed: filter strata under a liquid column; separated bands step from tint to ink. */
function layeredBed(block: FigureBlock, palette: Palette): string {
  const level = block.form === 'layered-bed' ? block.level : 'full';
  const top = 30;
  const depth = 100;
  const bedTop = top + depth * 0.45;
  const strata = [
    { fill: palette.soft, opacity: 0.5 },
    { fill: palette.accent, opacity: 0.55 },
    { fill: palette.ink, opacity: 0.85 },
  ]
    .map((layer, index) => band(bedTop + index * 18, 16, layer.fill, layer.opacity))
    .join('');
  return [
    tank(palette),
    liquidBand(top, depth * 0.45, LEVEL_FRACTION[level], palette.accent),
    strata,
    inflowArrow(top, palette.ink),
  ].join('');
}

/** Screen: slatted barrier arrests debris while the flow passes through. */
function screen(block: FigureBlock, palette: Palette): string {
  const debris = block.form === 'screen' ? block.debris : 'some';
  const bars = [0, 1, 2]
    .map((index) => rect(112 + index * 8, 25, 4, 100, palette.tint, palette.ink, 2))
    .join('');
  const caught =
    debris === 'some'
      ? [0, 1, 2]
          .map((index) => blob(96 - index * 10, 45 + index * 26, 5, palette.accent, palette.ink))
          .join('')
      : '';
  return [
    flowArrow(30, 75, 96, palette.ink),
    flowArrow(140, 75, 210, palette.ink),
    bars,
    caught,
  ].join('');
}

/** Gauge: half dial with token needle; level selects the measured angle, never a raw degree. */
function gauge(block: FigureBlock, palette: Palette): string {
  const level = block.form === 'gauge' ? block.level : 'half';
  const cx = 120;
  const cy = 110;
  const radius = 60;
  const angle = (NEEDLE_ANGLE[level] * Math.PI) / 180;
  const needle = line(
    cx,
    cy,
    cx + radius * 0.75 * Math.sin(angle),
    cy - radius * 0.75 * Math.cos(angle),
    palette.accent,
    6,
  );
  const ticks = [-60, -30, 0, 30, 60]
    .map((degree) => tick(cx, cy, radius, degree, palette.soft))
    .join('');
  return [arc(cx, cy, radius, palette.ink), ticks, needle, dot(cx, cy, 7, palette.ink)].join('');
}

/** Shared tank outline reused by vessel and bed forms; geometry lives once. */
function tank(palette: Palette): string {
  return rect(60, 30, 120, 100, palette.wash, palette.ink, 3);
}

/** Liquid band fills from the band floor upward so level semantics stay visual. */
function liquidBand(top: number, depth: number, fraction: number, fill: string): string {
  const height = depth * fraction;
  return `<rect x="66" y="${top + depth - height}" width="108" height="${height}" fill="${fill}" opacity="0.45"/>`;
}

/** One horizontal strata band inside a layered bed. */
function band(y: number, height: number, fill: string, opacity: number): string {
  return `<rect x="66" y="${y}" width="108" height="${height}" fill="${fill}" opacity="${opacity}"/>`;
}

/** Settling particles gather near the vessel floor; count stays tiny and deterministic. */
function sediment(count: number, floor: number, fill: string): string {
  return Array.from({ length: count }, (_, index) =>
    dot(80 + index * 18, floor - 8 - (index % 2) * 6, 3, fill),
  ).join('');
}

/** Agitator shaft and paddle mark active mixing vessels. */
function agitator(top: number, stroke: string): string {
  return (
    line(120, top - 18, 120, top + 58, stroke, 5) + line(102, top + 58, 138, top + 58, stroke, 5)
  );
}

/** Inflow arrow signals media entering the bed from above. */
function inflowArrow(top: number, stroke: string): string {
  return `${line(120, top - 22, 120, top - 2, stroke, 4)}<path d="m113 ${top - 10} 7 10 7-10" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>`;
}

/** Horizontal flow segment with an arrowhead pointing right. */
function flowArrow(x1: number, y: number, x2: number, stroke: string): string {
  return `${line(x1, y, x2, y, stroke, 4)}<path d="m${x2 - 9} ${y - 7} 10 7-10 7" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>`;
}

/** Badge frames are a closed table; badges never become free artwork. */
const badgeFrames: Readonly<
  Record<'check' | 'shield', (x: number, y: number, palette: Palette) => string>
> = {
  shield: (x, y, palette) =>
    `<path d="M${x} ${y} l14 6 v12 c0 10-7 16-14 19 c-7-3-14-9-14-19 v-12 z" fill="${palette.wash}" stroke="${palette.success}" stroke-width="3"/>`,
  check: (x, y, palette) =>
    `<circle cx="${x + 7}" cy="${y + 14}" r="14" fill="${palette.wash}" stroke="${palette.success}" stroke-width="3"/>`,
};

/** Mark badges certify a vessel; none carries no badge at all. */
function markBadge(
  mark: 'none' | 'check' | 'shield',
  x: number,
  y: number,
  palette: Palette,
): string {
  if (mark === 'none') return '';
  return (
    badgeFrames[mark](x, y, palette) +
    `<path d="m${x} ${y + 14} 6 6 10-11" fill="none" stroke="${palette.success}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
  );
}

/** Gauge arc spans the upper half dial. */
function arc(cx: number, cy: number, radius: number, stroke: string): string {
  return `<path d="M${cx - radius} ${cy} a${radius} ${radius} 0 0 1 ${radius * 2} 0" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>`;
}

/** One dial tick at a degree offset from vertical. */
function tick(cx: number, cy: number, radius: number, degree: number, stroke: string): string {
  const angle = (degree * Math.PI) / 180;
  const inner = radius * 0.82;
  return line(
    cx + inner * Math.sin(angle),
    cy - inner * Math.cos(angle),
    cx + radius * Math.sin(angle),
    cy - radius * Math.cos(angle),
    stroke,
    3,
  );
}

/** Primitive painters keep markup assembly out of the form builders. */
function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

/** Straight segment painter. */
function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  width: number,
): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
}

/** Filled circle painter. */
function dot(cx: number, cy: number, r: number, fill: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
}

/** Soft debris blob caught against a screen. */
function blob(cx: number, cy: number, r: number, fill: string, stroke: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
}

/** Palette derives only from resolved tokens; figures re-theme automatically with the collection theme. */
function palette(style: ResolvedStyle): Palette {
  return {
    ink: style.text,
    wash: style.surface,
    tint: rolePaint(style, 'neutral', style.surface).fill,
    soft: style.border,
    accent: rolePaint(style, 'primary', style.secondary).stroke,
    success: rolePaint(style, 'success', style.secondary).stroke,
  };
}

/** Named roles fall back to neutral inks when a theme omits them; absence never erases the figure. */
function rolePaint(
  style: ResolvedStyle,
  name: string,
  fallback: string,
): { readonly fill: string; readonly stroke: string } {
  const role = style.roles[name];
  return role === undefined ? { fill: fallback, stroke: fallback } : role;
}

/** Accessible name and outline entry describe intent, never pixel content. */
function altText(block: FigureBlock): string {
  const level = 'level' in block ? `, ${block.level} level` : '';
  return `${block.form} figure${level}`;
}

/** Deterministic identity for renderer caches; artwork bytes fully determine the digest. */
function digestOf(svg: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < svg.length; index += 1) {
    hash ^= svg.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16);
}

/** Generated artwork is pure ASCII, so a local encoder keeps platform base64 out of core. */
function encodeBase64(ascii: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let index = 0; index < ascii.length; index += 3) {
    const chunk =
      (ascii.charCodeAt(index) << 16) |
      (codeOrZero(ascii, index + 1) << 8) |
      codeOrZero(ascii, index + 2);
    output += quartet(alphabet, chunk, ascii.length - index);
  }
  return output;
}

/** Missing tail bytes read as zero and are masked by padding. */
function codeOrZero(text: string, index: number): number {
  return index < text.length ? text.charCodeAt(index) : 0;
}

/** One 24-bit chunk becomes four alphabet characters with tail padding. */
function quartet(alphabet: string, chunk: number, remaining: number): string {
  const pads = 3 - Math.min(remaining, 3);
  const body = [(chunk >> 18) & 63, (chunk >> 12) & 63, (chunk >> 6) & 63, chunk & 63]
    .map((unit) => alphabet[unit])
    .join('');
  return body.slice(0, 4 - pads) + '='.repeat(pads);
}

/** Wrap form artwork in the fixed viewBox document every renderer scales uniformly. */
function document_(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.width} ${VIEW.height}">${body}</svg>`;
}
