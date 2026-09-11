import type { Declaration, Document } from '../../contract/records/syntax.js';
import type { LowerRequest, LoweredIntent } from '../../contract/records/requests.js';
import type { Dependencies } from '../../contract/types.js';
import { textOr, type RawRecord } from './fields.js';
import { lowerRecord, lowerNode } from './content.js';
import { lowerSection } from './views.js';
import { lowerLayout } from './layout.js';
import { lowerAsset, resolveTheme, documentResources } from './resources.js';
import { ownerValue, sourceMappings } from './diagnostics.js';
import { reject } from '../validation/outcomes.js';
/** Build complete raw canonical data; Model alone mints checked collection identities and validates invariants. */
export function lowerDocumentData(document: Document, request: LowerRequest): RawRecord {
  const item = document.declaration;
  const metadata = lowerRecord(item);
  const { algorithm, direction, gap, theme: alias, ...remaining } = metadata;
  void algorithm;
  void direction;
  void gap;
  void alias;
  const theme = resolveTheme(textOr(item.fields, 'theme', 'paper'), request.resources, item.span);
  return {
    ...remaining,
    schemaVersion: 1,
    revision: request.snapshot?.revision ?? 0,
    theme,
    arrangement: lowerLayout(item.fields, item.children, 'grid'),
    objects: records(item, 'node').map(lowerNode),
    relationships: records(item, 'wire').map(lowerRecord),
    sections: records(item, 'section').map(lowerSection),
    sources: records(item, 'source').map(lowerRecord),
    assets: records(item, 'asset').map((asset) => lowerAsset(asset, request.resources)),
  };
}
/** Record namespaces are selected explicitly; view statements never become canonical objects. */
function records(item: Declaration, kind: Declaration['kind']): readonly Declaration[] {
  return item.children.filter((child) => child.kind === kind);
}
/** Creation needs absence; replacement needs the matching valid snapshot, never an implicit upsert. */
function checkMode(document: Document, request: LowerRequest): void {
  if (request.mode === 'create') return requireAbsent(document, request);
  requireReplacement(document, request);
}
/** Replacement requires the matching snapshot and an explicit mode. */
function requireReplacement(document: Document, request: LowerRequest): void {
  if (request.mode !== 'replace')
    reject(
      'invalid-input',
      document.span,
      'create or replace for canvas',
      'Document mode mismatch',
    );
  if (request.snapshot?.id !== document.collection)
    reject(
      'unknown-target',
      document.span,
      'Matching collection snapshot',
      'Replacement snapshot is missing or has another identity',
    );
}
/** The host's Authoring preconditions enforce durable absence; Language enforces the declared input mode. */
function requireAbsent(document: Document, request: LowerRequest): void {
  if (request.snapshot !== null)
    reject(
      'invalid-input',
      document.span,
      'Null snapshot for create',
      'Create does not replace an existing collection',
    );
}
/** Final planning runs even for create, using a validated empty identity/theme shell as its original. */
export function lowerDocument(
  document: Document,
  request: LowerRequest,
  deps: Dependencies,
): LoweredIntent {
  checkMode(document, request);
  const mappings = sourceMappings(document.declaration);
  const raw = lowerDocumentData(document, request);
  const candidate = ownerValue(deps.reader.validate(raw), mappings, document.span);
  const shell = {
    ...candidate,
    objects: [],
    relationships: [],
    sections: [],
    assets: [],
    sources: [],
    arrangement: { ...candidate.arrangement, constraints: [] },
  };
  const original =
    request.snapshot ?? ownerValue(deps.reader.validate(shell), mappings, document.span);
  const changes = [{ op: 'replace-document', value: candidate }];
  const staged = ownerValue(deps.stage.stage(original, changes), mappings, document.span);
  const planned = ownerValue(deps.planner.plan(original, staged.changes), mappings, document.span);
  return {
    mode: request.mode,
    collection: planned.candidate,
    changes: staged.changes,
    resources: documentResources(document.declaration),
    sourceMap: mappings,
  };
}
