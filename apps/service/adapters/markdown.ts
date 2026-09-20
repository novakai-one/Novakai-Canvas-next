import {
  definitionDisplay,
  fieldTypeDisplay,
  type Collection,
  type ContentBlock,
  type DiagramObject,
  type Endpoint,
  type Relationship,
  type Section,
  type SequenceItem,
  type TypeExpression,
} from '@novakai/canvas-model';

export type MarkdownScope =
  { readonly kind: 'all' } | { readonly kind: 'section'; readonly id: string };

/** Read-only semantic review output. This deliberately does not mirror the authoring DSL. */
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
  if (collection.description !== undefined) lines.push(collection.description, '');
  appendDefinitions(lines, collection);
  appendSources(lines, collection);
  sections.forEach((section) => appendSection(lines, section, collection, objects, relationships));
  return `${lines.join('\n').trimEnd()}\n`;
}

function selectedSections(
  collection: Collection,
  scope: MarkdownScope,
): readonly Section[] | undefined {
  return scope.kind === 'section'
    ? selectedSection(collection, scope.id)
    : [...collection.sections].sort(
        (left, right) => left.order - right.order || left.id.localeCompare(right.id),
      );
}

function selectedSection(collection: Collection, id: string): readonly Section[] | undefined {
  const section = collection.sections.find((candidate) => candidate.id === id);
  return section === undefined ? undefined : [section];
}

function appendDefinitions(lines: string[], collection: Collection): void {
  lines.push('## Shared definitions', '');
  if (collection.definitions.length === 0) {
    lines.push('_No shared definitions are declared in this revision._', '');
    return;
  }
  collection.definitions.forEach((definition) => {
    const resolved = definitionDisplay(collection, definition.id);
    const resolvedText = resolved.ok ? `; resolved: ${inline(resolved.value)}` : '';
    lines.push(
      `- \`${definition.id}\` **${inline(definition.label)}** = \`${typeExpression(definition.expression)}\`${resolvedText}`,
    );
  });
  lines.push('');
}

function appendSources(lines: string[], collection: Collection): void {
  lines.push('## Sources', '');
  if (collection.sources.length === 0) {
    lines.push('_No source records are attached to this revision._', '');
    return;
  }
  collection.sources.forEach((source) => appendSource(lines, source));
  lines.push('');
}

function appendSource(lines: string[], source: Collection['sources'][number]): void {
  const location = optionalSourceDetail(source.location, ' at ');
  const revision = optionalSourceDetail(source.revision, ', revision ');
  lines.push(
    `- \`${source.id}\` **${inline(source.uri)}** (${source.status}${revision}${location})`,
  );
  if (source.description !== undefined) lines.push(`  - ${inline(source.description)}`);
}

function optionalSourceDetail(value: string | undefined, prefix: string): string {
  return value === undefined ? '' : `${prefix}${inline(value)}`;
}

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

function sectionObjectsInOrder(
  section: Section,
  objects: ReadonlyMap<string, DiagramObject>,
): readonly DiagramObject[] {
  const ids = section.appearances.map((appearance) => appearance.object);
  section.groups.forEach((group) => {
    if (group.represents !== undefined) ids.push(group.represents);
  });
  section.sequence.forEach((item) => {
    if (item.kind === 'event') ids.push(item.source, item.target);
  });
  const seen = new Set<string>();
  return ids.flatMap((id) => {
    if (seen.has(id)) return [];
    seen.add(id);
    const object = objects.get(id);
    return object === undefined ? [] : [object];
  });
}

function appendObjects(
  lines: string[],
  objects: readonly DiagramObject[],
  collection: Collection,
): void {
  lines.push('### Canonical objects', '');
  if (objects.length === 0) {
    lines.push('_No canonical objects are shown in this section._', '');
    return;
  }
  objects.forEach((object) => appendObject(lines, object, collection));
  lines.push('');
}

