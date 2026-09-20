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
  if (collection.description !== undefined) {
    lines.push(...multiline(collection.description), '');
  }
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
      `- \`${definition.id}\` **${inline(definition.label)}** = ${codeSpan(typeExpression(definition.expression))}${resolvedText}`,
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

interface SectionObject {
  readonly object: DiagramObject | undefined;
  readonly groups: readonly string[];
  readonly representedBy: readonly string[];
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

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
  object.content.forEach((block) => appendContent(lines, block, object, collection));
}

function objectHeading(object: DiagramObject, entry: SectionObject): string {
  return `- \`${object.id}\` **${inline(object.label)}** (${object.kind}${objectRole(object)}; group: ${groupList(entry)}${representedGroups(entry)})`;
}

function objectRole(object: DiagramObject): string {
  return object.role === 'neutral' ? '' : `; role ${inline(object.role)}`;
}

function groupList(entry: SectionObject): string {
  return entry.groups.length === 0 ? 'ungrouped' : entry.groups.map((id) => `\`${id}\``).join(', ');
}

function representedGroups(entry: SectionObject): string {
  return entry.representedBy.length === 0
    ? ''
    : `; represented by ${entry.representedBy.map((id) => `\`${id}\``).join(', ')}`;
}

function appendOptionalObjectFields(lines: string[], object: DiagramObject): void {
  if (object.step !== undefined) lines.push(`  - Step: ${object.step}`);
  if (object.sources.length > 0)
    lines.push(`  - Sources: ${object.sources.map((source) => `\`${source}\``).join(', ')}`);
}

type ContentHandler = (
  lines: string[],
  block: ContentBlock,
  object: DiagramObject,
  collection: Collection,
) => void;

const contentHandlers: Record<ContentBlock['kind'], ContentHandler> = {
  text: (lines, block) => appendText(lines, block as Extract<ContentBlock, { kind: 'text' }>),
  code: (lines, block) => appendCode(lines, block as Extract<ContentBlock, { kind: 'code' }>),
  list: (lines, block) => appendList(lines, block as Extract<ContentBlock, { kind: 'list' }>),
  image: (lines, block) =>
    appendAsset(lines, block as Extract<ContentBlock, { kind: 'image' | 'icon' }>),
  icon: (lines, block) =>
    appendAsset(lines, block as Extract<ContentBlock, { kind: 'image' | 'icon' }>),
  figure: (lines, block) => appendFigure(lines, block as Extract<ContentBlock, { kind: 'figure' }>),
  link: (lines, block) => appendLink(lines, block as Extract<ContentBlock, { kind: 'link' }>),
  field: (lines, block, object, collection) =>
    appendField(lines, block as Extract<ContentBlock, { kind: 'field' }>, object, collection),
  keygroup: (lines, block) =>
    appendKeyGroup(lines, block as Extract<ContentBlock, { kind: 'keygroup' }>),
  signature: (lines, block) =>
    appendSignature(lines, block as Extract<ContentBlock, { kind: 'signature' }>),
  member: (lines, block) => appendMember(lines, block as Extract<ContentBlock, { kind: 'member' }>),
  table: (lines, block) => appendTable(lines, block as Extract<ContentBlock, { kind: 'table' }>),
};

function appendContent(
  lines: string[],
  block: ContentBlock,
  object: DiagramObject,
  collection: Collection,
): void {
  contentHandlers[block.kind](lines, block, object, collection);
}

function appendText(lines: string[], block: Extract<ContentBlock, { kind: 'text' }>): void {
  lines.push(`  - Text \`${block.id}\`: ${inline(block.text)} (${block.role})`);
}

function appendCode(lines: string[], block: Extract<ContentBlock, { kind: 'code' }>): void {
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

function appendAsset(
  lines: string[],
  block: Extract<ContentBlock, { kind: 'image' | 'icon' }>,
): void {
  lines.push(
    `  - ${block.kind} \`${block.id}\`: asset \`${block.asset}\` (${block.fit}, ${block.size})`,
  );
}

function appendFigure(lines: string[], block: Extract<ContentBlock, { kind: 'figure' }>): void {
  lines.push(`  - Figure \`${block.id}\`: ${block.form} (${figureDetails(block)})`);
}

function appendLink(lines: string[], block: Extract<ContentBlock, { kind: 'link' }>): void {
  lines.push(`  - Link \`${block.id}\`: ${inline(block.label)} → ${linkTarget(block.target)}`);
}

function appendSignature(
  lines: string[],
  block: Extract<ContentBlock, { kind: 'signature' }>,
): void {
  lines.push(
    `  - Signature \`${block.id}\`: ${inline(block.label)}(${block.parameters.map(inline).join(', ')}) → ${inline(block.returns)}`,
  );
}

function appendMember(lines: string[], block: Extract<ContentBlock, { kind: 'member' }>): void {
  lines.push(
    `  - Member \`${block.id}\`: ${block.visibility} ${inline(block.label)} : ${inline(block.type)}`,
  );
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
  const type = fieldType(collection, block);
  const details = fieldDetails(block);
  lines.push(`  - Field \`${object.id}.${block.id}\`: ${inline(block.label)} : ${type}${details}`);
}

function fieldType(
  collection: Collection,
  block: Extract<ContentBlock, { kind: 'field' }>,
): string {
  const display = fieldTypeDisplay(collection, block);
  if (typeof block.type === 'string') return inline(display);
  return `${inline(display)} (definition ${codeSpan(block.type.id)})`;
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
  const source = sequenceEndpoint(objects, item.source);
  const target = sequenceEndpoint(objects, item.target);
  const activation = activationDetail(item.activate);
  lines.push(
    `${prefix}\`${item.id}\` ${source} → ${target}: **${inline(item.label)}** (${item.message}${activation})`,
  );
}

function sequenceEndpoint(objects: ReadonlyMap<string, DiagramObject>, id: string): string {
  const label = objects.get(id)?.label;
  return label === undefined ? codeSpan(id) : `${inline(label)} (${codeSpan(id)})`;
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
    .replaceAll('#', '\\#')
    .replaceAll('>', '\\>')
    .replaceAll('<', '\\<')
    .replaceAll('&', '\\&')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .replaceAll('\n', '\n  ')
    .replace(/^([ \t]*)(#{1,6}|>|[-+*]|\d+[.)])(?=\s)/gm, '$1\\$2')
    .replace(/^([ \t]*)([-=*_~])\2*\s*$/gm, (line, indent) =>
      `${indent}\\${line.slice(indent.length)}`,
    );
}

function multiline(value: string): readonly string[] {
  return inline(value).split('\n');
}

function codeSpan(value: string): string {
  const fence = inlineCodeFence(value);
  const padding = value.startsWith('`') || value.endsWith('`') ? ' ' : '';
  return `${fence}${padding}${value}${padding}${fence}`;
}

function inlineCodeFence(value: string): string {
  const runs = value.match(/`+/g) ?? [];
  const longest = runs.reduce((length, run) => Math.max(length, run.length), 0);
  return '`'.repeat(Math.max(1, longest + 1));
}

function codeFence(value: string): string {
  const runs = value.match(/`+/g) ?? [];
  const longest = runs.reduce((length, run) => Math.max(length, run.length), 0);
  return '`'.repeat(Math.max(3, longest + 1));
}
