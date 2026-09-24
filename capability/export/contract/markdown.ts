/*
 * Markdown review output: a read-only, human-readable summary of a collection's meaning, for
 * reviewers. It deliberately does not mirror the authoring DSL and cannot be read back.
 *
 * All authored text goes through `inline` (Markdown escaping) or `codeSpan`, so authored
 * content cannot start headings, lists, links or other Markdown structure.
 */
import {
  definitionDisplay,
  fieldTypeDisplay,
  typeUseDisplay,
  type Collection,
  type ContentBlock,
  type DiagramObject,
  type Endpoint,
  type Relationship,
  type Section,
  type SequenceItem,
  type TypeExpression,
} from '@novakai/canvas-model';

/** What to summarize: the whole collection, or one section by ID. */
export type MarkdownScope =
  { readonly kind: 'all' } | { readonly kind: 'section'; readonly id: string };

/** One object as shown in a section: the object, the groups it appears in, groups showing it. */
interface SectionObject {
  /** The canonical object, or `undefined` when the collection has no object with that ID. */
  readonly object: DiagramObject | undefined;

  /** IDs of the groups the object appears in, without repeats, in first-seen order. */
  readonly groups: readonly string[];

  /** IDs of the groups that represent the object, without repeats, in first-seen order. */
  readonly representedBy: readonly string[];
}

/** Every content-block kind. */
type BlockKind = ContentBlock['kind'];

/**
 * The member of union `B` whose `kind` includes `K`. Image and icon blocks share one member,
 * whose `kind` is `'image' | 'icon'`, so a plain `Extract` would miss them.
 */
type BlockWithKind<B, K> = B extends { readonly kind: infer BlockKinds }
  ? K extends BlockKinds
    ? B
    : never
  : never;

/** The content block of each kind, looked up by kind. */
type BlocksByKind = { [K in BlockKind]: BlockWithKind<ContentBlock, K> };

/** For each content-block kind, the function that appends a block of that kind. */
type ContentHandlers = {
  readonly [K in BlockKind]: (
    lines: string[],
    block: BlocksByKind[K],
    object: DiagramObject,
    collection: Collection,
  ) => void;
};

/**
 * Formats a collection, or one of its sections, as Markdown for review.
 *
 * The output has, in order: the title as a heading; the collection ID and revision; the
 * description when there is one; the shared type definitions (each with its resolved form when
 * Model can resolve it); the source records; then each section. Scope `all` lists sections by
 * their `order`, then by ID; scope `section` lists only that section. For each section: its ID
 * and mode, its groups, the objects it shows (with ports and content), its relationships, and
 * its sequence when it has one. Empty definitions, sources, objects and relationships parts say
 * so in italics; an empty groups part is left out. The text ends with exactly one newline.
 *
 * @param collection - A Model-valid collection.
 * @param scope - The whole collection, or one section.
 * @returns The Markdown text, or `undefined` when scope `section` names a section the
 * collection does not have.
 * @throws Never for a Model-valid collection. A throwing getter or proxy in the input
 * propagates; the service host owns that boundary.
 */
export function formatMarkdown(collection: Collection, scope: MarkdownScope): string | undefined {
  const sections = selectedSections(collection, scope);
  if (sections === undefined) return undefined;
  const objects = new Map(collection.objects.map((object) => [object.id, object]));
  const relationships = new Map(
    collection.relationships.map((relationship) => [relationship.id, relationship]),
  );
  const lines = [
    `# ${inline(collection.title)}`,
    '',
    '- Collection: `' + collection.id + '`',
    '- Revision: `' + String(collection.revision) + '`',
    '',
  ];
  if (collection.description !== undefined) {
    lines.push(...multiline(collection.description), '');
  }
  appendDefinitions(lines, collection);
  appendSources(lines, collection);
  sections.forEach((section) => appendSection(lines, section, collection, objects, relationships));
  return `${lines.join('\n').trimEnd()}\n`;
}

/**
 * The sections to format: the named one for scope `section` (`undefined` when it does not
 * exist), otherwise all sections sorted by `order`, then by ID.
 */
