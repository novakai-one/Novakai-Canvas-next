/*
 * The patch vocabulary: which properties `set` and `unset` may change on each target, and the
 * words that start an operation. A patch edits only these plain values; changing a kind, an ID,
 * a group or a section membership needs a `replace` or a membership operation instead. Plain
 * data: nothing here runs. Language owns correcting the source; Authoring owns commit recovery.
 */
import type { TargetKind } from '../../contract/records/syntax.js';
import type { Property } from '../../contract/records/vocabulary.js';
import { properties as p, layoutProperties } from './properties.js';

/** A node, wire or block label. `required`: a patch cannot `unset` it. */
const label: Property = { type: 'string', field: 'label', required: true };

/** A collection or section title. `required`: a patch cannot `unset` it. */
const title: Property = { type: 'string', field: 'title', required: true };

/**
 * The properties `set` and `unset` accept, by target. The attribute name is the key; `asset`,
 * `source` and `layout` have none. Patching also uses these tables to lower values, and printing
 * uses the `appearance` and `route` tables for a section's `show` and `connect` entries.
 */
export const patchProperties: Readonly<Record<TargetKind, Readonly<Record<string, Property>>>> = {
  collection: { title, description: p.description, theme: p.theme, ...layoutProperties },
  node: {
    label,
    role: p.role,
    size: p.size,
    frame: p.frame,
    composition: p.composition,
    step: p.step,
    sources: p.sources,
  },
  wire: {
    label,
    step: p.step,
    from: p.from,
    to: p.to,
    guard: p.guard,
    effect: p.effect,
    style: p.style,
    sources: p.sources,
    'from-end': { type: 'endpoint', field: 'source', required: true },
    'to-end': { type: 'endpoint', field: 'target', required: true },
  },
  section: { title, mode: p.mode, order: p.order, ...layoutProperties },
  appearance: {
    role: p.role,
    size: p.size,
    frame: p.frame,
    composition: p.composition,
    detail: p.detail,
    participation: p.participation,
  },
  route: { route: p.route, 'source-side': p.sourceSide, 'target-side': p.targetSide },
  block: {
    label,
    role: p.textRole,
    text: { type: 'string', field: 'text', required: true },
    items: { type: 'strings', field: 'items', required: true },
    language: p.language,
    target: p.target,
    section: p.section,
    ordered: p.ordered,
    asset: p.asset,
    size: p.size,
    fit: p.fit,
    level: p.figureLevel,
    fill: p.figureFill,
    pass: p.pass,
    layers: p.layers,
    agitator: p.agitator,
    mark: p.mark,
    debris: p.debris,
    type: p.type,
    key: p.key,
    nullable: p.nullable,
    references: { type: 'reference-value', field: 'references' },
    parameters: p.parameters,
    returns: p.returns,
    visibility: p.visibility,
  },
  asset: {},
  source: {},
  layout: {},
};

/**
 * The words that start a patch operation. Reading `unset` property names stops at the first of
 * these, an unknown operation's diagnostic lists them, and `describe` publishes them.
 */
export const operationWords = [
  'add',
  'set',
  'unset',
  'replace',
  'show',
  'hide',
  'connect',
  'disconnect',
  'remove',
  'move',
  'delete',
  'reset',
];
