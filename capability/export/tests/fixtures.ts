import { hexColor } from '../../design-system/contract/index.js';
import { layoutInputKey } from '../../layout/contract/index.js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { assert } from 'vitest';
import sharp from 'sharp';
import { validate, plan, stage, type Collection } from '@novakai/canvas-model';
import { createLanguage } from '@novakai/canvas-language';
import {
  composePresentation,
  fontSet,
  resolvedStyle,
  type FontSet,
  type MeasuredContent,
  type Projection,
} from '@novakai/canvas-presentation';
import type { Scene, PlacedSection } from '@novakai/canvas-layout';
import {
  composeExport,
  initializeRaster,
  type Result,
  type Snapshot,
  type Resource,
  type Documents,
  type ExportBindings,
  type ExportRequest,
  type Bundle,
} from '../contract/index.js';
import { createEncoding } from '../adapters/native/encoding.js';
export const encoding = createEncoding();
const language = createLanguage({ reader: { validate }, planner: { plan }, stage: { stage } });
const themeBytes = encoding.utf8('Export fixture theme');
const theme = {
  id: 'paper',
  version: '1.0.0',
  digest: `sha256:${encoding.hash(themeBytes)}`,
  roles: ['neutral'],
};
/** Public outcomes fail fixture setup rather than inventing valid records. */
export function value<T>(
  result: { readonly ok: true; readonly value: T } | { readonly ok: false },
): T {
  assert(result.ok, JSON.stringify(result));
  return result.value;
}
/** Typed fixture error permits deterministic resource and codec fault injection. */
export function failed(
  code: 'encoding-failed' | 'resource-rejected' | 'cleanup-failed' = 'encoding-failed',
): Result<never> {
  return {
    ok: false,
    error: {
      code,
      path: 'fixture',
      message: 'Injected failure',
      recovery: 'Retry with repaired fixture',
    },
  };
}
/** Real static font bytes are shared with Presentation and native export. */
function pinnedFonts(): FontSet {
  return fontSet.parse(
    [
      { family: 'Inter', file: 'inter-latin-400-normal.woff2' },
      { family: 'JetBrains Mono', file: 'jetbrains-mono-latin-400-normal.woff2' },
      { family: 'Inter Tight', file: 'inter-tight-latin-700-normal.woff2' },
    ].map((font) => {
      const bytes = readFileSync(new URL(`../../../resources/fonts/${font.file}`, import.meta.url));
      return {
        family: font.family,
        digest: encoding.hash(bytes),
        mediaType: 'font/woff2',
        base64: encoding.base64(bytes),
      };
    }),
  );
}
/** Module initialization is one explicit host-startup action; individual tests do not race reinitialization. */
export async function startRaster(): Promise<void> {
  const require = createRequire(import.meta.url);
  const file = require.resolve('@resvg/resvg-wasm/index_bg.wasm');
  value(await initializeRaster(await WebAssembly.compile(readFileSync(file))));
}
/** Canonical input has readable semantic labels, retained manual coordinates and a real WebP asset. */
function collection(
  resource: Resource,
  composition: 'stack' | 'media-top' | 'media-left',
  numbered: boolean,
): Collection {
  return value(
    validate({
      schemaVersion: 1,
      id: 'engineering',
      revision: 7,
      title: 'Engineering <script>alert(1)</script>',
      theme,
      arrangement: { algorithm: 'grid' },
      assets: [
        {
          id: 'picture',
          digest: `sha256:${resource.digest}`,
          mediaType: resource.mediaType,
          alt: 'Blue status square',
        },
      ],
      objects: [
        {
          id: 'alpha',
          kind: 'step',
          label: 'Agent & human',
          composition,
          frame: composition === 'stack' ? 'auto' : 'none',
          content: [{ id: 'icon', kind: 'image', asset: 'picture' }],
        },
        { id: 'beta', kind: 'end', label: 'Admitted revision' },
      ],
      relationships: [
        {
          id: 'apply',
          kind: 'flow',
          label: 'validated changes',
          ...(numbered ? { step: 12 } : {}),
          source: { object: 'alpha' },
          target: { object: 'beta' },
        },
      ],
      sections: [
        {
          id: 'flow',
          title: 'Authoring',
          mode: 'flow',
          layout: { algorithm: 'flow' },
          groups: [
            {
              id: 'gate',
              title: 'Validation group',
              layout: { algorithm: 'flow' },
              placement: { x: 20, y: 30, locked: true },
            },
          ],
          appearances: [
            { object: 'alpha', group: 'gate', placement: { x: 31, y: 42, locked: true } },
            { object: 'beta' },
          ],
          wires: [
            {
              relationship: 'apply',
              manual: [
                { x: 200, y: 100 },
                { x: 300, y: 100 },
              ],
              locked: true,
              sourceSide: 'right',
              targetSide: 'left',
            },
          ],
          placement: { x: -80, y: 120, locked: true },
        },
      ],
    }),
  );
}
/** Real Model/Language public calls provide the independent semantic roundtrip oracle. */
function documents(original: Collection): Documents {
  const resources = {
    themes: { paper: original.theme },
    assets: Object.fromEntries(original.assets.map((asset) => [asset.id, asset])),
  };
  return {
    read: (input) => translate(validate(input)),
    print: (collection) => {
      const printed = language.print({ collection, scope: { kind: 'all' } });
      if (!printed.ok) return failed();
      return { ok: true, value: printed.value.source };
    },
    parse: (source) => {
      const parsed = language.lower({ source, mode: 'create', snapshot: null, resources });
      if (!parsed.ok) return failed();
      return { ok: true, value: parsed.value.collection };
    },
  };
}
/** Foreign diagnostic vocabulary is adapted explicitly, without importing foreign internals. */
function translate<T>(
  result: { readonly ok: true; readonly value: T } | { readonly ok: false },
): Result<T> {
  if (result.ok) return result;
  return failed();
}
/** Independent supplied geometry deliberately includes nonzero section origin and a nested group. */
function placed(projection: Projection, label: MeasuredContent): PlacedSection {
  const section = projection.sections.at(0);
  assert(section);
  const nodes = section.nodes.map((node, index) => ({
    id: node.id,
    parent: node.parent,
    sectionId: section.id,
    box: { x: 40 + index * 260, y: 80, width: node.width, height: node.height },
    measured: node,
  }));
  const first = nodes.at(0);
  const last = nodes.at(-1);
  assert(first && last);
  return {
    id: section.id,
    origin: { x: -80, y: 120 },
    box: { x: -80, y: 120, width: 1000, height: 800 },
    title: {
      content: section.title,
      box: { x: 10, y: 10, width: section.title.width, height: section.title.height },
    },
    inputKey: layoutInputKey.parse(projection.inputKey),
    nodes,
    wires: [
      {
        id: 'apply',
        source: { node: first.id, member: null, point: { x: 240, y: 160 }, side: 'right' },
        target: { node: last.id, member: null, point: { x: 500, y: 160 }, side: 'left' },
        points: [
          { x: 240, y: 160 },
          { x: 500, y: 160 },
        ],
        path: 'M240 160L500 160',
        labelBox: { x: 300, y: 130, width: label.width, height: label.height },
        measuredLabel: label,
        appearance: {
          paint: {
            fill: hexColor.parse('#ffffff'),
            stroke: hexColor.parse('#444444'),
            text: hexColor.parse('#222222'),
          },
          width: 2,
          dash: [8, 4],
        },
        sourceMarker: 'one',
        targetMarker: 'zero-many',
        style: 'dashed',
      },
    ],
    sequence: {
      lifelines: [{ participant: first.id, from: { x: 100, y: 300 }, to: { x: 100, y: 600 } }],
      events: [
        {
          id: 'message',
          source: first.id,
          target: last.id,
          points: [
            { x: 100, y: 400 },
            { x: 500, y: 400 },
          ],
          labelBox: { x: 200, y: 370, width: label.width, height: label.height },
          content: label,
          marker: 'arrow',
          message: 'call',
        },
      ],
      fragments: [],
      activations: [
        {
          participant: first.id,
          fromEvent: 'message',
          toEvent: null,
          box: { x: 95, y: 400, width: 10, height: 100 },
        },
      ],
      source: [],
    },
  };
}
export interface Fixture {
  readonly bindings: ExportBindings;
  readonly snapshot: Snapshot;
  readonly releases: () => number;
  readonly request: (format?: ExportRequest['format']) => unknown;
}
/** Compose real rendering/encoding with controlled retention and owner-validation collaborators. */
export async function fixture(
  composition: 'stack' | 'media-top' | 'media-left' = 'stack',
  numbered = false,
): Promise<Fixture> {
  const bytes = await sharp({
    create: { width: 20, height: 20, channels: 4, background: '#1265dd' },
  })
    .webp({ lossless: true })
    .toBuffer();
  const image: Resource = {
    kind: 'asset',
    digest: encoding.hash(bytes),
    mediaType: 'image/webp',
    bytes,
    metadata: { alt: 'Blue status square' },
  };
  const original = collection(image, composition, numbered);
  const fonts = pinnedFonts();
  const first = fonts.at(0);
  const mono = fonts.at(1);
  const strong = fonts.at(2);
  assert(first && mono && strong);
  const paint = {
    fill: hexColor.parse('#ffffff'),
    stroke: hexColor.parse('#334155'),
    text: hexColor.parse('#0f172a'),
  };
  const style = resolvedStyle.parse({
    digest: encoding.hash(themeBytes),
    bodyFont: { family: first.family, digest: first.digest },
    monoFont: { family: mono.family, digest: mono.digest },
    strongFont: { family: strong.family, digest: strong.digest },
    typography: {
      sectionHeading: {
        font: { family: strong.family, digest: strong.digest },
        size: 24.0,
        lineHeight: 36.0,
      },
      nodeHeading: {
        font: { family: strong.family, digest: strong.digest },
        size: 20.0,
        lineHeight: 30.0,
      },
      body: { font: { family: first.family, digest: first.digest }, size: 16, lineHeight: 24 },
      mono: { font: { family: mono.family, digest: mono.digest }, size: 16, lineHeight: 24 },
      caption: {
        font: { family: first.family, digest: first.digest },
        size: 14.0,
        lineHeight: 21.0,
      },
      annotation: {
        font: { family: first.family, digest: first.digest },
        size: 14.0,
        lineHeight: 21.0,
      },
    },
    padding: 12,
    gap: 8,
    stroke: 1,
    radius: 8,
    connection: {
      paint: { fill: '#ffffff', stroke: '#444444', text: '#222222' },
      width: 2,
      dash: [8, 4],
    },
    contentSizing: {
      widths: {
        small: { preferred: 180, maximum: 240 },
        medium: { preferred: 240, maximum: 320 },
        large: { preferred: 320, maximum: 500 },
      },
      rowMinimum: 32,
      iconBox: { small: 24, medium: 32, large: 48 },
      figureBox: { small: 180, medium: 240, large: 320 },
    },
    roles: { neutral: paint },
    surface: '#ffffff',
    text: '#0f172a',
    secondary: '#64748b',
    border: '#334155',
  });
  const presentation = value(
    await composePresentation(
      {
        domain: {
          read: (input) => {
            const result = validate(input);
            if (result.ok) return result;
            return {
              ok: false,
              error: {
                code: 'invalid-input',
                path: '$',
                message: JSON.stringify(result),
                recovery: 'Repair fixture',
              },
            };
          },
        },
        themes: { resolve: () => ({ ok: true, value: style }) },
        assets: {
          read: () => ({
            ok: true,
            value: {
              digest: image.digest,
              mediaType: 'image/webp',
              base64: encoding.base64(image.bytes),
              width: 20,
              height: 20,
            },
          }),
        },
      },
      fonts,
    ),
  );
  const projection = value(presentation.presentation.project(original));
  const projectedWire = projection.sections[0]?.wires[0];
  assert(projectedWire);
  const label = projectedWire.label;
  const section = placed(projection, label);
  const scene: Scene = {
    collectionId: original.id,
    revision: 7,
    inputKey: layoutInputKey.parse(projection.inputKey),
    engineVersions: ['explicit-contract-fixture'],
    sections: [section],
    bounds: section.box,
    warnings: [],
    adjustments: [],
  };
  const resources: readonly Resource[] = [
    image,
    {
      kind: 'preset',
      digest: encoding.hash(themeBytes),
      mediaType: 'application/json',
      bytes: themeBytes,
      metadata: { kind: 'theme' },
    },
    ...fonts.map((font) => ({
      kind: 'font' as const,
      digest: font.digest,
      mediaType: font.mediaType,
      bytes: Buffer.from(font.base64, 'base64'),
      metadata: { family: font.family },
    })),
  ];
  const snapshot: Snapshot = {
    identity: {
      collectionId: original.id,
      revision: 7,
      inputKey: layoutInputKey.parse(projection.inputKey),
      title: original.title,
    },
    collection: original,
    scene,
    resources,
    paint,
  };
  let releaseCount = 0;
  const bindings = composeExport({
    presentation: presentation.react,
    snapshots: {
      acquire: async () => ({
        ok: true,
        value: {
          snapshot,
          release: async () => {
            releaseCount += 1;
            return { ok: true, value: undefined };
          },
        },
      }),
    },
    documents: documents(original),
    resources: { inspect: async (items) => ({ ok: true, value: items }) },
    readerCss: readFileSync(new URL('../adapters/html/reader.css', import.meta.url), 'utf8'),
  });
  return {
    bindings,
    snapshot,
    releases: () => releaseCount,
    request: (format = 'svg') => ({ identity: { collectionId: original.id, revision: 7 }, format }),
  };
}
/** Decode bundles through the public inspection result in tests; this shape helper changes corruption scenarios only. */
export function bundle(bytes: Uint8Array): Bundle {
  return JSON.parse(value(encoding.text(bytes)));
}
/** Recompute a deliberately edited manifest for semantic-corruption cases; digest faults use raw editing instead. */
export function manifestBytes(value: Bundle): Uint8Array {
  return encoding.utf8(JSON.stringify(value));
}