function selectedSections(
  collection: Collection,
  scope: MarkdownScope,
): readonly Section[] | undefined {
  if (scope.kind === 'section') return selectedSection(collection, scope.id);
  return [...collection.sections].sort(
    (left, right) => left.order - right.order || left.id.localeCompare(right.id),
  );
}

/** The section with this ID as a one-item list, or `undefined` when there is none. */
function selectedSection(collection: Collection, id: string): readonly Section[] | undefined {
  const section = collection.sections.find((candidate) => candidate.id === id);
  return section === undefined ? undefined : [section];
}

/**
 * Appends the "Shared definitions" part: each definition's ID, label and type expression, plus
 * its resolved form when Model resolves it. Model is asked first, before anything else about the
 * definition is read.
 */
function appendDefinitions(lines: string[], collection: Collection): void {
  lines.push('## Shared definitions', '');
  if (collection.definitions.length === 0) {
    lines.push('_No shared definitions are declared in this revision._', '');
    return;
  }
  collection.definitions.forEach((definition) => {
    const resolved = definitionDisplay(collection, definition.id);
    const resolvedText = resolved.ok ? `; resolved: ${inline(resolved.value)}` : '';
    const name = `- \`${definition.id}\` **${inline(definition.label)}**`;
    const type = codeSpan(typeExpression(definition.expression));
    lines.push(`${name} = ${type}${resolvedText}`);
  });
  lines.push('');
}

/** Appends the "Sources" part: one entry per source record. */
function appendSources(lines: string[], collection: Collection): void {
  lines.push('## Sources', '');
  if (collection.sources.length === 0) {
    lines.push('_No source records are attached to this revision._', '');
    return;
  }
  collection.sources.forEach((source) => appendSource(lines, source));
  lines.push('');
}

/** Appends one source: ID, URI, status, optional revision and location, optional description. */
function appendSource(lines: string[], source: Collection['sources'][number]): void {
  const location = optionalSourceDetail(source.location, ' at ');
  const revision = optionalSourceDetail(source.revision, ', revision ');
  lines.push(
    `- \`${source.id}\` **${inline(source.uri)}** (${source.status}${revision}${location})`,
  );
  if (source.description !== undefined) lines.push(`  - ${inline(source.description)}`);
}

/** `prefix` followed by the escaped value, or nothing when the value is missing. */
function optionalSourceDetail(value: string | undefined, prefix: string): string {
  return value === undefined ? '' : `${prefix}${inline(value)}`;
}

/**
 * Appends one section: heading, ID and mode, then its groups, objects, relationships, and its
 * sequence when it has sequence items.
 */
function appendSection(
  lines: string[],
  section: Section,
  collection: Collection,
  objects: ReadonlyMap<string, DiagramObject>,
  relationships: ReadonlyMap<string, Relationship>,
): void {
  lines.push(
    `## ${inline(section.title)}`,
    '',
    `- Section: \`${section.id}\``,
    `- Mode: \`${section.mode}\``,
    '',
  );
  appendGroups(lines, section);
  const sectionObjects = sectionObjectsInOrder(section, objects);
  appendObjects(lines, sectionObjects, collection);
  appendRelationships(lines, section, relationships);
  if (section.sequence.length > 0) appendSequence(lines, section, objects);
}

/** Appends the "Groups" part (nothing when the section has no groups). */
function appendGroups(lines: string[], section: Section): void {
  if (section.groups.length === 0) return;
  lines.push('### Groups', '');
  section.groups.forEach((group) => {
    const parent = group.parent === undefined ? '' : `; parent \`${group.parent}\``;
    const represents = group.represents === undefined ? '' : `; represents \`${group.represents}\``;
    lines.push(`- \`${group.id}\` **${inline(group.title)}**${parent}${represents}`);
  });
  lines.push('');
}

/**
 * The objects a section shows, in this order: objects with appearances (in appearance order),
 * then objects only represented by a group (in group order), then participants of sequence
 * events not shown any other way (in sequence order). Each object records the groups it
 * appears in and the groups representing it. IDs the collection has no object for are dropped.
 */
