/* eslint-disable sonarjs/cognitive-complexity */
import type {
  ProfileDeclaration,
  ProfileDeclarationIndex,
  ProfileSource,
  ProfileSpan,
} from '../../contract/records/profiles.js';
import { buildSpecProfile } from './build-spec.js';
import type { ProfileFinding, ProfileLintResult } from '../../contract/records/profiles.js';

type Declaration = ProfileDeclaration;
type ParsedSource = ProfileSource;
type Span = ProfileSpan;
type SyntaxValue = unknown;
type Reference = { readonly kind: 'reference'; readonly id: string };

const reserved = new Map(buildSpecProfile.slots.map((slot) => [slot.id.slice(1), slot]));
const appendixPattern = /^(flow|sequence|state)-5([1-9][0-9]*)$/;

function field(declaration: Declaration, name: string): SyntaxValue | undefined {
  return declaration.fields[name]?.value;
}

function text(declaration: Declaration, name: string): string | undefined {
  const value = field(declaration, name);
  return typeof value === 'string' ? value : undefined;
}

function reference(value: SyntaxValue | undefined): Reference | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  if (
    !('kind' in value) ||
    !('id' in value) ||
    value.kind !== 'reference' ||
    typeof value.id !== 'string'
  )
    return undefined;
  return value as Reference;
}

function id(declaration: Declaration): string | undefined {
  return reference(field(declaration, 'id'))?.id;
}

function ids(declaration: Declaration, name: string): readonly string[] {
  const value = field(declaration, name);
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const ref = reference(item);
    return ref === undefined ? [] : [ref.id];
  });
}

function descendants(declaration: Declaration, kind: Declaration['kind']): readonly Declaration[] {
  return declaration.children.flatMap((child) => [
    ...(child.kind === kind ? [child] : []),
    ...descendants(child, kind),
  ]);
}

function index(source: ParsedSource): ProfileDeclarationIndex | null {
  if (source.kind !== 'canvas') return null;
  const declaration = source.declaration;
  return {
    source,
    declaration,
    sections: declaration.children.filter((child) => child.kind === 'section'),
    nodes: declaration.children.filter((child) => child.kind === 'node'),
    wires: declaration.children.filter((child) => child.kind === 'wire'),
  };
}

function span(declaration: Declaration, name?: string): Span {
  return name === undefined
    ? declaration.span
    : (declaration.fields[name]?.span ?? declaration.span);
}

function finding(
  findings: ProfileFinding[],
  declaration: Declaration,
  path: string,
  message: string,
  fieldName?: string,
): void {
  findings.push({ path, message, span: span(declaration, fieldName) });
}

function sectionById(sections: readonly Declaration[], sectionId: string): Declaration | undefined {
  return sections.find((section) => id(section) === sectionId);
}

function shown(section: Declaration): readonly string[] {
  return section.children
    .filter((child) => child.kind === 'show')
    .flatMap((child) => ids(child, 'ids'));
}

function order(section: Declaration): number | undefined {
  const value = field(section, 'order');
  return typeof value === 'number' ? value : undefined;
}

function lintSections(indexed: ProfileDeclarationIndex, findings: ProfileFinding[]): void {
  const seen = new Map<string, Declaration>();
  for (const section of indexed.sections) {
    const sectionId = id(section);
    if (sectionId === undefined) continue;
    if (seen.has(sectionId))
      finding(findings, section, `section @${sectionId}`, 'Section ID is duplicated.', 'id');
    seen.set(sectionId, section);
    const slot = reserved.get(sectionId);
    if (
      slot !== undefined &&
      text(section, 'mode') !== undefined &&
      !slot.modes.includes(text(section, 'mode') ?? '')
    )
      finding(
        findings,
        section,
        `section @${sectionId}`,
        `Required slot must use mode ${slot.modes.join(' or ')}.`,
        'mode',
      );
  }

  for (const slot of buildSpecProfile.slots) {
    const section = sectionById(indexed.sections, slot.id.slice(1));
    if (section === undefined) {
      finding(
        findings,
        indexed.declaration,
        `section ${slot.id}`,
        `Missing required ${slot.id} section.`,
      );
      continue;
    }
    if (text(section, 'mode') !== slot.modes[0])
      finding(findings, section, `section ${slot.id}`, `Expected mode ${slot.modes[0]}.`, 'mode');
    const sectionOrder = order(section);
    if (sectionOrder !== undefined && sectionOrder !== slot.order - 1)
      finding(
        findings,
        section,
        `section ${slot.id}`,
        `Expected numeric order ${slot.order - 1}.`,
        'order',
      );
  }

  const appendices = indexed.sections.flatMap((section) => {
    const sectionId = id(section);
    const match = sectionId === undefined ? null : appendixPattern.exec(sectionId);
    return match === null
      ? []
      : [{ section, id: sectionId, number: Number(match[2]), mode: match[1] }];
  });
  if (appendices.length === 0)
    finding(
      findings,
      indexed.declaration,
      'appendices',
      'At least one @flow-5N, @sequence-5N or @state-5N appendix is required.',
    );
  const appendixNumbers = new Set<number>();
  let previousNumber = 0;
  let previousOrder = order(sectionById(indexed.sections, 'ownership') ?? indexed.declaration) ?? 3;
  for (const appendix of appendices.sort((a, b) => a.number - b.number)) {
    if (appendixNumbers.has(appendix.number))
      finding(
        findings,
        appendix.section,
        `section @${appendix.id}`,
        'Appendix number is duplicated.',
        'id',
      );
    appendixNumbers.add(appendix.number);
    if (appendix.number <= previousNumber)
      finding(
        findings,
        appendix.section,
        `section @${appendix.id}`,
        'Appendix numbers must increase.',
        'id',
      );
    previousNumber = appendix.number;
    if (text(appendix.section, 'mode') !== appendix.mode)
      finding(
        findings,
        appendix.section,
        `section @${appendix.id}`,
        `Appendix ID prefix requires mode ${appendix.mode}.`,
        'mode',
      );
    const currentOrder = order(appendix.section);
    if (currentOrder === undefined || currentOrder <= previousOrder)
      finding(
        findings,
        appendix.section,
        `section @${appendix.id}`,
        'Appendix order must be greater than the ownership order and strictly increasing.',
        'order',
      );
    previousOrder = currentOrder ?? previousOrder;
  }
}

