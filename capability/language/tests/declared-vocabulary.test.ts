import { describe, expect, it } from 'vitest';
import { language } from './fixtures.js';

/**
 * Every declared construct kind (01-grammar.md §3-4 / constructs-declared.ts). Tests may only
 * reach the public surface (depcruise's `language-tests-public` rule), so this list is kept in
 * sync by hand rather than imported from the internal vocabulary table.
 */
const declaredConstructKinds: readonly string[] = [
  'declare',
  'change',
  'new',
  'changed',
  'deleted',
  'locked',
  'asset',
  'source',
  'collection',
  'section',
  'show',
  'connect',
  'group',
  'rank',
  'align',
  'before',
  'below',
  'node',
  'text',
  'code',
  'link',
  'list',
  'image',
  'icon',
  'figure',
  'wire',
  'type',
  'field',
  'keygroup',
  'signature',
  'member',
  'table',
  'row',
  'port',
  'scenario',
  'call',
  'return',
  'alt',
  'opt',
  'loop',
  'rule',
  'examples',
  'decision',
];

/** One node id shared across every fixture; parse() is purely syntactic and never resolves it. */
function withDeclare(extra: string): string {
  return `canvas 2\ndeclare @d {\n  node @n step "N"\n  ${extra}\n}\ncollection @c "C" uses=@d {\n  section @s "S" {\n    show @n\n  }\n}\n`;
}
function withNodeChild(child: string): string {
  return `canvas 2\ndeclare @d {\n  node @n step "N" {\n    ${child}\n  }\n}\ncollection @c "C" uses=@d {\n  section @s "S" {\n    show @n\n  }\n}\n`;
}
function withSectionChild(child: string): string {
  return `canvas 2\ndeclare @d {\n  node @n step "N"\n}\ncollection @c "C" uses=@d {\n  section @s "S" {\n    show @n\n    ${child}\n  }\n}\n`;
}
function withScenario(child: string): string {
  return withDeclare(`scenario @sc "Scenario" {\n    ${child}\n  }`);
}
function withChange(child: string): string {
  return withDeclare(`change @ch "Change" {\n    ${child}\n  }`);
}

/** One minimal, parseable document per declared construct kind (grammar §-wide smoke test). */
const examples: Readonly<Record<string, string>> = {
  declare: withDeclare(''),
  collection: withDeclare(''),
  section: withDeclare(''),
  show: withDeclare(''),
  node: withDeclare(''),
  type: withDeclare('type @Status "Status"'),
  asset: withDeclare('asset @a image source="pic.png"'),
  source: withDeclare('source @src "https://example.com/a"'),
  wire: withDeclare('wire @w @n -> @n "Label"'),
  scenario: withScenario('call @n -> @n'),
  call: withScenario('call @n -> @n'),
  return: withScenario('return @n -> @n'),
  alt: withScenario('alt "Alt" { call @n -> @n }'),
  opt: withScenario('opt "Opt" { call @n -> @n }'),
  loop: withScenario('loop "Loop" { call @n -> @n }'),
  change: withChange('new @n'),
  new: withChange('new @n'),
  changed: withChange('changed @n'),
  deleted: withChange('deleted @n'),
  locked: withChange('locked @n'),
  rule: withDeclare('rule @ru on @n : "must hold"'),
  examples: withDeclare('examples @ex on @n'),
  decision: withDeclare('decision @de on @n ["A", "B"]'),
  connect: withSectionChild('connect @n'),
  group: withSectionChild('group @g "Group" { show @n }'),
  rank: withSectionChild('rank @n @n'),
  align: withSectionChild('align @n @n'),
  before: withSectionChild('before @n @n'),
  below: withSectionChild('below @n @n'),
  text: withNodeChild('text @tx "hello"'),
  code: withNodeChild('code @co "run()" language="ts"'),
  link: withNodeChild('link @lk "Label" target=@n'),
  list: withNodeChild('list @li ["A", "B"]'),
  image: withNodeChild('image @im asset=@n'),
  icon: withNodeChild('icon @ic asset=@n'),
  figure: withNodeChild('figure @fg vessel'),
  field: withNodeChild('field @f: string'),
  keygroup: withNodeChild('keygroup @k kind=primary fields=[@n]'),
  signature: withNodeChild('signature @sg returns=string'),
  member: withNodeChild('member @m: string'),
  table: withNodeChild('table @tbl columns=["A", "B"] { row @r1 cells=["1", "2"] }'),
  row: withNodeChild('table @tbl columns=["A", "B"] { row @r1 cells=["1", "2"] }'),
  port: withNodeChild('port @p in: string'),
};

/**
 * `port`'s value (direction or, when present, label) sits directly before its required `:`.
 * The shared scalar reader (`readScalarOrNamespace` in core/parsing/values.ts) treats any
 * word or string token immediately followed by `:` as a namespaced reference, so it currently
 * misparses that value instead of reading the position. This is a pre-existing parser-engine
 * defect, not owned by lane F (vocabulary tables only); tracked here so the fix is visible once
 * a later lane implements `port` and this assertion needs to flip to `true`.
 */
const knownUnparseable: ReadonlySet<string> = new Set(['port']);

describe('every declared construct parses from a one-line example', () => {
  it.each(declaredConstructKinds)('%s', (kind) => {
    const source = examples[kind];
    expect(source, `no example registered for construct kind "${kind}"`).toBeDefined();
    const result = language.parse(source as string);
    expect(result.ok).toBe(!knownUnparseable.has(kind));
  });
});
