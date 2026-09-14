# PR2 extra bounded realignment

This correction consumes PR2's one permitted **extra** realignment. It is not an audit or a second ordinary correction round, and no further PR2 fix/realignment round remains authorized. The base was the isolated `e9b0f64` worktree. The pre-existing untracked `quality/agent-diagrams/pr2/browser/` evidence was left untouched.

## Trigger and correction

The orchestrator's real-DSL gateway screenshot at `/Users/christopherdasca/Programming/Novakai-Canvas-next-agent-diagrams/quality/agent-diagrams/pr4/browser/gateway-before.png` exposed a frozen-Doc3 deviation: `measureMember` submitted the entire declaration as one measured atom. That expanded the interface node instead of wrapping its readable member declaration by lexical groups.

Presentation case 4 was extended before production code changed. At a bounded width, the new public function-like member produced one text run and failed `expect(memberRuns.length).toBeGreaterThan(1)`. No test definition was added.

`signature.ts` now starts a member with its visibility/name prefix, groups its type at lexical whitespace, and binds punctuation-only units to the preceding group. The existing measured-width path decides line breaks. Identifiers remain indivisible, while the canonical outline, anchor label and stable member ID remain unchanged. Callable-signature grouping, public types, fonts and layout behavior were not changed.

## Scoped verification

| Check | Result |
|---|---|
| Red-first Presentation case 4 | Failed before correction: one member run, expected more than one |
| `pnpm vitest run capability/presentation/tests` | 3 files, 10 tests passed |
| `pnpm typecheck` | Passed |
| Scoped ESLint on the two changed TS files | Passed |
| Threshold-zero scoped Sonar probe | `signature.ts` maximum 1; `projection.test.ts` maximum 2 |
| Scoped Prettier check | Passed after formatting the production file |
| Test-definition budget | Zero new definitions; existing Presentation case 4 extended |

No agent, audit, service, browser, all-repository audit/check, push, interface-specific heuristic or general TypeScript parser was used. User clarification about the pre-existing native-test file scoring remains pending and is not altered by this correction.
