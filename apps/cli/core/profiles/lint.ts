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
  lintSectionIdentity(indexed, findings);
  lintRequiredSections(indexed, findings);
  lintRequiredOrder(indexed, findings);
  lintAppendixShape(indexed, findings);
}

function lintSectionIdentity(indexed: ProfileDeclarationIndex, findings: ProfileFinding[]): void {
  const seen = new Map<string, Declaration>();
  indexed.sections.forEach((section) => {
    const sectionId = id(section);
    if (sectionId === undefined) return;
    reportDuplicateSection(seen, section, sectionId, findings);
    seen.set(sectionId, section);
    reportReservedMode(section, sectionId, findings);
  });
}

function reportDuplicateSection(
  seen: ReadonlyMap<string, Declaration>,
  section: Declaration,
  sectionId: string,
  findings: ProfileFinding[],
): void {
  if (seen.has(sectionId))
    finding(findings, section, `section @${sectionId}`, 'Section ID is duplicated.', 'id');
}

function reportReservedMode(
  section: Declaration,
  sectionId: string,
  findings: ProfileFinding[],
): void {
  const slot = reserved.get(sectionId);
  const mode = text(section, 'mode');
  if (slot !== undefined && mode !== undefined && !slot.modes.includes(mode))
    finding(
      findings,
      section,
      `section @${sectionId}`,
      `Required slot must use mode ${slot.modes.join(' or ')}.`,
      'mode',
    );
}

function lintRequiredSections(indexed: ProfileDeclarationIndex, findings: ProfileFinding[]): void {
  for (const slot of buildSpecProfile.slots) {
    const section = sectionById(indexed.sections, slot.id.slice(1));
    reportRequiredSection(section, slot, indexed.declaration, findings);
  }
}

function reportRequiredSection(
  section: Declaration | undefined,
  slot: (typeof buildSpecProfile.slots)[number],
  declaration: Declaration,
  findings: ProfileFinding[],
): void {
  if (section === undefined) {
    finding(findings, declaration, `section ${slot.id}`, `Missing required ${slot.id} section.`);
    return;
  }
  if (text(section, 'mode') !== slot.modes[0])
    finding(findings, section, `section ${slot.id}`, `Expected mode ${slot.modes[0]}.`, 'mode');
}

function lintRequiredOrder(indexed: ProfileDeclarationIndex, findings: ProfileFinding[]): void {
  const requiredSections = buildSpecProfile.slots.flatMap((slot) => {
    const section = sectionById(indexed.sections, slot.id.slice(1));
    return section === undefined ? [] : [{ slot, section }];
  });
  requiredSections
    .slice(1)
    .forEach((current, index) => reportRequiredOrder(requiredSections[index], current, findings));
}

function reportRequiredOrder(
  previous: { slot: (typeof buildSpecProfile.slots)[number]; section: Declaration } | undefined,
  current: { slot: (typeof buildSpecProfile.slots)[number]; section: Declaration } | undefined,
  findings: ProfileFinding[],
): void {
  if (previous === undefined || current === undefined) return;
  const previousOrder = order(previous.section);
  const currentOrder = order(current.section);
  if (previousOrder === undefined || currentOrder === undefined || currentOrder <= previousOrder)
    finding(
      findings,
      current.section,
      `section ${current.slot.id}`,
      `Required section order must increase after ${previous.slot.id}; extra sections may appear anywhere.`,
      'order',
    );
}

function lintAppendixShape(indexed: ProfileDeclarationIndex, findings: ProfileFinding[]): void {
  const appendices = indexed.sections.flatMap((section) => {
    const sectionId = id(section);
    const match = sectionId === undefined ? null : appendixPattern.exec(sectionId);
    return match === null
      ? []
      : [{ section, id: sectionId as string, number: Number(match[2]), mode: match[1] ?? '' }];
  });
  reportAppendixPresence(appendices.length, indexed.declaration, findings);
  const appendixNumbers = new Set<number>();
  let previousNumber = 0;
  const ownership = sectionById(indexed.sections, 'ownership');
  let previousOrder = ownership === undefined ? undefined : order(ownership);
  appendices
    .sort((a, b) => a.number - b.number)
    .forEach((appendix) => {
      reportAppendixNumber(appendix, appendixNumbers, previousNumber, findings);
      appendixNumbers.add(appendix.number);
      previousNumber = appendix.number;
      const currentOrder = order(appendix.section);
      reportAppendixMode(appendix, findings);
      reportAppendixOrder(appendix, currentOrder, previousOrder, findings);
      if (currentOrder !== undefined) previousOrder = currentOrder;
    });
}

