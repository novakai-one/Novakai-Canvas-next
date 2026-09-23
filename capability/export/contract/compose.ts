import { initWasm } from '@resvg/resvg-wasm';
import { decompressFont } from '../adapters/native/woff2.js';
import type { ReactBindings, SceneRenderer } from './render-types.js';
import type { Dependencies, Export, TransferDependencies } from './types.js';
import type { SnapshotReader } from './ports/snapshot.js';
import type { FormatRegistry } from './ports/formats.js';
import type { Result } from './errors.js';
import { failure } from './errors.js';
import { createExport } from './api.js';
import { createEncoding } from '../adapters/native/encoding.js';
import { createNodeDrawing } from '../adapters/svg/nodes.js';
import { createMarkerDrawing } from '../adapters/svg/markers.js';
import { createWireDrawing } from '../adapters/svg/wires.js';
import { createSequenceDrawing } from '../adapters/svg/sequence.js';
import { createSceneRenderer } from '../adapters/svg/scene.js';
import { createPngEncoder } from '../adapters/native/png.js';
import { createPdfEncoder } from '../adapters/native/pdf.js';
import { createFontDecoder } from '../adapters/native/fonts.js';
import { createMediaConverter } from '../adapters/native/media.js';
import { createHtmlEncoder } from '../adapters/html/document.js';
import { buildBundle } from '../core/bundles/manifest.js';
export interface ExportOwners extends Omit<TransferDependencies, 'encoding'> {
  readonly snapshots: SnapshotReader;
  readonly presentation: ReactBindings;
  readonly readerCss: string;
  /** Draw every wire label, including ones the diagram hides by default. */
  readonly allLabels?: boolean;
}
export interface ExportBindings {
  readonly service: Export;
  readonly dependencies: Dependencies;
  readonly renderer: SceneRenderer;
}
/** Initialize the pinned WASM once during host startup. A failed initialization requires a fresh host instance. */
export async function initializeRaster(module: WebAssembly.Module): Promise<Result<void>> {
  try {
    await initWasm(module);
    return { ok: true, value: undefined };
  } catch {
    return failure('encoding-failed', 'composition.wasm', 'Raster runtime initialization failed');
  }
}
/** Shared Presentation slots are bound once, outside rendering. No alternate notation implementation exists. */
export function composeExport(owners: ExportOwners): ExportBindings {
  const drawings = createNodeDrawing(owners.presentation);
  const Marker = createMarkerDrawing(owners.presentation);
  const renderer = createSceneRenderer(
    {
      ...drawings,
      wire: createWireDrawing(drawings.label, Marker),
      sequence: createSequenceDrawing(drawings.label, Marker),
    },
    owners.presentation.FontDefinitions,
    owners.presentation.fonts.map((font) => font.digest),
    owners.allLabels === true,
  );
  const encoding = createEncoding();
  const transfer = { documents: owners.documents, resources: owners.resources, encoding };
  const formats = createFormats(owners, renderer, transfer);
  const dependencies = { ...transfer, snapshots: owners.snapshots, formats };
  return { service: createExport(dependencies), dependencies, renderer };
}
/** Required real handlers serve all five formats; bundle construction remains owned by Export core. */
function createFormats(
  owners: ExportOwners,
  renderer: SceneRenderer,
  transfer: TransferDependencies,
): FormatRegistry {
  const render = { renderer, encoding: transfer.encoding };
  const fonts = createFontDecoder(owners.presentation.fonts, decompressFont);
  return {
    svg: {
      encode: async (input) => {
        const result = renderer.render(input);
        if (!result.ok) return result;
        return {
          ok: true,
          value: { bytes: transfer.encoding.utf8(result.value), pages: [], warnings: [] },
        };
      },
    },
    png: createPngEncoder(render, fonts),
    pdf: createPdfEncoder({ renderer }, fonts, createMediaConverter()),
    html: createHtmlEncoder(render, owners.readerCss),
    bundle: { encode: (input) => buildBundle(input.snapshot, transfer, input.signal) },
  };
}
