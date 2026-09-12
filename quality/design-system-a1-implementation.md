# Design System A1 implementation audit

Read-only implementation sample: exactly the five files below, assessed against all five `docs/specs/design-system` documents, root `CODING-STANDARDS.md`, and the literal 16 anchors in `docs/standards/CODING-STANDARDS.md`. Direct Design System collaborators were read as evidence, not additional audit targets. No application host or other capability implementation was audited. No production source or tests were changed. This is the sole A1 pass, completed within the eight-minute limit.

**Outcome:** no confirmed engineering violation or major build risk in this sample. All five file-local scores exceed the strict >144/160 gate. Minor standards limitations are recorded below; passing aggregate checks are not used as substitutes for scores. Findings remain subject to the parent's independent verification.

## Scope and fidelity

All paths in the scorecard are relative to `capability/design-system/`:

| Key | Target | Score | Spec evidence |
|---|---|---:|---|
| A | `core/themes/admit-data.ts` | 153/160 | Lines 25–45 check input/fonts, resolve overrides and validate final bounds/fonts/contrast; 74–85 verify exact UI pin; 94–97 retain supplied preset provenance. Admission/hash allocation remains Templates-owned (Doc2 T09, Doc3). |
| D | `core/themes/diagram.ts` | 153/160 | Lines 26–40 reject inconsistent derived tokens and validate resolved data; 36/72–76 enforce export motion zero; 41–60 distinguish style identity from preset provenance; 79–123 project exact fonts/measurements/role paints (T04–T05/T09). |
| I | `adapters/browser/install-tokens.ts` | 148/160 | Lines 25–33 compare generations and stage full variable replacement before one style-attribute write; 39–51 preserve unowned properties. Public installer validation/lease handling comes from `core/tokens/install.ts:15–31`, wired by `contract/compose.ts:19–20` (T08). |
| P | `adapters/react/panels/PanelSectionHeader.tsx` | 152/160 | Lines 14–25 provide native labelled collapse button, expanded/controls ARIA, controlled callback and sibling action slot. `PanelSectionBody.tsx:7–12` supplies matching IDs/label and hidden retained region (T10–T11). |
| B | `adapters/react/Button.module.css` | 150/160 | Lines 2–17 are module-scoped in the components layer; visual values use tokens; focus, disabled, primary, hover, pressed, pending and icon-only styling map to `Button.tsx:18–33` without opacity shortcuts (T01/T10/T13). |

Preset digest verification is explicitly owned by Templates; its absence from A is not a finding. Native/component DOM evidence does not certify actual visible browser states or whole-application accessibility. Those remain mandatory Part2 work.

## Literal 16-principle scorecard

Each cell scores the target's own code and cites local lines. Private checked exceptions in A/D are assessed at the required public outcome: `contract/api.ts:23–29,60–68` calls them under `protect`, whose `core/validation/outcomes.ts:26–48` boundary catches failures, preserves typed diagnostics and freezes successful detached data. This is not an untyped public error escape.