function reportAppendixPresence(
  count: number,
  declaration: Declaration,
  findings: ProfileFinding[],
): void {
  if (count === 0)
    finding(
      findings,
      declaration,
      'appendices',
      'At least one @flow-5N, @sequence-5N or @state-5N appendix is required.',
    );
}

function reportAppendixNumber(
  appendix: { section: Declaration; id: string; number: number; mode: string },
  numbers: ReadonlySet<number>,
  previous: number,
  findings: ProfileFinding[],
): void {
  if (numbers.has(appendix.number))
    finding(
      findings,
      appendix.section,
      `section @${appendix.id}`,
      'Appendix number is duplicated.',
      'id',
    );
  if (appendix.number <= previous)
    finding(
      findings,
      appendix.section,
      `section @${appendix.id}`,
      'Appendix numbers must increase.',
      'id',
    );
}

function reportAppendixMode(
  appendix: { section: Declaration; id: string; number: number; mode: string },
  findings: ProfileFinding[],
): void {
  if (text(appendix.section, 'mode') !== appendix.mode)
    finding(
      findings,
      appendix.section,
      `section @${appendix.id}`,
      `Appendix ID prefix requires mode ${appendix.mode}.`,
      'mode',
    );
}

function reportAppendixOrder(
  appendix: { section: Declaration; id: string; number: number; mode: string },
  current: number | undefined,
  previous: number | undefined,
  findings: ProfileFinding[],
): void {
  if (current === undefined || previous === undefined || current <= previous)
    finding(
      findings,
      appendix.section,
      `section @${appendix.id}`,
      'Appendix order must be greater than the ownership order and strictly increasing.',
      'order',
    );
}

function lintRepo(indexed: ProfileDeclarationIndex, findings: ProfileFinding[]): void {
  const section = sectionById(indexed.sections, 'repo');
  if (section === undefined) return;
  const roots = section.children.filter((child) => child.kind === 'root');
  const rootIds = roots.flatMap((root) => (id(root) === undefined ? [] : [id(root) as string]));
  reportRepoRootCount(roots.length, rootIds.length, section, findings);
  const rootId = rootIds[0];
  const shownIds = new Set(shown(section));
  reportRepoRootShown(rootId, shownIds, section, findings);
  const parentWires = repoParentWires(indexed, section);
  reportRepoWirePresence(parentWires.length, section, findings);
  const childrenByParent = lintRepoWires(parentWires, shownIds, findings);
  reportRepoReachability(rootId, childrenByParent, shownIds, section, findings);
}

function reportRepoRootCount(
  rootCount: number,
  idCount: number,
  section: Declaration,
  findings: ProfileFinding[],
): void {
  if (rootCount !== 1 || idCount !== 1)
    finding(findings, section, 'section @repo', 'Tree section must declare one root.', 'id');
}

function reportRepoRootShown(
  rootId: string | undefined,
  shownIds: ReadonlySet<string>,
  section: Declaration,
  findings: ProfileFinding[],
): void {
  if (rootId !== undefined && !shownIds.has(rootId))
    finding(
      findings,
      section,
      `section @repo root @${rootId}`,
      'Tree root must be shown in the repo projection.',
    );
}

function repoParentWires(
  indexed: ProfileDeclarationIndex,
  section: Declaration,
): readonly Declaration[] {
  const connected = new Set(
    section.children
      .filter((child) => child.kind === 'connect')
      .flatMap((child) => ids(child, 'ids')),
  );
  return indexed.wires.filter(
    (wire) => text(wire, 'kind') === 'parent' && connected.has(id(wire) ?? ''),
  );
}

function reportRepoWirePresence(
  count: number,
  section: Declaration,
  findings: ProfileFinding[],
): void {
  if (count === 0)
    finding(findings, section, 'section @repo', 'Tree section must show and connect parent wires.');
}