function sectionObjectsInOrder(
  section: Section,
  objects: ReadonlyMap<string, DiagramObject>,
): readonly SectionObject[] {
  const entries = new Map<string, SectionObject>();
  section.appearances.forEach((appearance) => {
    const existing = entries.get(appearance.object);
    const groups =
      appearance.group === undefined
        ? (existing?.groups ?? [])
        : [...(existing?.groups ?? []), appearance.group];
    entries.set(appearance.object, {
      object: objects.get(appearance.object),
      groups: unique(groups),
      representedBy: existing?.representedBy ?? [],
    });
  });
  section.groups.forEach((group) => {
    if (group.represents === undefined) return;
    const existing = entries.get(group.represents);
    entries.set(group.represents, {
      object: objects.get(group.represents),
      groups: existing?.groups ?? [],
      representedBy: unique([...(existing?.representedBy ?? []), group.id]),
    });
  });
  const ids = [...entries.keys()];
  section.sequence.forEach((item) => {
    if (item.kind !== 'event') return;
    [item.source, item.target].forEach((id) => {
      if (entries.has(id)) return;
      entries.set(id, { object: objects.get(id), groups: [], representedBy: [] });
      ids.push(id);
    });
  });
  return ids.flatMap((id) => {
    const entry = entries.get(id);
    return entry?.object === undefined ? [] : [entry];
  });
}

/** The values without repeats, in first-seen order. */
function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

/** Appends the "Canonical objects" part: one entry per shown object. */
function appendObjects(
  lines: string[],
  objects: readonly SectionObject[],
  collection: Collection,
): void {
  lines.push('### Canonical objects', '');
  if (objects.length === 0) {
    lines.push('_No canonical objects are shown in this section._', '');
    return;
  }
  objects.forEach((entry) => appendObject(lines, entry, collection));
  lines.push('');
}

/**
 * Appends one object: its heading, optional step and sources, each port, then each content
 * block. Nothing is appended for a missing object.
 */
function appendObject(lines: string[], entry: SectionObject, collection: Collection): void {
  const object = entry.object;
  if (object === undefined) return;
  lines.push(objectHeading(object, entry));
  appendOptionalObjectFields(lines, object);
  object.ports.forEach((port) =>
    lines.push(
      `  - Port \`${port.id}\`: ${port.direction} ${inline(port.label)} : ${inline(port.type)}`,
    ),
  );
  object.content.forEach((block) => appendContent(lines, block.kind, block, object, collection));
}

/** The object's heading line: ID, label, kind, role, its groups and the groups representing it. */
function objectHeading(object: DiagramObject, entry: SectionObject): string {
  const name = `- \`${object.id}\` **${inline(object.label)}**`;
  const kind = `${object.kind}${objectRole(object)}`;
  const groups = `group: ${groupList(entry)}${representedGroups(entry)}`;
  return `${name} (${kind}; ${groups})`;
}

/** `; role <role>`, or nothing for the `neutral` role. */
function objectRole(object: DiagramObject): string {
  return object.role === 'neutral' ? '' : `; role ${inline(object.role)}`;
}

/** The object's group IDs as code spans, or `ungrouped`. */
function groupList(entry: SectionObject): string {
  return entry.groups.length === 0 ? 'ungrouped' : entry.groups.map((id) => `\`${id}\``).join(', ');
}

