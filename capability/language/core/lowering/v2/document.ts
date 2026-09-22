/** Build v2 canonical RawRecord data from declare + collection; Model validates identities afterward. */
import type { Declaration, Document } from '../../../contract/records/syntax.js';
import type { LowerRequest } from '../../../contract/records/requests.js';
import { textOr, type RawRecord } from '../fields.js';
import { lowerRecord } from '../content.js';
import { lowerLayout } from '../layout.js';
import { resolveTheme } from '../resources.js';
import { reject, accepted } from '../../validation/outcomes.js';
import { constructsV2 } from '../../vocabulary/constructs-v2.js';
import { buildSymbols } from './symbols.js';
import { lowerV2Node } from './objects.js';
import { lowerV2Wire } from './relationships.js';
import { lowerV2Definitions } from './definitions.js';
import { lowerV2Section } from './sections.js';
export function lowerDocumentDataV2(document: Document, request: LowerRequest): RawRecord {
  const declare = requireDeclare(document);
  const collection = document.declaration;
  const symbols = buildSymbols(declare);
  const { uses, ...metadata } = lowerRecord(collection, constructsV2);
  void uses;
  return {
    ...metadata,
    schemaVersion: 1,
    revision: request.snapshot?.revision ?? 0,
    theme: resolveTheme(
      textOr(collection.fields, 'theme', 'paper'),
      request.resources,
      collection.span,
    ),
    arrangement: accepted(lowerLayout(collection.fields, [], 'grid')),
    objects: recordsOf(declare, 'node').map((item) => lowerV2Node(item, symbols)),
    relationships: recordsOf(declare, 'wire').map(lowerV2Wire),
    definitions: lowerV2Definitions(declare),
    sections: recordsOf(collection, 'section').map(lowerV2Section),
    sources: [],
    assets: [],
  };
}
function requireDeclare(document: Document): Declaration {
  if (document.declare === undefined)
    reject(
      'invalid-input',
      document.span,
      'declare block',
      'A canvas 2 document requires its declare block',
    );
  return document.declare;
}
function recordsOf(item: Declaration, kind: Declaration['kind']): readonly Declaration[] {
  return item.children.filter((child) => child.kind === kind);
}
