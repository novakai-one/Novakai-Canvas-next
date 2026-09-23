import type { ParsedSource, Document, Patch } from '../../contract/records/syntax.js';
import { documentResources, patchResources } from '../lowering/resources.js';
import { sourceMappings } from '../lowering/diagnostics.js';
import { tokenize } from '../lexing/tokens.js';
import { readSource } from '../validation/input.js';
import { reject, accepted } from '../validation/outcomes.js';
import {
  peek,
  advance,
  consume,
  enter,
  leave,
  consumedSpan,
  type Cursor,
  type Parsed,
} from './cursor.js';
import { readDeclaration } from './declarations.js';
import { readIdentity } from './references.js';
import { readOperation } from './patch.js';
import { repeat } from './repetition.js';
/** Parse one versioned authoring document; a scoped view is structurally forbidden input. */
export function parseSource(source: string): ParsedSource {
  const tokens = accepted(tokenize(readSource(source)));
  const cursor: Cursor = { tokens, index: 0, depth: 0 };
  if (peek(cursor).text === 'view')
    reject('display-only', peek(cursor).span, 'canvas or patch', 'A scoped view cannot be applied');
  const parsed = readEnvelope(cursor);
  if (peek(parsed.next).kind !== 'eof')
    reject('syntax', peek(parsed.next).span, 'End of source', 'Unexpected trailing source');
  return describeParsedSource(parsed.value);
}
/** Version rejection is separate from an unknown envelope; supported grammar never guesses future versions. */
function readEnvelope(cursor: Cursor): Parsed<Document | Patch> {
  if (peek(cursor, 1).text !== '1')
    reject(
      'unsupported-version',
      peek(cursor, 1).span,
      'Version 1',
      'Unsupported language version',
    );
  return readSupportedEnvelope(cursor);
}
/** Dispatch the two supported authoring envelope forms after checking version. */
function readSupportedEnvelope(cursor: Cursor): Parsed<Document | Patch> {
  if (peek(cursor).text === 'canvas') return readCanvas(cursor);
  if (peek(cursor).text === 'patch') return readPatch(cursor);
  reject('syntax', peek(cursor).span, 'canvas or patch', 'Unknown document envelope');
}
/** A document has exactly one collection declaration. */
function readCanvas(cursor: Cursor): Parsed<Document> {
  const declaration = readDeclaration(advance(cursor, 2), ['collection']);
  const identity = readIdentity(advance(cursor, 3));
  return {
    value: {
      kind: 'canvas',
      version: 1,
      collection: identity.value,
      declaration: declaration.value,
      span: consumedSpan(cursor, declaration.next),
    },
    next: declaration.next,
  };
}
/** Bounded patch operations retain source order and defer domain references until final planning. */
function readPatch(cursor: Cursor): Parsed<Patch> {
  const identity = readIdentity(advance(cursor, 2));
  const start = enter(consume(identity.next, '{'));
  const operations = accepted(
    repeat(start, (item) => peek(item).text !== '}', readOperation, 1000),
  );
  if (operations.value.length > 1000)
    reject('limit', peek(start).span, 'At most 1000 operations', 'Patch operation limit exceeded');
  const end = leave(consume(operations.next, '}'));
  return {
    value: {
      kind: 'patch',
      version: 1,
      collection: identity.value,
      operations: operations.value,
      span: consumedSpan(cursor, end),
    },
    next: end,
  };
}

/** Hosts receive resource requests before resolution, while parsed syntax contains no file or network effects. */
function describeParsedSource(parsed: Document | Patch): ParsedSource {
  if (parsed.kind === 'canvas')
    return {
      ...parsed,
      resources: documentResources(parsed.declaration),
      sourceMap: sourceMappings(parsed.declaration),
    };
  return {
    ...parsed,
    resources: parsed.operations.flatMap(patchResources),
    sourceMap: parsed.operations.map((operation) => ({
      path: operation.address.id,
      span: operation.span,
    })),
  };
}