/** `; represented by <group IDs>`, or nothing when no group represents the object. */
function representedGroups(entry: SectionObject): string {
  return entry.representedBy.length === 0
    ? ''
    : `; represented by ${entry.representedBy.map((id) => `\`${id}\``).join(', ')}`;
}

/** Appends the object's step and its source IDs, when it has them. */
function appendOptionalObjectFields(lines: string[], object: DiagramObject): void {
  if (object.step !== undefined) lines.push(`  - Step: ${object.step}`);
  if (object.sources.length > 0)
    lines.push(`  - Sources: ${object.sources.map((source) => `\`${source}\``).join(', ')}`);
}

/** The append function for each content-block kind. */
const contentHandlers: ContentHandlers = {
  text: (lines, block) => appendText(lines, block),
  code: (lines, block) => appendCode(lines, block),
  list: (lines, block) => appendList(lines, block),
  image: (lines, block) => appendAsset(lines, block),
  icon: (lines, block) => appendAsset(lines, block),
  figure: (lines, block) => appendFigure(lines, block),
  link: (lines, block) => appendLink(lines, block),
  field: (lines, block, object, collection) => appendField(lines, block, object, collection),
  keygroup: (lines, block) => appendKeyGroup(lines, block),
  signature: (lines, block, _object, collection) => appendSignature(lines, block, collection),
  member: (lines, block, _object, collection) => appendMember(lines, block, collection),
  table: (lines, block) => appendTable(lines, block),
};

/** Appends one content block with the handler for its kind (`kind` is the block's own kind). */
function appendContent<K extends BlockKind>(
  lines: string[],
  kind: K,
  block: BlocksByKind[K],
  object: DiagramObject,
  collection: Collection,
): void {
  contentHandlers[kind](lines, block, object, collection);
}

/** Appends a text block: ID, escaped text and role. */
function appendText(lines: string[], block: BlocksByKind['text']): void {
  lines.push(`  - Text \`${block.id}\`: ${inline(block.text)} (${block.role})`);
}

/**
 * Appends a code block: its ID, its language metadata when present, then the code inside a
 * fence longer than any backtick run in it. Line endings are normalized to `\n`.
 */
function appendCode(lines: string[], block: BlocksByKind['code']): void {
  const fence = codeFence(block.text);
  lines.push(`  - Code \`${block.id}\`:`);
  if (block.language !== undefined) {
    lines.push('    Language metadata:');
    lines.push(...multiline(block.language).map((line) => `      ${line}`));
  }
  lines.push(`    ${fence}`);
  lines.push(
    ...block.text
      .replaceAll('\r\n', '\n')
      .replaceAll('\r', '\n')
      .split('\n')
      .map((line) => `    ${line}`),
  );
  lines.push(`    ${fence}`);
}

/** Appends an image or icon block: kind, ID, asset ID, fit and size. */
function appendAsset(lines: string[], block: BlocksByKind['image']): void {
  lines.push(
    `  - ${block.kind} \`${block.id}\`: asset \`${block.asset}\` (${block.fit}, ${block.size})`,
  );
}

/** Appends a figure block: ID, form and every other field as `key=value`. */
function appendFigure(lines: string[], block: BlocksByKind['figure']): void {
  lines.push(`  - Figure \`${block.id}\`: ${block.form} (${figureDetails(block)})`);
}

/** Appends a link block: ID, escaped label and target. */
function appendLink(lines: string[], block: BlocksByKind['link']): void {
  lines.push(`  - Link \`${block.id}\`: ${inline(block.label)} → ${linkTarget(block.target)}`);
}

/**
 * Appends a signature block: ID, label, parameters (a bare name, or `name: type` with the type
 * shown by Model) and return type.
 */
function appendSignature(
  lines: string[],
  block: BlocksByKind['signature'],
  collection: Collection,
): void {
  const parameterText = block.parameters.map((parameter) =>
    typeof parameter === 'string'
      ? inline(parameter)
      : `${inline(parameter.name)}: ${inline(typeUseDisplay(collection, parameter.type))}`,
  );
  const returns = inline(typeUseDisplay(collection, block.returns));
  const name = `  - Signature \`${block.id}\`: ${inline(block.label)}`;
  lines.push(`${name}(${parameterText.join(', ')}) → ${returns}`);
}

/** Appends a member block: ID, visibility, label and the type shown by Model. */
function appendMember(
  lines: string[],
  block: BlocksByKind['member'],
  collection: Collection,
): void {
  const name = `  - Member \`${block.id}\`: ${block.visibility} ${inline(block.label)}`;
  const type = inline(typeUseDisplay(collection, block.type));
  lines.push(`${name} : ${type}`);
}

/** Appends a list block's heading, then each item (numbered from 1 when the list is ordered). */
function appendList(lines: string[], block: BlocksByKind['list']): void {
  lines.push(`  - ${block.ordered ? 'Ordered' : 'Unordered'} list \`${block.id}\`:`);
  block.items.forEach((item, index) => appendListItem(lines, item, index, block.ordered));
}

