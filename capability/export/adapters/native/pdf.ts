/*
 * PDF export through PDFKit and svg-to-pdfkit. Each planned page is one tile of a section: the
 * section is rendered as SVG for that tile, clipped to the drawable area and drawn as vector
 * geometry, then given its footer. Only the pinned fonts and the snapshot's own images are
 * used; any missing font or image, or any conversion warning, fails the whole PDF.
 */
import { PDF_PAGE_LIMIT } from '../../contract/records/limits.js';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import type { FormatHandler, RenderInput } from '../../contract/ports/formats.js';
import type {
  RenderDependencies,
  FontDecoder,
  MediaConverter,
  NativeFont,
} from '../../contract/render-types.js';
import type { Encoded } from '../../contract/records/artifact.js';
import type { Page } from '../../contract/records/pages.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';

/**
 * Creates the PDF format handler.
 *
 * `encode` decodes the fonts, checks cancellation, converts the images, checks cancellation
 * again, then writes the document. It returns the first failure, and never a partial PDF:
 * - a font or media failure, unchanged;
 * - `cancelled` after font decoding or after media conversion;
 * - `limit-exceeded` at `pages` for more than 512 pages;
 * - `encoding-failed` at `pdf` ("PDF conversion failed; …") when writing fails: a planned
 *   section is missing, a section fails to render, a font or image is not pinned, svg-to-pdfkit
 *   reports a warning, or PDFKit errors;
 * - `encoding-failed` at `pdf` ("PDF provider failed; …") for any other throw.
 *
 * A successful result's `pages` is the input's page list itself. Every call builds its own
 * document and reads its inputs again, so the host may retry after repairing a provider; the
 * caller releases the snapshot lease.
 *
 * @param deps - The shared SVG renderer.
 * @param fonts - The pinned-font decoder.
 * @param media - The image converter.
 * @returns The handler.
 * @throws Never; `encode` never rejects.
 */
export function createPdfEncoder(
  deps: Pick<RenderDependencies, 'renderer'>,
  fonts: FontDecoder,
  media: MediaConverter,
): FormatHandler {
  /** Runs the whole encoding and turns any throw into `encoding-failed`. */
  async function encode(input: RenderInput): Promise<Result<Encoded>> {
    try {
      return await encodeChecked(input);
    } catch {
      return failure('encoding-failed', 'pdf', 'PDF provider failed; host may retry after repair');
    }
  }

  /** Decodes the fonts, then stops if cancelled. Fonts are ready before any page exists. */
  async function encodeChecked(input: RenderInput): Promise<Result<Encoded>> {
    const decoded = await fonts.decode();
    if (!decoded.ok) return decoded;
    if (input.signal.aborted)
      return failure('cancelled', '$', 'Export cancelled after font decoding');
    return convertAndRender(input, decoded.value);
  }

  /** Converts the snapshot's images, then stops if cancelled, otherwise writes the PDF. */
  async function convertAndRender(
    input: RenderInput,
    decoded: readonly NativeFont[],
  ): Promise<Result<Encoded>> {
    const images = await media.convert(input.snapshot.resources);
    if (!images.ok) return images;
    if (input.signal.aborted)
      return failure('cancelled', '$', 'Export cancelled after media conversion');
    return renderPdf(input, deps, decoded, images.value);
  }

  return { encode };
}

/**
 * Checks the page limit, then writes the document. Success only comes from the finished
 * document stream; any failure while writing becomes `encoding-failed`.
 */
async function renderPdf(
  input: RenderInput,
  deps: Pick<RenderDependencies, 'renderer'>,
  fonts: readonly NativeFont[],
  images: ReadonlyMap<string, string>,
): Promise<Result<Encoded>> {
  if (input.pages.length > PDF_PAGE_LIMIT)
    return failure('limit-exceeded', 'pages', 'PDF exceeds 512 pages');
  try {
    return await writePdf(input, deps, fonts, images);
  } catch {
    return failure('encoding-failed', 'pdf', 'PDF conversion failed; no partial document returned');
  }
}

/**
 * Writes the whole document into memory: title and subject from the snapshot identity, no
 * automatic first page, no compression, every pinned font registered under its alias, then
 * each page in order. When a page throws, the document is still ended and its stream drained
 * before the promise rejects with that error. Resolves with the bytes once the stream ends;
 * rejects if PDFKit reports a stream error.
 */
