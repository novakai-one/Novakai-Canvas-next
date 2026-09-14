import { PDF_PAGE_LIMIT } from '../../contract/records/limits.js';
import type { Page } from '../../contract/records/pages.js';
import type { Selection, Identity, PlacedSection } from '../../contract/records/artifact.js';
import type { ExportRequest } from '../../contract/records/input.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
import { success } from '../validation/outcomes.js';
interface Paper {
  readonly width: number;
  readonly height: number;
}
const papers: Readonly<Record<ExportRequest['paper'], Paper>> = {
  A4: { width: 595.276, height: 841.89 },
  Letter: { width: 612, height: 792 },
};
/** Retain a readable scale and bounded page count; no native document exists until this succeeds. */
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
/** Orientation swaps physical dimensions only; diagram coordinates remain unchanged. */
function orient(paper: Paper, orientation: ExportRequest['orientation']): Paper {
  if (orientation === 'portrait') return paper;
  return { width: paper.height, height: paper.width };
}
/** Tile collection-global section bounds. Overlap is subtracted from the advance, not crop extent. */
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
/** Last tiles retain their physical crop size; clipping may include harmless empty margin beyond content. */
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