function appendObject(lines: string[], object: DiagramObject, collection: Collection): void {
  const role = object.role === 'neutral' ? '' : `; role ${inline(object.role)}`;
  lines.push(`- \`${object.id}\` **${inline(object.label)}** (${object.kind}${role})`);
  appendOptionalObjectFields(lines, object);
  object.ports.forEach((port) =>
    lines.push(
      `  - Port \`${port.id}\`: ${port.direction} ${inline(port.label)} : ${inline(port.type)}`,
    ),
  );
  object.content.forEach((block) => appendContent(lines, block, object, collection));
}

function appendOptionalObjectFields(lines: string[], object: DiagramObject): void {
  if (object.step !== undefined) lines.push(`  - Step: ${object.step}`);
  if (object.sources.length > 0)
    lines.push(`  - Sources: ${object.sources.map((source) => `\`${source}\``).join(', ')}`);
}

// Exhaustive rendering of the closed content schema is intentionally a dispatch switch.
// eslint-disable-next-line sonarjs/cognitive-complexity
function appendContent(
  lines: string[],
  block: ContentBlock,
  object: DiagramObject,
  collection: Collection,
): void {
  switch (block.kind) {
    case 'text':
      lines.push(`  - Text \`${block.id}\`: ${inline(block.text)} (${block.role})`);
      break;
    case 'code':
      lines.push(
        `  - Code \`${block.id}\`${block.language === undefined ? '' : ` (${inline(block.language)})`}: \`${inline(block.text)}\``,
      );
      break;
    case 'list':
      appendList(lines, block);
      break;
    case 'image':
    case 'icon':
      lines.push(
        `  - ${block.kind} \`${block.id}\`: asset \`${block.asset}\` (${block.fit}, ${block.size})`,
      );
      break;
    case 'figure':
      lines.push(`  - Figure \`${block.id}\`: ${block.form} (${figureDetails(block)})`);
      break;
    case 'link':
      lines.push(`  - Link \`${block.id}\`: ${inline(block.label)} → ${linkTarget(block.target)}`);
      break;
    case 'field':
      appendField(lines, block, object, collection);
      break;
    case 'keygroup':
      appendKeyGroup(lines, block);
      break;
    case 'signature':
      lines.push(
        `  - Signature \`${block.id}\`: ${inline(block.label)}(${block.parameters.map(inline).join(', ')}) → ${inline(block.returns)}`,
      );
      break;
    case 'member':
      lines.push(
        `  - Member \`${block.id}\`: ${block.visibility} ${inline(block.label)} : ${inline(block.type)}`,
      );
      break;
    case 'table':
      appendTable(lines, block);
      break;
  }
}

function appendList(lines: string[], block: Extract<ContentBlock, { kind: 'list' }>): void {
  lines.push(`  - ${block.ordered ? 'Ordered' : 'Unordered'} list \`${block.id}\`:`);
  block.items.forEach((item, index) => appendListItem(lines, item, index, block.ordered));
}

function appendListItem(lines: string[], item: string, index: number, ordered: boolean): void {
  const marker = ordered ? `${index + 1}. ` : '';
  lines.push(`    - ${marker}${inline(item)}`);
}

function appendField(
  lines: string[],
  block: Extract<ContentBlock, { kind: 'field' }>,
  object: DiagramObject,
  collection: Collection,
): void {
  const type = fieldTypeDisplay(collection, block);
  const details = fieldDetails(block);
  lines.push(
    `  - Field \`${object.id}.${block.id}\`: ${inline(block.label)} : ${inline(type)}${details}`,
  );
}

function fieldDetails(block: Extract<ContentBlock, { kind: 'field' }>): string {
  const details = [fieldKey(block), fieldNullable(block), fieldReference(block)].filter(
    (value): value is string => value !== undefined,
  );
  return details.length === 0 ? '' : `, ${details.join(', ')}`;
}

function fieldKey(block: Extract<ContentBlock, { kind: 'field' }>): string | undefined {
  return block.key;
}