/** Appends one list item, with `<n>. ` in front for an ordered list. */
function appendListItem(lines: string[], item: string, index: number, ordered: boolean): void {
  const marker = ordered ? `${index + 1}. ` : '';
  lines.push(`    - ${marker}${inline(item)}`);
}

/** Appends a field block: `<object>.<field>` ID, label, type, then key, nullable and reference. */
function appendField(
  lines: string[],
  block: BlocksByKind['field'],
  object: DiagramObject,
  collection: Collection,
): void {
  const type = fieldType(collection, block);
  const details = fieldDetails(block);
  lines.push(`  - Field \`${object.id}.${block.id}\`: ${inline(block.label)} : ${type}${details}`);
}

/** The field's type as shown by Model, plus the definition ID when it uses a shared definition. */
function fieldType(collection: Collection, block: BlocksByKind['field']): string {
  const display = fieldTypeDisplay(collection, block);
  if (typeof block.type === 'string') return inline(display);
  return `${inline(display)} (definition ${codeSpan(block.type.id)})`;
}

/** `, <key>, nullable, references <endpoint>` with only the parts the field has; or nothing. */
function fieldDetails(block: BlocksByKind['field']): string {
  const details = [fieldKey(block), fieldNullable(block), fieldReference(block)].filter(
    (value): value is string => value !== undefined,
  );
  return details.length === 0 ? '' : `, ${details.join(', ')}`;
}

/** The field's key kind, if any. */
function fieldKey(block: BlocksByKind['field']): string | undefined {
  return block.key;
}

/** `nullable` when the field is nullable. */
function fieldNullable(block: BlocksByKind['field']): string | undefined {
  return block.nullable ? 'nullable' : undefined;
}

/** `references <endpoint>` when the field references another field. */
function fieldReference(block: BlocksByKind['field']): string | undefined {
  return block.references === undefined ? undefined : `references ${endpoint(block.references)}`;
}

/** Appends a key group: ID, key kind, field IDs and the referenced endpoints when present. */
function appendKeyGroup(lines: string[], block: BlocksByKind['keygroup']): void {
  const references =
    block.references === undefined
      ? ''
      : `; references ${block.references.map(endpoint).join(', ')}`;
  const name = `  - Key group \`${block.id}\`: ${block.key}`;
  const fields = block.fields.map((field) => `\`${field}\``).join(', ');
  lines.push(`${name} [${fields}]${references}`);
}

/** Appends a table block: ID and column names, then each row's ID and cells. */
function appendTable(lines: string[], block: BlocksByKind['table']): void {
  lines.push(`  - Table \`${block.id}\`: ${block.columns.map(inline).join(' | ')}`);
  block.rows.forEach((row) =>
    lines.push(`    - \`${row.id}\`: ${row.cells.map(inline).join(' | ')}`),
  );
}

/** Appends the "Relationships" part: one entry per wire in the section. */
function appendRelationships(
  lines: string[],
  section: Section,
  relationships: ReadonlyMap<string, Relationship>,
): void {
  lines.push('### Relationships', '');
  if (section.wires.length === 0) {
    lines.push('_No relationships are wired in this section._', '');
    return;
  }
  section.wires.forEach((wire) => appendWire(lines, wire, relationships));
  lines.push('');
}

/**
 * Appends one wire: the relationship's ID, label, kind, endpoints, cardinality, guard and
 * effect, then the wire's route kind and whether it is locked. A wire whose relationship does not
 * exist is listed as missing.
 */
function appendWire(
  lines: string[],
  wire: Section['wires'][number],
  relationships: ReadonlyMap<string, Relationship>,
): void {
  const relationship = relationships.get(wire.relationship);
  if (relationship === undefined) {
    lines.push(`- Missing canonical relationship \`${wire.relationship}\``);
    return;
  }
  const details = relationshipDetails(relationship);
  const name = `- \`${relationship.id}\` **${inline(relationship.label)}** (${relationship.kind})`;
  const ends = `${endpoint(relationship.source)} → ${endpoint(relationship.target)}`;
  const route = `${wire.route} wire${wire.locked ? ', locked' : ''}`;
  lines.push(`${name} ${ends}${details}; ${route}`);
}

