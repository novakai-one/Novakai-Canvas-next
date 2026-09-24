/*
 * PDF page planning. Each section is cut into tiles that fit the paper; tiles overlap slightly
 * so nothing is lost at a cut. Planning runs before any PDF document exists.
 *
 * Fixed layout, in PDF points unless noted: 24 margin on every side, 18 more at the bottom for
 * the footer (so 48 across and 66 down are not drawable), drawing scale 0.75 points per
 * collection unit, and 16 collection units (12 points) of overlap between neighbouring tiles.
 */
import { PDF_PAGE_LIMIT } from '../../contract/records/limits.js';
import type { Page } from '../../contract/records/pages.js';
import type { Selection, Identity, PlacedSection } from '../../contract/records/artifact.js';
import type { ExportRequest } from '../../contract/records/input.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
import { success } from '../validation/outcomes.js';
/** A paper size in PDF points. */
interface Paper {
  /** Width in PDF points. */
  readonly width: number;

  /** Height in PDF points. */
  readonly height: number;
}

/** Portrait paper sizes in PDF points. */
const papers: Readonly<Record<ExportRequest['paper'], Paper>> = {
  A4: { width: 595.276, height: 841.89 },
  Letter: { width: 612, height: 792 },
};
/**
 * Plans the PDF pages for a selection: every section is tiled at a fixed readable scale, then
 * the pages are numbered across the whole document and given their footers.
 *
 * @param selection - The sections to print.
 * @param request - The parsed request (paper and orientation are used).
 * @param identity - The revision; its title and revision go into each footer.
 * @returns The pages, or `limit-exceeded` when more than 512 pages would be needed.
 */
export function planPages(
  selection: Selection,
  request: ExportRequest,
  identity: Identity,
): Result<readonly Page[]> {
  const paper = orient(papers[request.paper], request.orientation);
  const pages = selection.sections.flatMap((section) => tileSection(section, paper));
  if (pages.length > PDF_PAGE_LIMIT)
    return failure('limit-exceeded', 'pages', 'Print requires more than 512 pages');
  return success(
    pages.map((page, index) => ({
      ...page,
      ordinal: index + 1,
      footer: `${identity.title} · revision ${identity.revision} · ${index + 1}/${pages.length}`,
    })),
  );
}
/** Swaps width and height for landscape. Diagram coordinates are not affected. */
function orient(paper: Paper, orientation: ExportRequest['orientation']): Paper {
  if (orientation === 'portrait') return paper;
  return { width: paper.height, height: paper.width };
}
/**
 * Cuts one section's box into a grid of tiles. Each tile covers the drawable area; tiles
 * advance by the tile size minus the 16-unit overlap. When the grid would exceed the page
 * limit, returns one more than the limit of placeholder pages, so the caller's limit check fails
 * without building a huge list.
 */
function tileSection(section: PlacedSection, paper: Paper): readonly Page[] {
  const width = (paper.width - 48) / 0.75;
  const height = (paper.height - 66) / 0.75;
  const columns = Math.max(1, Math.ceil((section.box.width - 16) / (width - 16)));
  const rows = Math.max(1, Math.ceil((section.box.height - 16) / (height - 16)));
  if (columns * rows > PDF_PAGE_LIMIT)
    return Array.from({ length: PDF_PAGE_LIMIT + 1 }, () =>
      pageAt(section, paper, 0, 0, width, height),
    );
  return Array.from({ length: columns * rows }, (_, index) =>
    pageAt(section, paper, index % columns, Math.floor(index / columns), width, height),
  );
}
/**
 * Builds the page for one tile. Every tile keeps the full crop size, so the last row and column
 * may include empty space past the content. `ordinal` and `footer` are filled in by
 * `planPages`.
 */
function pageAt(
  section: PlacedSection,
  paper: Paper,
  column: number,
  row: number,
  width: number,
  height: number,
): Page {
  return {
    ordinal: 0,
    section: section.id,
    crop: {
      x: section.box.x + column * (width - 16),
      y: section.box.y + row * (height - 16),
      width,
      height,
    },
    paperWidth: paper.width,
    paperHeight: paper.height,
    scale: 0.75,
    margin: 24,
    overlap: 12,
    footer: '',
  };
}
