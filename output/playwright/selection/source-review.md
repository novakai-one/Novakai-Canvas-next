# M2 source review

Reviewed after implementation and browser/full-gate execution against the sixteen anchors in `docs/standards/CODING-STANDARDS.md`. Application TypeScript scores below apply to whole target files, not only added lines. Order: SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, typed outcomes, retry, depth, Demeter, immutability, type safety, cognitive style, testability.

| Target | Scores | Total |
|---|---|---:|
| `RoadPrototype.tsx` | 10, 6, 7, 10, 10, 9, 9, 10, 10, 10, 10, 10, 8, 10, 7, 10 | 146 |
| `roads-prototype.ts` | 10, 6, 7, 10, 10, 10, 10, 10, 10, 10, 10, 10, 8, 10, 10, 5 | 146 |
| `contract/generated/token-names.ts` | 10, 10, 7, 10, 10, 10, 10, 10, 10, 10, 5, 10, 10, 10, 10, 10 | 152 |

Minimum application-source score: 146/160 >144. LSP is 7 (not demonstrated), not a free 10. OCP is 6 for the renderer and host: collaborators/props can change, but adding a scene rendering or boot step edits the file. Sonar's separate executable ceiling is ≤2 per function; the complete successful `pnpm check` is recorded in checks.txt.

## Evidence by target

### capability/canvas/adapters/react-flow/RoadPrototype.tsx

- SRP/ISP/DIP: L537–552, L1071–1081 expose scene viewing, finished geometry, narrow callbacks and readonly wire props. React is the adapter technology; it is not imported into domain core. This file invokes no layout builder or foreign private implementation. Inspector components express the same scene inspection responsibility.
- OCP/LSP: L583–594 explicitly assembles known render categories; changing that set edits the file. No substitutable implementation contract suite is demonstrated.
- DRY/KISS: L1109–1118 repeats existing point serialization for three SVG layers (DRY 9). The file combines old diagnostic selection, camera focus and new semantic primary selection; tracing their separate purpose takes effort (KISS 9). L1143–1157 centralizes neighbourhood/class decisions and makes the wire early exit explicit.
- YAGNI/depth: L558–562 owns one primary ID; L1143–1149 derives a Set, without new capability, cache registry or dependency. The component hides React Flow record assembly, camera, inspection and wire rendering behind its props.
- Typed outcomes/retry: L550–551 and the existing `InspectTravel` contract preserve the injected validator's typed result; L286–292 and L418–423 render verdicts without parsing thrown messages. This synchronous view defines no fallible I/O outcome. L537 documents reload reconstruction; selection replaces state and clearing removes all classes.
- Demeter/type safety: L598 and L1160–1170 read direct Node records and copy them; no collaborator-navigation chain, `any`, or unchecked assertion added. Existing literal `as const` is declaration narrowing.
- Immutability: readonly scene/wire props and copied Node/data records; the local midpoint `remaining` cursor at L1178–1183 earns 8 rather than 10. Geometry is never modified.
- Cognitive style: existing conditional JSX/record assembly across this file meets the SOP's multiple-idiom deduction (7); Sonar's independent function threshold passes.
- Testability: scene/coverage/validation/readiness are injected; browser verification uses the finished scene and independently checks every object. No network/filesystem/ambient clock in the view. React supplies the rendering runtime; fake scene/validator values suffice for behavior.

### apps/web/cli/roads-prototype.ts

- SRP/depth: L43–77 owns the isolated prototype boot pipeline and supplies its completed records to the renderer. It hides style loading, builder selection, coverage/proof construction, timing and mount coordination.
- OCP/LSP: L83–90 selects three existing scene builders explicitly; extension edits this file. There is no subtype contract demonstration.
- ISP/DIP/Demeter: L3–17 imports only public capability entries. The host is the composition boundary, not domain core; it passes the narrow scene validator and ready callback at L69–75. No private implementation import or chained collaborator navigation.
- DRY/KISS/YAGNI: one counter declaration/reset (L19–24), one increment adjacent to the only scene build (L58–59). The pipeline remains linear; no new monitoring abstraction or dependency.
- Outcomes/retry: style creation's typed failure is consumed at L49–51, and the terminal startup boundary at L79–81 handles boot failure and names reload as recovery. There is no exported throwing application API. The ready callback remains the original browser font/frame lifecycle. Reload resets counter and builds fresh deterministic records.
- Immutability: L24/L58 deliberately mutate a browser diagnostic counter (8); no scene mutation. Type safety uses a declared Window field, not an unchecked cast.
- Cognitive style: early returns and simple builder selection, no conditional spread assembly; executable Sonar ≤2 passes.
- Testability: browser document, location, clock and frame APIs are ambient (5). The installed Playwright browser is required for actual readiness evidence; this is not claimed as a pure core module.

### capability/design-system/contract/generated/token-names.ts

Generated readonly name data, now including the three selection opacity names. Zero behavior, framework, I/O, mutation, casts or error paths. Declarations extend from canonical JSON rather than hand-edited variants (OCP/DRY). Depth is 5 for declaration-only data; LSP 7 is not demonstrated. `pnpm tokens:check` regenerates and compares every output. The token suite passes in `pnpm check`.

## Styles, token inputs and executable evidence

The stylesheet uses canonical tokens for the added opacity, colors, outline widths and label lift. definitions.tokens.json owns three new scalar values; generated base/theme/preference CSS and token-name data agree under `pnpm tokens:check`. These declarative assets have no functions to assign Sonar complexity.

The standalone Playwright/Python programs are executable acceptance evidence, following M1.5's documented audit-tool scope, rather than application APIs assigned the application-source score. This distinction is explicit: assertions and browser/I/O failures intentionally terminate the verification process, with the Python runner exposing the actual CLI error. The JavaScript file is linted by the same ≤2 gate with no exemption. Browser checks run against real pointer targets; expected neighbourhoods are written independently of the component helper. All screenshots and metric files are produced after assertions; no fabricated passing output or placeholder test exists.

## Worst three limitations

1. The host's browser APIs remain ambient, reflected in testability 5; counter instrumentation measures the host scene-build entry, with geometry comparison independently guarding view changes.
2. Selection repaint is linear in all rendered roads, ports, lanes and wire segments, not only the selected object's degree. The README states the full cost; no constant-time claim.
3. The large pre-existing view still combines diagnostic panels, camera controls and semantic selection. It repeats SVG point serialization and conditional JSX idioms; DRY/KISS/cognitive-style deductions remain. No scope-expanding extraction or dependency was introduced for this milestone.