/** The relationship's cardinality, guard and effect parts, each only when present. */
function relationshipDetails(relationship: Relationship): string {
  return [
    relationshipCardinality(relationship),
    optionalRelationshipDetail(relationship.guard, 'guard'),
    optionalRelationshipDetail(relationship.effect, 'effect'),
  ].join('');
}

/** `; cardinality <from> → <to>` (`?` for a missing side), or nothing when both are missing. */
function relationshipCardinality(relationship: Relationship): string {
  if (relationship.from === undefined && relationship.to === undefined) return '';
  return `; cardinality ${relationship.from ?? '?'} → ${relationship.to ?? '?'}`;
}

/** `; <label> <value>`, or nothing when the value is missing. */
function optionalRelationshipDetail(value: string | undefined, label: string): string {
  return value === undefined ? '' : `; ${label} ${inline(value)}`;
}

/**
 * Appends the "Sequence" part: the items as a tree (top level first, fragments with their
 * branches nested), then any item the tree did not reach, listed as unplaced.
 */
function appendSequence(
  lines: string[],
  section: Section,
  objects: ReadonlyMap<string, DiagramObject>,
): void {
  lines.push('### Sequence', '');
  const rendered = new Set<string>();
  appendSequenceItems(lines, section.sequence, undefined, undefined, 0, rendered, objects);
  section.sequence.forEach((item) => {
    if (!rendered.has(item.id))
      lines.push(`- Unplaced sequence item \`${item.id}\` (${item.kind})`);
  });
  lines.push('');
}

/**
 * Appends the items whose parent and branch match, sorted by `order`, then by ID, at `depth`.
 * Each appended item's ID is added to `rendered`.
 */
function appendSequenceItems(
  lines: string[],
  items: readonly SequenceItem[],
  parent: string | undefined,
  branch: string | undefined,
  depth: number,
  rendered: Set<string>,
  objects: ReadonlyMap<string, DiagramObject>,
): void {
  const children = items
    .filter((item) => item.parent === parent && item.branch === branch)
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  children.forEach((item) => appendSequenceItem(lines, items, item, depth, rendered, objects));
}

/**
 * Appends one sequence item: an event line, or a fragment line followed by its branches (each
 * with its own items two levels deeper) or, without branches, its items one level deeper.
 */
function appendSequenceItem(
  lines: string[],
  items: readonly SequenceItem[],
  item: SequenceItem,
  depth: number,
  rendered: Set<string>,
  objects: ReadonlyMap<string, DiagramObject>,
): void {
  rendered.add(item.id);
  const prefix = `${'  '.repeat(depth)}- `;
  if (item.kind === 'event') {
    appendEvent(lines, prefix, item, objects);
    return;
  }
  lines.push(`${prefix}\`${item.id}\` **${item.operator}** ${inline(item.label)}`);
  if (item.branches.length > 0) {
    item.branches.forEach((sequenceBranch) => {
      const indent = '  '.repeat(depth + 1);
      lines.push(`${indent}- Branch \`${sequenceBranch.id}\`: ${inline(sequenceBranch.label)}`);
      appendSequenceItems(lines, items, item.id, sequenceBranch.id, depth + 2, rendered, objects);
    });
    return;
  }
  appendSequenceItems(lines, items, item.id, undefined, depth + 1, rendered, objects);
}

/**
 * Appends one event: ID, source → target (object labels when known), label, message kind,
 * activation change and the operation it calls, when present.
 */
function appendEvent(
  lines: string[],
  prefix: string,
  item: Extract<SequenceItem, { kind: 'event' }>,
  objects: ReadonlyMap<string, DiagramObject>,
): void {
  const source = sequenceEndpoint(objects, item.source);
  const target = sequenceEndpoint(objects, item.target);
  const activation = activationDetail(item.activate);
  const operation = item.operation === undefined ? '' : `; operation ${endpoint(item.operation)}`;
  const name = `${prefix}\`${item.id}\` ${source} → ${target}`;
  lines.push(`${name}: **${inline(item.label)}** (${item.message}${activation}${operation})`);
}

