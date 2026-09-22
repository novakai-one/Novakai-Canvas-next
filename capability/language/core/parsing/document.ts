import type { ParsedSource, Document, Patch, Declaration } from '../../contract/records/syntax.js';
import { documentResources, patchResources } from '../lowering/resources.js';
import { documentMappings } from '../lowering/diagnostics.js';
import { id, field, reference } from '../lowering/fields.js';
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
import { constructsV2 } from '../vocabulary/constructs-v2.js';
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
  const version = peek(cursor, 1).text;
  if (version === '1') return readSupportedEnvelope(cursor);
  if (version === '2') return readVersion2Envelope(cursor);
  reject(
    'unsupported-version',
    peek(cursor, 1).span,
    'canvas 2',
    'E002 version: expected canvas 2.',
  );
}
/** Dispatch the two supported authoring envelope forms after checking version. */
function readSupportedEnvelope(cursor: Cursor): Parsed<Document | Patch> {
  if (peek(cursor).text === 'canvas') return readCanvas(cursor);
  if (peek(cursor).text === 'patch') return readPatch(cursor);
  reject('syntax', peek(cursor).span, 'canvas or patch', 'Unknown document envelope');
}
/** Version 2 currently ships only the canvas envelope; patches stay a future slice. */
function readVersion2Envelope(cursor: Cursor): Parsed<Document> {
  if (peek(cursor).text === 'canvas') return readCanvas2(cursor);
  if (peek(cursor).text === 'patch')
    reject(
      'unsupported-version',
      peek(cursor, 1).span,
      'canvas 2',
      'Version 2 patches are not supported yet.',
    );
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
/** A v2 document declares shared shapes once, then a collection that stages views over them. */
function readCanvas2(cursor: Cursor): Parsed<Document> {
  const start = advance(cursor, 2);
  requireShape(start, 'declare');
  const declared = readDeclaration(start, ['declare'], constructsV2);
  requireShape(declared.next, 'collection');
  const collection = readDeclaration(declared.next, ['collection'], constructsV2);
  requireNoExtraShape(collection.next);
  const declareId = id(declared.value.fields);
  checkUses(collection.value, declareId);
  return {
    value: {
      kind: 'canvas',
      version: 2,
      collection: id(collection.value.fields),
      declaration: collection.value,
      declare: declared.value,
      span: consumedSpan(cursor, collection.next),
    },
    next: collection.next,
  };
}
/** A v2 document is exactly one declare, then exactly one collection. */
function requireShape(cursor: Cursor, expected: string): void {
  if (peek(cursor).text !== expected)
    reject('syntax', peek(cursor).span, expected, 'E003 shape: one declare, then one collection.');
}
/** A further declare or collection after the pair is still a shape violation, not trailing source. */
function requireNoExtraShape(cursor: Cursor): void {
  if (peek(cursor).text === 'declare' || peek(cursor).text === 'collection')
    reject(
      'syntax',
      peek(cursor).span,
      'End of document',
      'E003 shape: one declare, then one collection.',
    );
}
/** uses= must name the sibling declare; any other id is an unknown target. */
function checkUses(collection: Declaration, declareId: string): void {
  const uses = field(collection.fields, 'uses');
  if (reference(uses).id !== declareId)
    reject('unknown-target', uses.span, `@${declareId}`, `E004 uses: expected uses=@${declareId}.`);
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
      sourceMap: documentMappings(parsed),
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