function lintRepoWires(
  parentWires: readonly Declaration[],
  shownIds: ReadonlySet<string>,
  findings: ProfileFinding[],
): Map<string, string[]> {
  const childrenByParent = new Map<string, string[]>();
  parentWires.forEach((wire) => {
    const wireId = id(wire);
    const source = reference(field(wire, 'source'))?.id;
    const target = reference(field(wire, 'target'))?.id;
    reportRepoWireShape(wire, wireId, source, target, shownIds, findings);
    if (wireId === undefined || source === undefined || target === undefined) return;
    childrenByParent.set(source, [...(childrenByParent.get(source) ?? []), target]);
  });
  return childrenByParent;
}

function reportRepoWireShape(
  wire: Declaration,
  wireId: string | undefined,
  source: string | undefined,
  target: string | undefined,
  shownIds: ReadonlySet<string>,
  findings: ProfileFinding[],
): void {
  reportRepoWireFields(wire, wireId, source, target, findings);
  reportRepoWireEndpoints(wire, wireId, source, target, shownIds, findings);
}

function reportRepoWireFields(
  wire: Declaration,
  wireId: string | undefined,
  source: string | undefined,
  target: string | undefined,
  findings: ProfileFinding[],
): void {
  if (wireId === undefined || source === undefined || target === undefined)
    finding(
      findings,
      wire,
      `wire @${wireId ?? '?'}`,
      'Parent wire must have source and target objects.',
    );
}

function reportRepoWireEndpoints(
  wire: Declaration,
  wireId: string | undefined,
  source: string | undefined,
  target: string | undefined,
  shownIds: ReadonlySet<string>,
  findings: ProfileFinding[],
): void {
  if (source === undefined || target === undefined) return;
  if (!shownIds.has(source) || !shownIds.has(target))
    finding(
      findings,
      wire,
      `wire @${wireId ?? '?'}`,
      'Parent wire endpoints must be shown in the repo projection.',
    );
}

function reportRepoReachability(
  rootId: string | undefined,
  childrenByParent: ReadonlyMap<string, readonly string[]>,
  shownIds: ReadonlySet<string>,
  section: Declaration,
  findings: ProfileFinding[],
): void {
  if (rootId === undefined) return;
  const reachable = reachableObjects(rootId, childrenByParent);
  shownIds.forEach((objectId) => reportUnreachable(objectId, reachable, section, findings));
}

function reportUnreachable(
  objectId: string,
  reachable: ReadonlySet<string>,
  section: Declaration,
  findings: ProfileFinding[],
): void {
  if (!reachable.has(objectId))
    finding(
      findings,
      section,
      `section @repo show @${objectId}`,
      'Every shown repo object must be connected to the declared root by parent wires.',
    );
}

function reachableObjects(
  rootId: string,
  childrenByParent: ReadonlyMap<string, readonly string[]>,
): Set<string> {
  const reachable = new Set<string>([rootId]);
  const visit = (current: string): void => {
    if (reachable.has(current)) return;
    reachable.add(current);
    (childrenByParent.get(current) ?? []).forEach(visit);
  };
  (childrenByParent.get(rootId) ?? []).forEach(visit);
  return reachable;
}

function lintModules(indexed: ProfileDeclarationIndex, findings: ProfileFinding[]): void {
  const repo = sectionById(indexed.sections, 'repo');
  const modules = sectionById(indexed.sections, 'modules');
  if (repo === undefined || modules === undefined) return;
  const repoObjects = new Set(shown(repo));
  for (const objectId of shown(modules)) {
    const node = indexed.nodes.find((candidate) => id(candidate) === objectId);
    reportModuleProjection(node, objectId, repoObjects, modules, findings);
  }
}

function reportModuleProjection(
  node: Declaration | undefined,
  objectId: string,
  repoObjects: ReadonlySet<string>,
  modules: Declaration,
  findings: ProfileFinding[],
): void {
  if (!isCanonicalModule(node, objectId, repoObjects))
    finding(
      findings,
      modules,
      `section @modules show @${objectId}`,
      'Modules must show canonical module/interface objects also shown by the repo tree.',
    );
}

function isCanonicalModule(
  node: Declaration | undefined,
  objectId: string,
  repoObjects: ReadonlySet<string>,
): boolean {
  if (node === undefined) return false;
  return isModuleKind(node) && repoObjects.has(objectId);
}

