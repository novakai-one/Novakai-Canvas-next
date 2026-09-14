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
/** PDF retains vector geometry and exact resources. Export owns lease cleanup; hosts repair native providers before retry. */
export function createPdfEncoder(
  deps: Pick<RenderDependencies, 'renderer'>,
  fonts: FontDecoder,
  media: MediaConverter,
): FormatHandler {
  /** Resolve all assets before allocating pages. Native failures discard the complete buffered document. */
  async function encodeChecked(input: RenderInput): Promise<Result<Encoded>> {
    const decoded = await fonts.decode();
    if (!decoded.ok) return decoded;
    if (input.signal.aborted)
      return failure('cancelled', '$', 'Export cancelled after font decoding');
    return convertAndRender(input, decoded.value);
  }
  /** Stop between font/media/page stages; host owns provider repair and lease cleanup. */
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
  /** Retrying performs a fresh read; all provider throws are typed before reaching the job owner. */
  async function encode(input: RenderInput): Promise<Result<Encoded>> {
    try {
      return await encodeChecked(input);
    } catch {
      return failure('encoding-failed', 'pdf', 'PDF provider failed; host may retry after repair');
    }
  }
  return { encode };
}
/** Stream completion is the only success point; warnings reject unsupported conversion instead of dropping content. */
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
/** Each invocation owns its PDFKit state; the stream never escapes to the caller. */
function writePdf(
  input: RenderInput,
  deps: Pick<RenderDependencies, 'renderer'>,
  fonts: readonly NativeFont[],
  images: ReadonlyMap<string, string>,
): Promise<Result<Encoded>> {
  const document = new PDFDocument({
    autoFirstPage: false,
    compress: false,
    info: {
      Title: input.snapshot.identity.title,
      Subject: `Collection ${input.snapshot.identity.collectionId}, revision ${input.snapshot.identity.revision}`,
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
/** Clip before translating global scene coordinates to page points; overlap comes from the page plan. */
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
/** The exact digest family must be registered; PDFKit's implicit Helvetica fallback is forbidden. */
function fontAlias(family: string, fonts: readonly NativeFont[]): string {
  const font = fonts.find((item) => item.alias === family);
  if (!font) throw new Error('Missing exact font');
  return font.alias;
}
/** No path or network fallback: callback input must equal a retained image resource. */
function imageData(link: string, images: ReadonlyMap<string, string>): string {
  const image = images.get(link);
  if (!image) throw new Error('Missing retained image');
  return image;
}
/** Revision footer uses the first admitted font; absence is an encoding error, never an OS lookup. */
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
