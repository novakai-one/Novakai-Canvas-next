# Canvas — sole implementation correction round

A1/A2 each completed one bounded pass. Findings were independently checked against the named source paths and executable behavior; no second audit occurred.

| Finding | Verification | Correction / remaining consequence |
|---|---|---|
| A1 modal ownership | Adapter sent modal:false and ignored defaultPrevented; core gate could not recover discarded ownership. | Native-target policy includes modal descendants; default-prevented keys return untouched. Existing16 checks both paths. |
| A1 successful diagnostic loss | UI dispatch consumed only failed Results; successful listener diagnostics had no host path. | Forward each successful diagnostic as a single callback argument; existing16 proves the supplied host callback receives listener-failure. |
| A1 stale editable cache | Hand keeps both draggable/connectable false; cached view identity cannot imply unchanged permission. | Compare data.editable explicitly. Existing15 disables mutation while Hand is active and requires resize controls to disappear. |
| A1 reducer diagnostic loss | Store commit replaced, rather than combined, incoming diagnostics. | Preserve reducer and listener diagnostics; existing14 supplies a successful diagnostic-producing reducer. |
| A1 reconcile failure signature | Exported receiveScene could throw despite Transition return type. | receiveScene returns Result<Transition>; private processing is caught at that entry and typed outcome consumed by dispatch. |
| A1 readability/role deductions | Handler chose unused subscribe method, repeated identity encoding, retained pointer closure and read browser globals. | Narrow session role; one identity helper; pointer lifecycle owned by session; native-target/observer bindings injected at composition. Recovery owner documented at entry points. |
| A1 repeat edit effects | Repeated identical edit intent ID could queue another effect after drain. | Session remembers bounded accepted intent fingerprints; same intent replays without another effect, conflicting/mixed reuse rejects. Ordinary pan/select events intentionally remain repeatable. Existing14 asserts repeated duplicate ID produces no second effect. |
| A2 resize oracle | Original case only checked unchanged minimum dimensions. | Existing6 now finishes changed resize and asserts literal parent-local x/y/width/height. Known world-coordinate mutant fails6. |
| A2 stamp oracle | Original stale scene also differed in revision, concealing missing generation/hash checks. | Existing8 isolates generation and inputKey mismatches. Known equality mutant fails8. |
| A2 mounted drag wiring | Original drag checks called standalone handlers before mounting Surface. | Existing16 sends bubbling mouse events through mounted React Flow and asserts one literal placement intent. Known disconnected-props mutant fails16. It also exposed discarded measured dimensions on controlled-record replacement; records now retain their admitted dimensions. |

Original assertion weaknesses verified by A2 with all9 targeted cases remaining green under each fault. Parent repeated exactly those three faults after corrections: each fails its intended assertion, other8 pass. Config transforms were temporary and never changed repository source. This is verification of named findings, not a second audit or extra test budget.

All16 Canvas cases and142 repository cases pass. Sonar maximum2 across71 Canvas TS/TSX files. These results do not establish visible-browser UX or per-file standards compliance.

**Standards gate remains open.** The independent before-fix scores are138/119/141/146/133. Do not turn necessary cross-call mutable session/cache storage into a claimed immutable10, or invent a second implementation to award LSP10. The fixes improve the documented roles and behavior, but unchanged literal scoring constraints and the complete file-local score ledger must be resolved before release. This PR is a review checkpoint, not a completion claim for Part1 or the app.