function writePdf(
  input: RenderInput,
  deps: Pick<RenderDependencies, 'renderer'>,
  fonts: readonly NativeFont[],
  images: ReadonlyMap<string, string>,
): Promise<Result<Encoded>> {
  const title = input.snapshot.identity.title;
  const collection = `Collection ${input.snapshot.identity.collectionId}`;
  const subject = `${collection}, revision ${input.snapshot.identity.revision}`;
  const document = new PDFDocument({
    autoFirstPage: false,
    compress: false,
    info: {
      Title: title,
      Subject: subject,
    },
  });
  const chunks: Buffer[] = [];
  const completed = new Promise<Result<Encoded>>((resolve, reject) => {
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('error', reject);
    document.on('end', () =>
      resolve({
        ok: true,
        value: { bytes: Uint8Array.from(Buffer.concat(chunks)), pages: input.pages, warnings: [] },
      }),
    );
  });
  fonts.forEach((font) => document.registerFont(font.alias, Buffer.from(font.bytes)));
  try {
    input.pages.forEach((page) => writePage(document, page, input, deps, fonts, images));
    document.end();
  } catch (error) {
    document.end();
    return completed.then(() => Promise.reject(error));
  }
  return completed;
}

/**
 * Draws one page: renders the page's section as SVG with the tile's crop as its bounds, adds a
 * page of the planned paper size, clips to the drawable area at the margin, draws the SVG
 * there at the page scale, then adds the footer. Throws when the section is not in the
 * selection, rendering fails, or svg-to-pdfkit needs an unpinned font or image or warns.
 */
function writePage(
  document: PDFKit.PDFDocument,
  page: Page,
  input: RenderInput,
  deps: Pick<RenderDependencies, 'renderer'>,
  fonts: readonly NativeFont[],
  images: ReadonlyMap<string, string>,
): void {
  const section = input.selection.sections.find((item) => item.id === page.section);
  if (!section) throw new Error('Missing planned section');
  const rendered = deps.renderer.render({
    ...input,
    selection: { sections: [section], bounds: page.crop },
  });
  if (!rendered.ok) throw new Error('Section rendering failed');
  document.addPage({ size: [page.paperWidth, page.paperHeight], margin: 0 });
  document
    .save()
    .rect(page.margin, page.margin, page.crop.width * page.scale, page.crop.height * page.scale)
    .clip();
  SVGtoPDF(document, rendered.value, page.margin, page.margin, {
    width: page.crop.width * page.scale,
    height: page.crop.height * page.scale,
    assumePt: true,
    fontCallback: (family) => fontAlias(family, fonts),
    imageCallback: (link) => imageData(link, images),
    warningCallback: (message) => {
      throw new Error(message);
    },
  });
  document.restore();
  writeFooter(document, page, fonts);
}

/**
 * The registered alias for an SVG font family. Throws unless the family is exactly a pinned
 * font's alias, so PDFKit never falls back to its built-in Helvetica.
 */
function fontAlias(family: string, fonts: readonly NativeFont[]): string {
  const font = fonts.find((item) => item.alias === family);
  if (!font) throw new Error('Missing exact font');
  return font.alias;
}

/**
 * The embeddable data URL for an SVG image link. Throws unless the link is exactly a key of the
 * converted images; there is no file or network fallback.
 */
function imageData(link: string, images: ReadonlyMap<string, string>): string {
  const image = images.get(link);
  if (!image) throw new Error('Missing retained image');
  return image;
}

/**
 * Writes the page's footer text in the first pinned font, 9 points, black, on one line
 * across the drawable width, 12 points above the bottom margin. Throws when there is no font;
 * the operating system's fonts are never used.
 */
function writeFooter(document: PDFKit.PDFDocument, page: Page, fonts: readonly NativeFont[]): void {
  const font = fonts.at(0);
  if (!font) throw new Error('Missing footer font');
  document
    .font(font.alias)
    .fontSize(9)
    .fillColor('#000000')
    .text(page.footer, page.margin, page.paperHeight - page.margin - 12, {
      width: page.paperWidth - page.margin * 2,
      lineBreak: false,
    });
}
