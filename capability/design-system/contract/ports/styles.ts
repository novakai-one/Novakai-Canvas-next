import type { Result } from '../errors.js';
import type { StyleDeclaration } from '../records/artifacts.js';
/** Only authored consumer styles enter this reader; generated/vendor files are excluded by inventory, not counted as coverage. */
export interface StylesheetSource {
  readonly file: string;
  readonly css: string;
}
export interface StylesheetReader {
  read(sources: readonly StylesheetSource[]): Result<readonly StyleDeclaration[]>;
}