function isModuleKind(node: Declaration): boolean {
  return ['module', 'interface'].includes(text(node, 'kind') ?? '');
}

function lintEntitiesAndCrud(indexed: ProfileDeclarationIndex, findings: ProfileFinding[]): void {
  const entities = sectionById(indexed.sections, 'entities');
  const ownership = sectionById(indexed.sections, 'ownership');
  if (entities === undefined || ownership === undefined) return;
  const entityIds = shown(entities);
  lintEntityNodes(entityIds, indexed.nodes, entities, findings);
  lintCrud(indexed, ownership, entityIds, findings);
}

function lintCrud(
  indexed: ProfileDeclarationIndex,
  ownership: Declaration,
  entityIds: readonly string[],
  findings: ProfileFinding[],
): void {
  const shownNotes = shown(ownership).map((objectId) =>
    indexed.nodes.find((node) => id(node) === objectId),
  );
  const tables = shownNotes.flatMap((note) =>
    note?.kind === 'node' && text(note, 'kind') === 'note' ? descendants(note, 'table') : [],
  );
  if (tables.length !== 1) return reportCrudTableCount(ownership, findings);
  const table = tables[0] as Declaration;
  reportCrudColumns(table, findings);
  const rows = descendants(table, 'row');
  const expectedRows = new Set(entityIds.map((entityId) => `${entityId}-row`));
  const rowCounts = new Map<string, number>();
  lintCrudRows(rows, expectedRows, rowCounts, findings);
  reportMissingRows(rows, expectedRows, table, findings);
  reportDuplicateRows(rows, rowCounts, table, findings);
}

function lintEntityNodes(
  entityIds: readonly string[],
  nodes: readonly Declaration[],
  section: Declaration,
  findings: ProfileFinding[],
): void {
  entityIds.forEach((entityId) =>
    reportEntityNode(
      nodes.find((node) => id(node) === entityId),
      entityId,
      section,
      findings,
    ),
  );
}

function reportEntityNode(
  entity: Declaration | undefined,
  entityId: string,
  section: Declaration,
  findings: ProfileFinding[],
): void {
  if (isInvalidEntity(entity)) {
    finding(
      findings,
      section,
      `section @entities show @${entityId}`,
      'Entities must show entity nodes.',
    );
    return;
  }
  const validEntity = entity as Declaration;
  if (lacksInvariant(validEntity))
    finding(
      findings,
      validEntity,
      `node @${entityId}`,
      'Entity must contain at least one invariant text child.',
    );
}

function isInvalidEntity(entity: Declaration | undefined): boolean {
  return entity === undefined || text(entity, 'kind') !== 'entity';
}

function lacksInvariant(entity: Declaration): boolean {
  return !entity.children.some((child) => child.kind === 'text');
}

function reportCrudTableCount(ownership: Declaration, findings: ProfileFinding[]): void {
  finding(
    findings,
    ownership,
    'section @ownership',
    'Ownership must show one note containing exactly one CRUD table.',
  );
}

function reportCrudColumns(table: Declaration, findings: ProfileFinding[]): void {
  const columns = field(table, 'columns');
  const expected = ['Object', 'Create', 'Read', 'Update', 'Delete'];
  if (invalidCrudColumns(columns, expected))
    finding(
      findings,
      table,
      'table',
      'CRUD table columns must be exactly Object, Create, Read, Update, Delete.',
      'columns',
    );
}

function invalidCrudColumns(columns: SyntaxValue, expected: readonly string[]): boolean {
  return (
    !Array.isArray(columns) ||
    columns.length !== expected.length ||
    columns.some((value, index) => value !== expected[index])
  );
}

function lintCrudRows(
  rows: readonly Declaration[],
  expectedRows: ReadonlySet<string>,
  counts: Map<string, number>,
  findings: ProfileFinding[],
): void {
  rows.forEach((row) => {
    const rowId = id(row);
    if (rowId !== undefined) counts.set(rowId, (counts.get(rowId) ?? 0) + 1);
    reportCrudRow(row, rowId, expectedRows, findings);
  });
}