| Principle | A | D | I | P | B |
|---|---|---|---|---|---|
| 1 SRP | 10: proposed portable theme, 20–45 | 10: pinned diagram style and projection, 18–123 | 10: DOM token-scope target, 4–65 | 10: controlled section heading, 5–27 | 10: button presentation, 3–16 |
| 2 OCP | 6: hash injected, but validation steps/base branches fixed, 23/42–44/64–65 | 6: hash injected, but resolution/validation steps fixed, 24/26–46 | 6: element injected; owned read/replace steps fixed, 4–8/25–33 | 10: host collapse/action behavior supplied through callback/slot, 9–10/19/25 | 10: appearance extension through token inputs, 3–16; fixed native states are the required vocabulary |
| 3 LSP | 7: no subtyping; not demonstrated, 20–24 | 7: no subtyping; not demonstrated, 18–25 | 7: no subclass hierarchy; common alternative-implementation contract-suite evidence not demonstrated, 4–8 | 7: no subtyping; not demonstrated, 5–11 | 7: no subtyping; not demonstrated, 2–17 |
| 4 ISP | 10: Identity's hash consumed by selected UI path, 23/64/77; no fat service port | 10: Identity hash used, 24/42/46; narrow data inputs | 10: two-method ScopeTarget returned, 5–8; installer consumes both in `core/tokens/install.ts:17–18,28–30` | 10: all five props used, 15–25 | 10: no service port; selectors consume Button state attributes, 4–14 |
| 5 DIP | 10: own records/ports/core only, 1–18 | 10: own records/ports/core only, 1–16 | 10: appropriate DOM detail adapter with explicit element, 1–4; no domain policy | 10: React detail adapter uses own contract, 1–3 | 10: detail stylesheet depends on semantic token contract, 3–16 |
| 6 DRY | 10: delegates validation/evaluation/portable representation, 7–18/34–45 | 10: shared evaluator/fonts/values, 9–16; role mapping centralized, 117–123 | 10: snapshot/failure helpers shared by read/replace, 13/15/25/33/35 | 10: collapse/action structure once; matching ID suffixes are protocol, 15–18 | 9: primary hover inset declaration repeated at 7/9 |
| 7 KISS | 10: linear checked transform and two explicit branches, 25–45/62–66 | 10: explicit validation then projection, 26–61/87–110 | 10: read/check/stage/commit is direct, 25–33 | 10: readable native markup/callback, 12–27 | 9: dense one-line declaration blocks impede property scanning, especially 3 |
| 8 YAGNI | 10: only exact UI/preset base paths, 64–65 | 10: diagram/export and required projection, 23/79–123 | 10: read/replace/generation only, 4–8/39–51 | 10: required toggle/actions only, 14–25 | 10: required button states only, 4–16 |
| 9 Typed error outcomes | 10: checked rejects, 66/78, captured by public facade | 10: checked rejects/hash result handling, 29–35/41–46/80–86, captured by public facade | 10: read/replace return Result; catches return structured error, 11/23/54–65 | 10: native control has no owned domain failure; host callback policy explicit, 4/19 | 10: declarative CSS has no executable failure branch; recovery ownership documented, 1 |
| 10 Idempotency/failure semantics | 10: pure proposal; immutable admission owner explicit, 19–45, facade names last-valid recovery | 10: deterministic data projection, 17–61; facade names last-valid recovery | 10: expected-generation guard and host lifecycle/retry named, 3/26/63 | 10: controlled rendering; host reorder/hide owner named, 4/17–19 | 10: repeated stylesheet application has no effect accumulation; correction owner named, 1–17 |
| 11 Deep module/information hiding | 10: one admission-proposal entry hides validation/evaluation/serialization, 20–97 | 10: small resolve/projection contract hides canonicalization, fonts and paints, 18–123 | 10: two-method contract hides staging/preservation/generation, 4–65 | 5: real but thin hiding of toggle ARIA and sibling structure, 14–25 | 5: real but thin hiding of button-state presentation, 3–16 |
| 12 Law of Demeter | 10: data reads/direct helper calls, 25–45 | 10: direct data access/helpers, 87–110 | 10: ownerDocument/style are explicit DOM data/detail boundary, 27–33; no domain service navigation | 10: direct props/callback, 15–25 | 10: local selectors/variables, 3–16 |
| 13 Immutability | 10: readonly inputs/copy assembly, 35–40/48–49/79–86; public outcome frozen | 10: readonly contracts/copy assembly, 36/47–61/90–110; public outcome frozen | 5: local detached style mutation and explicit final DOM mutation, 28–32; no module-global state | 10: readonly props and controlled callback, 5–19 | 10: declarative rules; no runtime state, 2–17 |
| 14 Type safety | 10: unknown checked before use, 22/25–30; no any/assertions | 10: unknown decoded, 20/26; no any/assertions | 10: typed DOM/Result boundary, 4/11/23; no any/assertions | 10: explicit props/ReactElement, 2/11; no any/assertions | 10: no type assertion/any equivalent; token references and selectors explicit, 3–16 |
| 15 Cognitive complexity | 10: measured max 2; no named clever idiom, 52/69 | 10: measured max 2; flat conditional, 18/79 | 10: measured max 2; simple catches/guard, 11/19/50 | 10: measured max 1; plain display ternary, 22 | 10: no functions or nested logic; bounded selectors, 3–16 |
| 16 Testability | 10: source/input/identity explicit, 21–23 | 10: source/input/fonts/pin/scope/identity explicit, 19–24 | 10: element explicit, 4; deterministic DOM runtime suffices | 10: all host state/callbacks explicit, 5–11 | 10: selectors/tokens inspectable with controlled button props; no ambient time/network |
| **Total** | **153** | **153** | **148** | **152** | **150** |

OCP follows the literal cap where an orchestrator owns fixed steps without an injected step seam; YAGNI does not erase that deduction. Adapter mutation receives the literal local-mutation score instead of treating effectful code as immutable. LSP receives no invented perfect score. Non-executable CSS principles are scored on the file's actual declarative surface; no runtime subtype/failure mechanism is invented.

## Findings

| Category | Target/evidence | Assessment |
|---|---|---|
| minor | A:42–44/64–65; D:26–46; I:25–33 | Fixed owned steps have no extension seam. Literal OCP 6 applies; all file totals still pass. No behavior failure asserted. |
| minor | I:28–32; P:14–25; B:3–16 | Literal anchor limitations: DOM mutation is local/effectful (immutability 5); header and button CSS hide real but thin behavior (deep module 5). These are score evidence, not proposed redesigns. |
| minor | B:3/7/9 | Dense property formatting and repeated primary-hover inset knowledge each receive a one-point deduction. No visual-state failure asserted. |

No engineering violation, major build risk or preference finding is asserted. The rows above are the three bounded standards observations, not requests for a speculative refactor.

## Measured verification

Fresh command: `pnpm exec eslint <the four target TS/TSX paths> --rule 'sonarjs/cognitive-complexity: [error, 0]' --format json`. Threshold zero intentionally emits each positive score; exit 1 is expected for this measurement, not evidence of failure at the required threshold 2.

| Target | Positive-score functions (line: score) | Actual maximum |
|---|---|---:|
| A | `baseValues` 52:2; `uiBase` 69:1 | 2 |
| D | `resolveDiagram` 18:2; `projectDiagram` 79:1 | 2 |
| I | `read` 11:1; `replace` 19:2; `isOwned` 50:1 | 2 |
| P | `PanelSectionHeader` 5:1 | 1 |
| B | CSS; no TS function | N/A |

Other target functions/callbacks emitted no positive-complexity diagnostics. All named target functions have explicit return types and attached purpose comments; comments on local `number`/`color` projection closures are not claimed as separately named declaration documentation.

Additional read-only calls ran through `composeDesignSystem()` from the public contract, with shipped source JSON and explicit admitted font metadata. A complete portable payload with only derived `space.2` changed to 999px was rejected with `invalid-input`, path `theme.tokens`; an exact repeated body/mono font pin succeeded; a UI base pin with changed digest was rejected with `stale-pin`, path `paper`. These challenge results support the implementations; they are not behavior failures or newly committed tests.

Builder-reported full check (126 tests/35 files), Design System budget (14 cases/5 suites), and global max-Sonar/documentation evidence were supplied as context. This audit did not rerun or independently certify those global checks. Component tests 12/13 were read for contract evidence only; actual browser visibility, responsive layout and focus behavior remain Part2 gates.
