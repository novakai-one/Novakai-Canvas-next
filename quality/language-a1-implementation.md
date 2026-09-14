# Language A1 — sole bounded implementation audit

Reviewed exactly five production files against all five Language specifications, root `CODING-STANDARDS.md`, and the literal 16-principle anchors in `docs/standards/CODING-STANDARDS.md`. Builder evidence was treated as a claim and checked against source. Direct Language collaborators supplied evidence only; no other capability code was audited. Public Model roles were exercised by the Language tests and transient probes. No implementation or tests were edited. This is the sole round, stopped within eight minutes.

All five targets clear the strict >144/160 score gate. Existing Language tests: **18 passed / five suites**. Targeted ESLint found no other violations. Actual Sonar maxima measured with an ESLint API override at reporting threshold zero in memory: **1 / 2 / 2 / 2 / 2** in the target order below. No configuration file changed. Those passing gates do not erase the behavioral finding.

## Findings pending independent parent verification

| Category | Exact location | Evidence and concrete consequence |
|---|---|---|
| major build risk | `capability/language/core/lexing/tokens.ts:5–10,36–43`; acceptance evidence `core/parsing/declarations.ts:70–73` | The catch-all lexeme matches a lone opening quote when the complete quoted-string alternative fails; `classify` labels that one-character token `string`. The direct decoder `core/lexing/strings.ts:5–8` slices it into empty text. Public `lower` accepts the malformed source below and returns a Model-validated candidate containing `{kind:'text',id:'t',text:''}`. Braces following the unmatched quote become structural delimiters. This violates the quoted-string grammar (Doc3 lexer/parser contract; G01/G02) and G16's syntax-failure contract: incomplete source can become an applicable empty-content edit instead of a syntax diagnostic. |

Exact public reproduction, using the same public Model roles and valid paper theme shape as `capability/language/tests/fixtures.ts:9–29`:

```ts
const language = createLanguage({
  reader: { validate }, planner: { plan }, stage: { stage },
});
const result = language.lower({
  source: 'canvas 1 collection @demo "Demo" { node @a step "A" { text @t " } }',
  mode: 'create', snapshot: null,
  resources: { themes: { paper: theme }, assets: {} },
});
// Observed: result.ok === true;
// result.value.collection.objects[0].content[0] === { kind:'text', id:'t', text:'' }.
```

The same public parse defect is smaller: `language.parse('canvas 1 collection @demo " {}')` returns success with an empty title. The reproduction ran through transient Node processes, not new tests or private parser mocks. Theme fixture: id `paper`, version `1.0.0`, digest `sha256:` plus 64 `a` characters, roles `neutral,primary,supporting,decision,success,warning`. Public owner validation and planning were real.

## Literal scorecard

A = `contract/api.ts`; D = `core/parsing/declarations.ts`; P = `core/patching/properties.ts`; R = `core/printing/document.ts`; T = `core/lexing/tokens.ts`. All paths here are under `capability/language/`. Evidence is target-local unless a collaborator is explicitly named.

| Principle | A | D | P | R | T | Evidence |
|---|---:|---:|---:|---:|---:|---|
| SRP | 10 | 10 | 10 | 10 | 10 | A16–38 binds the pure public facade; D20–107 parses declarations; P12–132 translates scalar property edits; R16–75 prints readouts; T8–45 produces tokens/spans. Return assembly belongs to each responsibility. |
| OCP | 6 | 6 | 6 | 6 | 6 | Fixed stages at A27–31, D38–45, P17–20, R17–26 and T29–32 lack a step seam. D uses registered constructs, P shared property definitions and R shared headers, but the owned orchestration axis remains edited in place. No optional-guard framework is recommended. |
| LSP | 7 | 7 | 7 | 7 | 7 | Not demonstrated: no subtype substitution implementation in these targets. Public behavioral tests are not invented subtype-suite evidence. |
| ISP | 10 | 10 | 10 | 10 | 10 | A consumes reader/planner/stage across its complete flow; R consumes its reader's sole method at17. D/P/T declare no unused behavioral service ports. Pass-through dependencies count as consumption. |
| DIP | 10 | 10 | 10 | 10 | 10 | Own core/declaration imports only; A receives owner roles, R receives ModelReader, and the remaining targets are pure syntax/data transforms. No runtime infrastructure construction. |
| DRY | 10 | 10 | 10 | 10 | 10 | A shares protect; D shared construct/property/value readers; P shared propertyTarget/changedProperties and nestedLayout; R shared header/layout/section printers; T shared location calculation and centralized lexeme classification. No extractable repeated policy established. |
| KISS | 10 | 10 | 10 | 10 | 10 | Named documented stages and explicit return types throughout. D38–45 has named position/attribute/child results; P71–81 names nested-layout state; R keeps scope/envelope/declarations separate; T separates classification/trivia/allocation. The lexer defect is a missing validity check, not evidence of intentionally clever flow. |
| YAGNI | 10 | 10 | 10 | 10 | 10 | Only shipped parse/lower/patch/print/token responsibilities; no unused runtime extensibility or speculative I/O. |
| Typed error outcomes | 10 | 5 | 5 | 5 | 10 | A18–36 and T24–25 expose Result and protect all execution. D20, P12 and R16 return plain values and propagate distinguishable LanguageFault failures absent from signatures; own boundary catches do not raise these target-file anchors. |
| Idempotency / failure semantics | 10 | 8 | 8 | 8 | 10 | A12–15 explicitly names Language/Authoring correction and recovery; T23 names Language correction/recovery. D19, P11 and R15 are pure and safe to retry, but entry docs do not name the recovery path. No persistence effects exist here. |
| Deep modules / information hiding | 10 | 10 | 10 | 10 | 10 | A hides compilation workflow behind four operations; D hides positional/body grammar; P hides nested owner representations; R hides full/scoped faithful printing; T hides scanning, bounds and coordinates. Deleting each pushes material complexity into callers. |
| Law of Demeter | 10 | 10 | 10 | 10 | 10 | Direct collaborators and data-field access only; no service navigation chains. |
| Immutability | 10 | 10 | 10 | 10 | 5 | A27/36 clones requests and protect freezes owned output; D uses copied Parsed/Fields; P copies records; R constructs readout/source. T30–43 mutates a local token array, scoring the literal local-mutation anchor; no cross-call token state. |
| Type safety | 10 | 10 | 10 | 10 | 10 | No any, unchecked as, or non-null assertion in these five targets; typed cursor/property/domain data and narrowing supply results. |
| Cognitive complexity | 10 | 10 | 10 | 10 | 10 | No prohibited named idioms/nested ternaries found. Measured actual maxima A1,D2,P2,R2,T2. Individual simple ternaries are not the SOP's prohibited nested or spread-ternary forms. |
| Testability | 10 | 10 | 10 | 10 | 10 | Pure arguments and injected public owner roles; no ambient clock/environment/filesystem/network. Public probe reproduced the finding without private-helper mocking. |
| **Total /160** | **153** | **146** | **146** | **146** | **148** | **All >144.** |

## Bounded conclusions

Named-function documentation and explicit returns are present in all five targets. Shared vocabulary feeds declaration checking and printing; mandatory final owner validation remains distinct from unchecked staging. Scalar direction/gap unsets and layout reset probes restored their specified defaults. A one-million-character quoted title parsed successfully; no unsupported stress-performance defect is claimed. Full/scoped framing and provider protection are represented by real source and existing public tests, not host/browser claims. No further defect, preference blocker, extra target or second audit is asserted.
