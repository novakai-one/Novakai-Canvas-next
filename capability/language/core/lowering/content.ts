import type { Declaration } from '../../contract/records/syntax.js';
import { constructs } from '../vocabulary/constructs.js';
import { isReference } from '../parsing/value-types.js';
import { reject } from '../validation/outcomes.js';
import { field, id, text, optional, type RawRecord } from './fields.js';
import { mapDeclaredProperties, lowerValue } from './properties.js';
/** Common position/property projection is driven by the grammar's one mapping table. */
export function lowerRecord(declaration: Declaration): RawRecord {
  const definition = constructs.find((item) => item.kind === declaration.kind);
  if (definition === undefined)
    reject('invalid-input', declaration.span, 'Shipped construct', 'Unknown parsed construct');
  const positions = definition.positions.filter((item) => item.name !== 'arrow');
  const entries = positions.flatMap((item) => {
    const value = declaration.fields[item.name];
    if (value === undefined) return [];
    return [[item.name, lowerValue(value.value, item.type)]];
  });
  return {
    ...Object.fromEntries(entries),
    ...mapDeclaredProperties(declaration.fields, definition.properties),
  };
}
/** Content shape comes from its explicit construct, with links and tables handled by their own payload. */
export function lowerContent(declaration: Declaration): RawRecord {
  if (declaration.kind === 'link') return lowerLink(declaration);
  if (declaration.kind === 'table') return lowerTable(declaration);
  return { kind: declaration.kind, ...lowerRecord(declaration) };
}
/** Local navigation is an object reference; quoted navigation remains an inert URI. */
function lowerLink(declaration: Declaration): RawRecord {
  const value = field(declaration.fields, 'target').value;
  if (isReference(value))
    return {
      kind: 'link',
      id: id(declaration.fields),
      label: text(declaration.fields, 'label'),
      target: { kind: 'object', id: value.id, ...optionalSection(declaration) },
    };
  return {
    kind: 'link',
    id: id(declaration.fields),
    label: text(declaration.fields, 'label'),
    target: { kind: 'uri', uri: value },
  };
}
/** Row order and row identities are retained; Model checks descendant uniqueness and column count. */
function lowerTable(declaration: Declaration): RawRecord {
  return {
    kind: 'table',
    ...lowerRecord(declaration),
    rows: declaration.children.map(lowerRecord),
  };
}
/** Canonical content and port compartments each retain their declaration order. */
export function lowerNode(declaration: Declaration): RawRecord {
  return {
    ...lowerRecord(declaration),
    content: declaration.children.filter((item) => item.kind !== 'port').map(lowerContent),
    ports: declaration.children.filter((item) => item.kind === 'port').map(lowerRecord),
  };
}

/** Local link section is optional; absence remains distinct from an invalid selector. */
function optionalSection(declaration: Declaration): RawRecord {
  if (declaration.fields.section === undefined) return {};
  return optional('section', id(declaration.fields, 'section'));
}
