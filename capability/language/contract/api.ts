import type { Language, Dependencies } from './types.js';
import type { Result } from './errors.js';
import type { ParsedSource } from './records/syntax.js';
import type { Description } from './records/vocabulary.js';
import type { LowerRequest, LoweredIntent, PrintRequest, Readout } from './records/requests.js';
import { protect } from '../core/validation/outcomes.js';
import { parseSource } from '../core/parsing/document.js';
import { lowerDocument } from '../core/lowering/document.js';
import { lowerPatch } from '../core/patching/compile.js';
import { printCollection } from '../core/printing/document.js';
import { describeLanguage } from '../core/vocabulary/description.js';
/**
 * Bind required owner roles without I/O. Language owns syntax correction and immutable compilation;
 * Authoring owns admission, revisions, concurrency and recovery. Retrying identical inputs has no effects.
 */
export function createLanguage(deps: Dependencies): Language {
  /** Return a detached inspectable grammar, including defaults and complete example source. */
  function describe(version = 1): Result<Description> {
    return protect(() => describeLanguage(version));
  }
  /** Parse before resource admission; no file or network source is read or evaluated. */
  function parse(source: string): Result<ParsedSource> {
    return protect(() => parseSource(source));
  }
  /** Compile against one detached snapshot; no partial candidate survives a failure. */
  function lower(input: LowerRequest): Result<LoweredIntent> {
    return protect(() => {
      const request = structuredClone(input);
      const parsed = parseSource(request.source);
      if (parsed.kind === 'canvas') return lowerDocument(parsed, request, deps);
      return lowerPatch(parsed, request, deps);
    });
  }
  /** Read the supported semantic model as full source or a structurally non-authorable scoped view. */
  function print(input: PrintRequest): Result<Readout> {
    return protect(() => printCollection(structuredClone(input), deps.reader));
  }
  return Object.freeze({ describe, parse, lower, print });
}
