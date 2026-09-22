/** Pure document lowering is protected by Language protect; callers retain source on diagnostics and Authoring owns commit recovery. */
import type { Declaration, Document } from '../../contract/records/syntax.js';
import type { LowerRequest, LoweredIntent } from '../../contract/records/requests.js';
import type { Dependencies } from '../../contract/types.js';
import { textOr, type RawRecord } from './fields.js';
import { lowerRecord, lowerNode } from './content.js';
import { lowerSection } from './views.js';
import { lowerLayout } from './layout.js';
import { lowerAsset, resolveTheme, documentResources } from './resources.js';
import { ownerValue, documentMappings } from './diagnostics.js';
import { partitionLayout } from './layout-fields.js';
import type { Result } from '../../contract/errors.js';
import { accepted, protect, reject } from '../validation/outcomes.js';
import { lowerDefinition } from './definitions.js';
import { lowerDocumentDataV2 } from './v2/document.js';
/** Build complete raw canonical data; Model validates identities; Language owns correction and Authoring owns commit recovery. Retries have no writes. */
export function lowerDocumentData(document: Document, request: LowerRequest): Result<RawRecord> {
  return protect(() =>
    document.version === 2
      ? lowerDocumentDataV2(document, request)
      : lowerDocumentDataV1(document, request),
  );
}
/** Canvas 1 lowering: the collection declaration is both metadata and content owner. */
function lowerDocumentDataV1(document: Document, request: LowerRequest): RawRecord {
  const item = document.declaration;
  const metadata = lowerRecord(item);
  const { theme: alias, ...remaining } = partitionLayout(metadata).remaining;
  void alias;
  const theme = resolveTheme(textOr(item.fields, 'theme', 'paper'), request.resources, item.span);
  return {
    ...remaining,
    schemaVersion: 1,
    revision: request.snapshot?.revision ?? 0,
    theme,
    arrangement: accepted(lowerLayout(item.fields, item.children, 'grid')),
    objects: records(item, 'node').map(lowerNode),
    relationships: records(item, 'wire').map((wire) => lowerRecord(wire)),
    sections: records(item, 'section').map((section) => accepted(lowerSection(section))),
    sources: records(item, 'source').map((source) => lowerRecord(source)),
    assets: records(item, 'asset').map((asset) => lowerAsset(asset, request.resources)),
    definitions: records(item, 'type').map(lowerDefinition),
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
/** Plan against a validated shell for create; Language owns correction and Authoring owns commit recovery. Retries have no writes. */
export function lowerDocument(
  document: Document,
  request: LowerRequest,
  deps: Dependencies,
): Result<LoweredIntent> {
  return protect(() => {
    checkMode(document, request);
    const mappings = documentMappings(document);
    const raw = accepted(lowerDocumentData(document, request));
    const candidate = ownerValue(deps.reader.validate(raw), mappings, document.span);
    const shell = {
      ...candidate,
      objects: [],
      relationships: [],
      sections: [],
      assets: [],
      sources: [],
      definitions: [],
      changes: [],
      arrangement: { ...candidate.arrangement, constraints: [] },
    };
    const original =
      request.snapshot ?? ownerValue(deps.reader.validate(shell), mappings, document.span);
    const changes = [{ op: 'replace-document', value: candidate }];
    const staged = ownerValue(deps.stage.stage(original, changes), mappings, document.span);
    const planned = ownerValue(
      deps.planner.plan(original, staged.changes),
      mappings,
      document.span,
    );
    return {
      mode: request.mode,
      collection: planned.candidate,
      changes: staged.changes,
      resources: documentResources(document.declaration),
      sourceMap: mappings,
    };
  });
}
