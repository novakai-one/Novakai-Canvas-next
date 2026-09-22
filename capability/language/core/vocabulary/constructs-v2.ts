import type { ConstructDefinition } from '../../contract/records/vocabulary.js';
import { properties as p } from './properties.js';
import { nodeKindsV2 } from './defaults.js';
/** Change ops share one shape: a bare list of node, wire or @node.@member refs. */
function changeOp(kind: 'new' | 'changed' | 'deleted' | 'locked'): ConstructDefinition {
  return { kind, positions: [{ name: 'refs', type: 'endpoints' }], properties: {}, children: null };
}
/** Closed v2 grammar skeleton; parsed only, not yet lowered. */
export const constructsV2: readonly ConstructDefinition[] = [
  {
    kind: 'declare',
    positions: [{ name: 'id', type: 'id' }],
    properties: {},
    children: ['type', 'node', 'wire', 'scenario', 'change'],
    body: 'required',
  },
  {
    kind: 'change',
    positions: [
      { name: 'id', type: 'id' },
      { name: 'title', type: 'string' },
    ],
    properties: {},
    children: ['new', 'changed', 'deleted', 'locked'],
    body: 'required',
  },
  changeOp('new'),
  changeOp('changed'),
  changeOp('deleted'),
  changeOp('locked'),
  {
    kind: 'collection',
    positions: [
      { name: 'id', type: 'id' },
      { name: 'title', type: 'string' },
    ],
    properties: { uses: p.uses, description: p.description },
    children: ['section'],
    body: 'required',
  },
  {
    kind: 'section',
    positions: [
      { name: 'id', type: 'id' },
      { name: 'title', type: 'string' },
    ],
    properties: { mode: p.mode },
    children: ['show', 'connect'],
    body: 'required',
  },
  {
    kind: 'show',
    positions: [{ name: 'ids', type: 'references' }],
    properties: {},
    children: ['show'],
    body: 'optional',
  },
  {
    kind: 'connect',
    positions: [{ name: 'ids', type: 'references' }],
    properties: {},
    children: null,
  },
  {
    kind: 'node',
    positions: [
      { name: 'id', type: 'id' },
      { name: 'kind', type: 'word', values: nodeKindsV2 },
      { name: 'label', type: 'string', optional: true },
    ],
    properties: {},
    children: ['field', 'signature', 'type', 'keygroup'],
    body: 'optional',
  },
  {
    kind: 'wire',
    positions: [
      { name: 'id', type: 'id' },
      { name: 'source', type: 'endpoint' },
      { name: 'arrow', type: 'word', literal: '->' },
      { name: 'target', type: 'endpoint' },
      { name: 'label', type: 'string', optional: true },
    ],
    properties: {
      kind: p.wireKindV2,
      from: p.from,
      to: p.to,
      guard: p.guard,
      effect: p.effect,
    },
    children: null,
  },
  {
    kind: 'type',
    positions: [
      { name: 'ids', type: 'references' },
      { name: 'expression', type: 'literal-union', optional: true },
    ],
    properties: {},
    children: null,
  },
  {
    kind: 'field',
    positions: [
      { name: 'id', type: 'id' },
      { name: 'colon', type: 'word', literal: ':' },
      { name: 'type', type: 'type-use' },
    ],
    properties: { key: p.key, references: p.references },
    children: null,
  },
  {
    kind: 'signature',
    positions: [{ name: 'id', type: 'id' }],
    properties: { parameters: p.parametersV2, returns: p.returnsV2 },
    children: null,
  },
  {
    kind: 'scenario',
    positions: [
      { name: 'id', type: 'id' },
      { name: 'title', type: 'string' },
    ],
    properties: {},
    children: ['call', 'alt'],
    body: 'required',
  },
  {
    kind: 'call',
    positions: [
      { name: 'source', type: 'id' },
      { name: 'arrow', type: 'word', literal: '->' },
      { name: 'target', type: 'endpoint' },
      { name: 'returns', type: 'word', values: ['returns'], optional: true },
    ],
    properties: {},
    children: null,
  },
  {
    kind: 'alt',
    positions: [{ name: 'label', type: 'string' }],
    properties: {},
    children: ['call', 'alt'],
    body: 'required',
  },
  {
    kind: 'keygroup',
    positions: [{ name: 'id', type: 'id' }],
    properties: { kind: p.keyKindV2, fields: p.fields },
    children: null,
  },
];
