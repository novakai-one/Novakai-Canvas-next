/*
 * The attribute vocabulary: for each property, its value form (`type`), the Model field it
 * lowers to (`field`), its allowed words (`values`), whether a declaration must write it
 * (`required`; patches do not check it), and the value used when it is left out (`fallback`).
 * Parsing, lowering, patching, printing and `describe` all read these tables. Plain data:
 * nothing here runs. Language owns correcting the source; Authoring owns commit recovery.
 */
import type { Property } from '../../contract/records/vocabulary.js';
import { nodeKinds, relationshipKinds } from './defaults.js';

/**
 * Every property, by name. Constructs pick from this table and may give an entry another
 * attribute name (for example `wireKind` is written `kind=` on a wire).
 */
export const properties = {
  /** A collection's theme. */
  theme: { type: 'word', field: 'theme', fallback: 'paper' },
  /** Free description text (collection, source). */
  description: { type: 'string', field: 'description' },
  /** A visual role word (node, group, a section's `show` entry). */
  role: { type: 'word', field: 'role' },
  /** A size (node, image, icon, figure, a section's `show` entry). */
  size: { type: 'word', field: 'size', values: ['small', 'medium', 'large'] },
  /** A step number (node, wire). */
  step: { type: 'integer', field: 'step' },
  /** A node's frame. */
  frame: { type: 'word', field: 'frame', values: ['auto', 'none', 'card', 'panel'] },
  /** A group's frame; the same field without `card`. */
  containerFrame: { type: 'word', field: 'frame', values: ['auto', 'none', 'panel'] },
  /** How a node arranges its media and text. */
  composition: { type: 'word', field: 'composition', values: ['stack', 'media-top', 'media-left'] },
  /** A text block's role. */
  textRole: { type: 'word', field: 'role', values: ['body', 'caption', 'annotation'] },
  /** The sources behind a node or wire, as plain IDs. */
  sources: { type: 'ids', field: 'sources' },
  /** A layout algorithm, written `layout=` and stored as `algorithm`. */
  layout: {
    type: 'word',
    field: 'algorithm',
    values: ['flow', 'layered', 'tree', 'sequence', 'grid'],
  },
  /** A layout direction. */
  direction: {
    type: 'word',
    field: 'direction',
    values: ['right', 'down', 'left', 'up'],
    fallback: 'right',
  },
  /** A layout spacing. */
  gap: { type: 'word', field: 'gap', values: ['compact', 'normal', 'roomy'], fallback: 'normal' },
  /** A section's diagram mode. */
  mode: {
    type: 'word',
    field: 'mode',
    values: ['flow', 'er', 'modules', 'tree', 'sequence', 'state', 'story', 'grid'],
    fallback: 'flow',
  },
  /** A section's position among sections. */
  order: { type: 'integer', field: 'order', fallback: 0 },
  /** An asset's source (required). */
  source: { type: 'string', field: 'source', required: true },
  /** An asset's alternative text. */
  alt: { type: 'string', field: 'alt' },
  /** An asset's license. */
  license: { type: 'string', field: 'license' },
  /** An asset's attribution. */
  attribution: { type: 'string', field: 'attribution' },
  /** A source's revision. */
  revision: { type: 'string', field: 'revision' },
  /** Where inside a source the evidence is. */
  location: { type: 'string', field: 'location' },
  /** How well a source backs its claim. */
  status: {
    type: 'word',
    field: 'status',
    values: ['asserted', 'source-backed', 'unverified'],
    fallback: 'unverified',
  },
  /** A code block's language. */
  language: { type: 'string', field: 'language' },
  /** A link block's target: text such as a URL, or a plain ID (required). */
  target: { type: 'link', field: 'target', required: true },
  /** A link block's section. */
  section: { type: 'id', field: 'section' },
  /** Whether a list block is numbered. */
  ordered: { type: 'boolean', field: 'ordered', fallback: false },
  /** The asset an image or icon block shows (required). */
  asset: { type: 'id', field: 'asset', required: true },
  /** How an image fits its box. */
  fit: { type: 'word', field: 'fit', values: ['contain', 'cover'], fallback: 'contain' },
  /** A figure's level, written `level=`. */
  figureLevel: { type: 'word', field: 'level', values: ['low', 'half', 'full'] },
  /** A figure's fill, written `fill=`. */
  figureFill: { type: 'word', field: 'fill', values: ['low', 'half', 'full'] },
  /** A figure's `pass` setting. */
  pass: { type: 'word', field: 'pass', values: ['one', 'few'] },
  /** A figure's `layers` setting. */
  layers: { type: 'word', field: 'layers', values: ['few', 'some', 'many'] },
  /** Whether a figure shows an agitator. */
  agitator: { type: 'boolean', field: 'agitator' },
  /** A figure's mark. */
  mark: { type: 'word', field: 'mark', values: ['none', 'check', 'shield'] },
  /** Whether a figure shows debris. */
  debris: { type: 'word', field: 'debris', values: ['none', 'some'] },
  /** A type: text or a plain ID (field, member, port; required). */
  type: { type: 'type-expression', field: 'type', required: true },
  /** A field's key. */
  key: { type: 'word', field: 'key', values: ['primary', 'foreign', 'unique'] },
  /** Whether a field may be empty. */
  nullable: { type: 'boolean', field: 'nullable', fallback: false },
  /** The field a field refers to. */
  references: { type: 'endpoint', field: 'references' },
  /** A key group's kind, written `kind=` (required). */
  keyKind: { type: 'word', field: 'key', values: ['primary', 'foreign', 'unique'], required: true },
  /** A key group's fields (required). */
  fields: { type: 'ids', field: 'fields', required: true },
  /** The fields a key group refers to, written `references=`. */
  referenceList: { type: 'endpoints', field: 'references' },
  /** A signature's parameters (required). */
  parameters: { type: 'signature-parameters', field: 'parameters', required: true },
  /** A signature's return type (required). */
  returns: { type: 'type-expression', field: 'returns', required: true },
  /** A member's visibility. */
  visibility: {
    type: 'word',
    field: 'visibility',
    values: ['public', 'private', 'protected'],
    fallback: 'public',
  },
  /** A table's column headings (required). */
  columns: { type: 'strings', field: 'columns', required: true },
  /** A table row's cells (required). */
  cells: { type: 'strings', field: 'cells', required: true },
  /** A wire's kind, written `kind=`. */
  wireKind: { type: 'word', field: 'kind', values: relationshipKinds, fallback: 'flow' },
  /** A node's kind (required). */
  nodeKind: { type: 'word', field: 'kind', values: nodeKinds, required: true },
  /** The cardinality at a wire's start. */
  from: { type: 'word', field: 'from', values: ['0..1', '1', '0..many', '1..many'] },
  /** The cardinality at a wire's end. */
  to: { type: 'word', field: 'to', values: ['0..1', '1', '0..many', '1..many'] },
  /** A wire's guard, as on a state transition. */
  guard: { type: 'string', field: 'guard' },
  /** A wire's effect, as on a state transition. */
  effect: { type: 'string', field: 'effect' },
  /** A wire's line style. */
  style: { type: 'word', field: 'style', values: ['solid', 'dashed'], fallback: 'solid' },
  /** How much of an object a section's `show` entry displays. */
  detail: { type: 'word', field: 'detail', values: ['full', 'summary', 'label'], fallback: 'full' },
  /** How an object shown in a section takes part in it. */
  participation: { type: 'word', field: 'participation', values: ['tree', 'annotation'] },
  /** A section `connect` entry's route shape. */
  route: { type: 'word', field: 'route', values: ['orthogonal', 'curve'], fallback: 'orthogonal' },
  /** The side a connection leaves from. */
  sourceSide: {
    type: 'word',
    field: 'sourceSide',
    values: ['auto', 'top', 'right', 'bottom', 'left'],
    fallback: 'auto',
  },
  /** The side a connection arrives at. */
  targetSide: {
    type: 'word',
    field: 'targetSide',
    values: ['auto', 'top', 'right', 'bottom', 'left'],
    fallback: 'auto',
  },
  /** The object a group stands for. */
  represents: { type: 'id', field: 'represents' },
  /** A sequence event's message kind, written `kind=`. */
  message: {
    type: 'word',
    field: 'message',
    values: ['call', 'return', 'async'],
    fallback: 'call',
  },
  /** Whether a sequence event activates its target. */
  activate: { type: 'boolean', field: 'activate' },
  /** The operation a sequence event calls. */
  operation: { type: 'endpoint', field: 'operation' },
} as const satisfies Readonly<Record<string, Property>>;

/**
 * The layout properties of a collection or section. Here `columns` is a number of grid tracks,
 * unlike a table's `columns`, which is a list of headings.
 */
export const layoutProperties = {
  columns: { type: 'integer', field: 'columns' },
  layout: properties.layout,
  direction: properties.direction,
  gap: properties.gap,
} as const satisfies Readonly<Record<string, Property>>;