function reportCrudRow(
  row: Declaration,
  rowId: string | undefined,
  expectedRows: ReadonlySet<string>,
  findings: ProfileFinding[],
): void {
  if (invalidCrudRowId(rowId, expectedRows))
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

function invalidCrudRowId(rowId: string | undefined, expectedRows: ReadonlySet<string>): boolean {
  return rowId === undefined || !expectedRows.has(rowId);
}

function reportMissingRows(
  rows: readonly Declaration[],
  expectedRows: ReadonlySet<string>,
  table: Declaration,
  findings: ProfileFinding[],
): void {
  expectedRows.forEach((expectedRow) => reportMissingRow(rows, expectedRow, table, findings));
}

function reportMissingRow(
  rows: readonly Declaration[],
  expectedRow: string,
  table: Declaration,
  findings: ProfileFinding[],
): void {
  if (!rows.some((row) => id(row) === expectedRow))
    finding(findings, table, `row @${expectedRow}`, 'CRUD table is missing a row for an entity.');
}

function reportDuplicateRows(
  rows: readonly Declaration[],
  counts: ReadonlyMap<string, number>,
  table: Declaration,
  findings: ProfileFinding[],
): void {
  counts.forEach((count, rowId) => {
    if (count > 1)
      finding(
        findings,
        rows.find((row) => id(row) === rowId) ?? table,
        `row @${rowId}`,
        'CRUD table must contain exactly one row for each entity.',
      );
  });
}

function lintAppendices(indexed: ProfileDeclarationIndex, findings: ProfileFinding[]): void {
  indexed.sections.forEach((section) => {
    const sectionId = id(section);
    const match = sectionId === undefined ? null : appendixPattern.exec(sectionId);
    if (match === null || sectionId === undefined) return;
    lintAppendix(section, sectionId, indexed, findings);
  });
}

function lintAppendix(
  section: Declaration,
  sectionId: string,
  indexed: ProfileDeclarationIndex,
  findings: ProfileFinding[],
): void {
  const mode = text(section, 'mode');
  if (mode === 'sequence') return lintSequenceAppendix(section, sectionId, findings);
  lintNodeAppendix(section, sectionId, mode, indexed, findings);
}

function lintSequenceAppendix(
  section: Declaration,
  sectionId: string,
  findings: ProfileFinding[],
): void {
  if (!section.children.some((child) => child.kind === 'event' || child.kind === 'fragment'))
    finding(
      findings,
      section,
      `section @${sectionId}`,
      'Sequence appendix must contain native event or fragment declarations.',
    );
}

function lintNodeAppendix(
  section: Declaration,
  sectionId: string,
  mode: string | undefined,
  indexed: ProfileDeclarationIndex,
  findings: ProfileFinding[],
): void {
  const shownNodes = shown(section)
    .map((objectId) => indexed.nodes.find((node) => id(node) === objectId))
    .filter((node): node is Declaration => node !== undefined);
  const allowedKinds =
    mode === 'flow'
      ? new Set(['start', 'step', 'decision', 'end', 'fork', 'join'])
      : new Set(['state']);
  reportNativeNodes(shownNodes, allowedKinds, mode, section, sectionId, findings);
  reportNativeWire(section, sectionId, mode, indexed.wires, findings);
}

function reportNativeNodes(
  nodes: readonly Declaration[],
  allowedKinds: ReadonlySet<string>,
  mode: string | undefined,
  section: Declaration,
  sectionId: string,
  findings: ProfileFinding[],
): void {
  if (!nodes.some((node) => allowedKinds.has(text(node, 'kind') ?? '')))
    finding(
      findings,
      section,
      `section @${sectionId}`,
      `${mode} appendix must show native ${mode} objects.`,
    );
}

function reportNativeWire(
  section: Declaration,
  sectionId: string,
  mode: string | undefined,
  wires: readonly Declaration[],
  findings: ProfileFinding[],
): void {
  const connectedIds = section.children
    .filter((child) => child.kind === 'connect')
    .flatMap((child) => ids(child, 'ids'));
  const requiredKind = mode === 'state' ? 'transition' : mode;
  if (
    !wires.some(
      (wire) => connectedIds.includes(id(wire) ?? '') && text(wire, 'kind') === requiredKind,
    )
  )
    finding(
      findings,
      section,
      `section @${sectionId}`,
      `${mode} appendix must connect native ${mode} wires.`,
    );
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
  lintAppendices(indexed, findings);
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