/** The participant as `<label> (<ID>)`, or just the ID when there is no such object. */
function sequenceEndpoint(objects: ReadonlyMap<string, DiagramObject>, id: string): string {
  const label = objects.get(id)?.label;
  return label === undefined ? codeSpan(id) : `${inline(label)} (${codeSpan(id)})`;
}

/** `; activate`, `; deactivate`, or nothing when the event does not change activation. */
function activationDetail(value: boolean | undefined): string {
  if (value === undefined) return '';
  return value ? '; activate' : '; deactivate';
}

/** An endpoint as a code span: `object` or `object.member`. */
function endpoint(value: Endpoint): string {
  return value.member === undefined ? `\`${value.object}\`` : `\`${value.object}.${value.member}\``;
}

/** A link target: the escaped URI, or the object ID with its section when given. */
function linkTarget(target: BlocksByKind['link']['target']): string {
  if (target.kind === 'uri') return inline(target.uri);
  const section = target.section === undefined ? '' : ` in \`${target.section}\``;
  return `\`${target.id}\`${section}`;
}

/** Every figure field except `kind`, `id` and `form`, as `key=value`, in the record's key order. */
function figureDetails(block: BlocksByKind['figure']): string {
  return Object.entries(block)
    .filter(([key]) => key !== 'kind' && key !== 'id' && key !== 'form')
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(', ');
}

/**
 * A type expression as text: a primitive name, a JSON literal, `@<definition ID>` for a
 * reference, or the items of a union joined by ` | `.
 */
function typeExpression(expression: TypeExpression): string {
  switch (expression.kind) {
    case 'primitive':
      return expression.name;
    case 'literal':
      return JSON.stringify(expression.value);
    case 'reference':
      return `@${expression.id}`;
    case 'union':
      return expression.items.map(typeExpression).join(' | ');
  }
}

/**
 * Escapes authored text for inline Markdown. Backslash and the characters
 * `` ` * _ # > < & [ ] ( ) = ~ `` get a backslash. Line endings become `\n`, and each new line is
 * indented two spaces so it stays inside its list item. A line that would start a heading,
 * quote, list item or thematic break gets its marker escaped too.
 */
function inline(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('`', '\\`')
    .replaceAll('*', '\\*')
    .replaceAll('_', '\\_')
    .replaceAll('#', '\\#')
    .replaceAll('>', '\\>')
    .replaceAll('<', '\\<')
    .replaceAll('&', '\\&')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replaceAll('=', '\\=')
    .replaceAll('~', '\\~')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .replaceAll('\n', '\n  ')
    .replace(/^([ \t]*)(#{1,6}|>|[-+*]|\d+[.)])(?=\s)/gm, '$1\\$2')
    .replace(
      /^([ \t]*)([-=*_~])\2*\s*$/gm,
      (line, indent) => `${indent}\\${line.slice(indent.length)}`,
    );
}

/** The escaped text split into lines. */
function multiline(value: string): readonly string[] {
  return inline(value).split('\n');
}

/**
 * The value as an inline code span, fenced with more backticks than its longest backtick run,
 * and padded with a space when it starts or ends with a backtick.
 */
function codeSpan(value: string): string {
  const fence = inlineCodeFence(value);
  const padding = value.startsWith('`') || value.endsWith('`') ? ' ' : '';
  return `${fence}${padding}${value}${padding}${fence}`;
}

/** Backticks one longer than the value's longest backtick run (at least one). */
function inlineCodeFence(value: string): string {
  const runs = value.match(/`+/g) ?? [];
  const longest = runs.reduce((length, run) => Math.max(length, run.length), 0);
  return '`'.repeat(Math.max(1, longest + 1));
}

/** Backticks one longer than the value's longest backtick run (at least three), for a block. */
function codeFence(value: string): string {
  const runs = value.match(/`+/g) ?? [];
  const longest = runs.reduce((length, run) => Math.max(length, run.length), 0);
  return '`'.repeat(Math.max(3, longest + 1));
}