function fieldNullable(block: Extract<ContentBlock, { kind: 'field' }>): string | undefined {
  return block.nullable ? 'nullable' : undefined;
}

function fieldReference(block: Extract<ContentBlock, { kind: 'field' }>): string | undefined {
  return block.references === undefined ? undefined : `references ${endpoint(block.references)}`;
}

function appendKeyGroup(lines: string[], block: Extract<ContentBlock, { kind: 'keygroup' }>): void {
  const references =
    block.references === undefined
      ? ''
      : `; references ${block.references.map(endpoint).join(', ')}`;
  lines.push(
    `  - Key group \`${block.id}\`: ${block.key} [${block.fields.map((field) => `\`${field}\``).join(', ')}]${references}`,
  );
}

function appendTable(lines: string[], block: Extract<ContentBlock, { kind: 'table' }>): void {
  lines.push(`  - Table \`${block.id}\`: ${block.columns.map(inline).join(' | ')}`);
  block.rows.forEach((row) =>
    lines.push(`    - \`${row.id}\`: ${row.cells.map(inline).join(' | ')}`),
  );
}

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
  lines.push(
    `- \`${relationship.id}\` **${inline(relationship.label)}** (${relationship.kind}) ${endpoint(relationship.source)} → ${endpoint(relationship.target)}${details}; ${wire.route} wire${wire.locked ? ', locked' : ''}`,
  );
}

function relationshipDetails(relationship: Relationship): string {
  return [
    relationshipCardinality(relationship),
    optionalRelationshipDetail(relationship.guard, 'guard'),
    optionalRelationshipDetail(relationship.effect, 'effect'),
  ].join('');
}

function relationshipCardinality(relationship: Relationship): string {
  if (relationship.from === undefined && relationship.to === undefined) return '';
  return `; cardinality ${relationship.from ?? '?'} → ${relationship.to ?? '?'}`;
}

function optionalRelationshipDetail(value: string | undefined, label: string): string {
  return value === undefined ? '' : `; ${label} ${inline(value)}`;
}

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
      lines.push(
        `${'  '.repeat(depth + 1)}- Branch \`${sequenceBranch.id}\`: ${inline(sequenceBranch.label)}`,
      );
      appendSequenceItems(lines, items, item.id, sequenceBranch.id, depth + 2, rendered, objects);
    });
    return;
  }
  appendSequenceItems(lines, items, item.id, undefined, depth + 1, rendered, objects);
}

function appendEvent(
  lines: string[],
  prefix: string,
  item: Extract<SequenceItem, { kind: 'event' }>,
  objects: ReadonlyMap<string, DiagramObject>,
): void {
  const source = objects.get(item.source)?.label ?? item.source;
  const target = objects.get(item.target)?.label ?? item.target;
  const activation = activationDetail(item.activate);
  lines.push(
    `${prefix}\`${item.id}\` ${inline(source)} → ${inline(target)}: **${inline(item.label)}** (${item.message}${activation})`,
  );
}

function activationDetail(value: boolean | undefined): string {
  if (value === undefined) return '';
  return value ? '; activate' : '; deactivate';
}

function endpoint(value: Endpoint): string {
  return value.member === undefined ? `\`${value.object}\`` : `\`${value.object}.${value.member}\``;
}

function linkTarget(target: Extract<ContentBlock, { kind: 'link' }>['target']): string {
  if (target.kind === 'uri') return inline(target.uri);
  const section = target.section === undefined ? '' : ` in \`${target.section}\``;
  return `\`${target.id}\`${section}`;
}

function figureDetails(block: Extract<ContentBlock, { kind: 'figure' }>): string {
  return Object.entries(block)
    .filter(([key]) => key !== 'kind' && key !== 'id' && key !== 'form')
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(', ');
}

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

function inline(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('`', '\\`')
    .replaceAll('*', '\\*')
    .replaceAll('_', '\\_')
    .replaceAll('\n', ' ');
}
