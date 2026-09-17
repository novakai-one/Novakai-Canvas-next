# M6.5b source review

Reviewed complete changed production files and their direct contracts/host,
plus extractor and evidence scripts. The sixteen-score order is SRP, OCP, LSP,
ISP, DIP, DRY, KISS, YAGNI, typed outcomes, retry/failure semantics, depth,
Demeter, immutability, type safety, cognitive style, testability.

| Production file | Sixteen scores | Total |
| --- | --- | ---: |
| `capability/canvas/adapters/react-flow/RoadPrototype.tsx` | 10,6,7,10,10,9,9,10,10,10,10,10,8,10,7,10 | 146 |
| `apps/web/cli/templates-scene.ts` | 10,6,7,10,10,9,10,10,10,10,5,10,10,10,10,10 | 147 |
| `capability/layout/contract/records/nested-wires.ts` | 10,10,7,10,10,10,10,10,10,10,5,10,10,10,10,10 | 152 |

These are reviewed deductions, not pre-awarded scores. The renderer retains its
whole-file limitations: fixed categories/policies (OCP 6; RoadPrototype and
NestedWirePaths), three path serializations (DRY 9; NestedWirePaths), camera and
selection concepts together (KISS 9; RoadPrototype), local midpoint/group counters
(immutability 8; wireMidpoint/convergingWireIds), and conditional JSX/record idioms
(cognitive style 7; RoadPrototype/selectionNode). No subtype suite is demonstrated
(LSP exactly 7 for all three).

Renderer evidence for remaining rows: Block and NestedWirePaths paint finished
records (SRP); readonly scene/validator/readiness callbacks are consumed (ISP);
React belongs in the adapter and Layout enters its public contract (DIP);
only requested chrome and text change (YAGNI); injected travel validation retains
its typed result (typed outcomes); the public component comment names reload
reconstruction (failure semantics); the public view hides React Flow records,
selection and SVG wiring (depth); direct data records/local collections (Demeter);
no any/unchecked casts (type safety); finished scenes and callbacks injected,
verified through public rendered behavior (testability).

Host evidence: buildTemplatesScene builds one committed fixture and decorates
finished output (SRP, KISS); fixed fixture/decoration steps (OCP 6); directory
ordering duplicates extractor knowledge (DRY 9); thin fixture wrapper (depth 5).
The measure callback is the only declared collaborator and is consumed (ISP).
Only public Layout imports (DIP), requested label metadata only (YAGNI),
labelWires retains missing/failed wiring unchanged and structured success (typed
outcomes), entry comment names host reload (failure semantics), direct records
(Demeter), immutable spreads and fresh map (immutability), explicit return type
and no unchecked casts (type safety), one optional guard and map (cognitive
style), deterministic committed input and injected measure (testability).
This fixture is not a new public JSON admission boundary.

Wire record evidence: only optional readonly presentation data was added. No
geometry behavior, imports beyond its own declaration record, effects, mutation,
casts, failure path or new implementation. Failure still uses the existing typed
NestedWireResult union. Depth 5 reflects declaration-only data. All other rows
have no identified blemish in this record's own code.

Worst three production findings: renderer/host closed extension axis (6), host
thin wrapper (5), and renderer conditional JSX (7). No unrelated architecture
rewrite or lint exemption was introduced to improve these scores.

CSS adds only `visibility: hidden`, a nonnumeric paint keyword. No token values
or geometry properties change. Hidden DOM port rectangles remain measurable;
the browser checks invisibility on both scenes and both roads modes. The node
and section subtitle spans are actually removed from the DOM.

Terminal evidence follows the retained M6/M6.5a review scope: the `.mts`
extractor and MJS/Python runners report assertion/I/O failures at their process
boundary, not as application capability APIs. No artificial production score is
assigned to process assertion scripts. The extractor now derives admission and
labels from the same checker-filtered name list, avoiding duplicated value
classification. It preserves source order and imported alias spelling, merges
pair declarations, excludes types, and asserts nonempty admitted labels.
Two reruns reproduce the spec/report byte-for-byte. The complete spec's semantic
fields remain equal to M6. Explicit strict TypeScript and Sonar <=2 checks cover
the extractor too (via TS stdin filename because the repository lint glob omits
`.mts`); an initial lint pass exposed overly complex old/new helpers, which were
split without changing extracted geometry. No lint rule was relaxed.

The fresh identity check compares complete serialized Layout output with zero
exclusions, and host output after deleting only wire labels. The unchanged
operation runners compare every report field with M6. Browser evidence retains
the inherited selection assertion body byte-for-byte; URL and screenshot paths
alone are transported to 5191/current output. No new `.test.ts` file or dependency.