function lintRepo(indexed: ProfileDeclarationIndex, findings: ProfileFinding[]): void {
  const section = sectionById(indexed.sections, 'repo');
  if (section === undefined) return;
  const root = section.children.find((child) => child.kind === 'root');
  const rootId = root === undefined ? undefined : id(root);
  if (rootId === undefined)
    finding(findings, section, 'section @repo', 'Tree section must declare one root.', 'id');
  const connected = new Set(
    section.children
      .filter((child) => child.kind === 'connect')
      .flatMap((child) => ids(child, 'ids')),
  );
  const parentWires = indexed.wires
    .filter((wire) => text(wire, 'kind') === 'parent')
    .map((wire) => id(wire));
  if (
    parentWires.length === 0 ||
    parentWires.some((wireId) => wireId !== undefined && !connected.has(wireId))
  )
    finding(findings, section, 'section @repo', 'Tree section must show and connect parent wires.');
}

function lintModules(indexed: ProfileDeclarationIndex, findings: ProfileFinding[]): void {
  const repo = sectionById(indexed.sections, 'repo');
  const modules = sectionById(indexed.sections, 'modules');
  if (repo === undefined || modules === undefined) return;
  const repoObjects = new Set(shown(repo));
  for (const objectId of shown(modules)) {
    const node = indexed.nodes.find((candidate) => id(candidate) === objectId);
    if (
      node === undefined ||
      !['module', 'interface'].includes(text(node, 'kind') ?? '') ||
      !repoObjects.has(objectId)
    )
      finding(
        findings,
        modules,
        `section @modules show @${objectId}`,
        'Modules must show canonical module/interface objects also shown by the repo tree.',
      );
  }
}

function lintEntitiesAndCrud(indexed: ProfileDeclarationIndex, findings: ProfileFinding[]): void {
  const entities = sectionById(indexed.sections, 'entities');
  const ownership = sectionById(indexed.sections, 'ownership');
  if (entities === undefined || ownership === undefined) return;
  const entityIds = shown(entities);
  for (const entityId of entityIds) {
    const entity = indexed.nodes.find((node) => id(node) === entityId);
    if (entity === undefined || text(entity, 'kind') !== 'entity') {
      finding(
        findings,
        entities,
        `section @entities show @${entityId}`,
        'Entities must show entity nodes.',
      );
      continue;
    }
    if (!entity.children.some((child) => child.kind === 'text'))
      finding(
        findings,
        entity,
        `node @${entityId}`,
        'Entity must contain at least one invariant text child.',
      );
  }
  const shownNotes = shown(ownership).map((objectId) =>
    indexed.nodes.find((node) => id(node) === objectId),
  );
  const tables = shownNotes.flatMap((note) =>
    note?.kind === 'node' && text(note, 'kind') === 'note' ? descendants(note, 'table') : [],
  );
  if (tables.length !== 1) {
    finding(
      findings,
      ownership,
      'section @ownership',
      'Ownership must show one note containing exactly one CRUD table.',
    );
    return;
  }
  const table = tables[0];
  if (table === undefined) return;
  const columns = field(table, 'columns');
  const expected = ['Object', 'Create', 'Read', 'Update', 'Delete'];
  if (
    !Array.isArray(columns) ||
    columns.some((value, index) => value !== expected[index]) ||
    columns.length !== expected.length
  )
    finding(
      findings,
      table,
      'table',
      'CRUD table columns must be exactly Object, Create, Read, Update, Delete.',
      'columns',
    );
  const rows = descendants(table, 'row');
  const expectedRows = new Set(entityIds.map((entityId) => `${entityId}-row`));
  for (const row of rows) {
    const rowId = id(row);
    if (rowId === undefined || !expectedRows.has(rowId))
      finding(
        findings,
        row,
        `row @${rowId ?? '?'}`,
        'CRUD rows must use one stable <entity-id>-row ID.',
      );
    const cells = field(row, 'cells');
    if (!Array.isArray(cells) || cells.length !== 5)
      finding(findings, row, `row @${rowId ?? '?'}`, 'CRUD rows must contain five cells.', 'cells');
  }
  for (const expectedRow of expectedRows)
    if (!rows.some((row) => id(row) === expectedRow))
      finding(findings, table, `row @${expectedRow}`, 'CRUD table is missing a row for an entity.');
}

export function lintBuildSpec(source: ParsedSource): ProfileLintResult {
  const indexed = index(source);
  if (indexed === null) {
    return {
      profile: buildSpecProfile.id,
      valid: false,
      findings: [],
      summary: 'build-spec@1 requires a full canvas 1 document.',
    };
  }
  const findings: ProfileFinding[] = [];
  lintSections(indexed, findings);
  lintRepo(indexed, findings);
  lintModules(indexed, findings);
  lintEntitiesAndCrud(indexed, findings);
  return {
    profile: buildSpecProfile.id,
    valid: findings.length === 0,
    findings,
    summary:
      findings.length === 0
        ? 'build-spec@1 structural lint passed.'
        : `build-spec@1 structural lint found ${findings.length} issue(s).`,
  };
}
