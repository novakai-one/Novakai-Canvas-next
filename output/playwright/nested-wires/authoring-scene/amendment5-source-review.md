# Amendment 5 — source review after filesystem injection

Reviewed whole files against `docs/standards/CODING-STANDARDS.md`, not the diff alone. Read the filesystem contract, callable extractor, terminal regeneration binding, fake-filesystem verification, independent manifest verifier, committed artifacts, offline builder, layout public exports, `NestedSectionSpec`, `createNestedRoadScene`, and the template fixture collaborator. Scores below are source findings, not inferred from green tests. Sonar <=2 is a separate mandatory gate.

## Callable extractor — `apps/web/cli/extract-authoring-scene.ts`

| Principle | Score | Evidence in target |
| --- | ---: | --- |
| SRP | 10 | 32–182: read source inventory and construct the two traceability artifacts; publication is outside this file. |
| OCP | 6 | 42–182: filesystem collaborator is injected, but traversal/parse/assemble steps remain fixed. Owned step axis lacks a seam; cap applies. |
| LSP | 7 | 12–15: private Error subclass; no shared substitutability suite. Not demonstrated. |
| ISP | 10 | 43–49, 151: uses all 3/3 filesystem methods; entry flow consumes both entry methods and both data fields. |
| DIP | 10 | 2–10, 32–35: owns declaration-only filesystem abstraction; no concrete filesystem/framework dependency. Path arithmetic and TypeScript syntax parsing are deterministic library operations. |
| DRY | 9 | 67, 174: Authoring identity appears in emitted paths and scope prose; other parsing facts use named helpers. |
| KISS | 9 | 42–182: local closures capture invocation-specific inventory/maps; following the long collection scope costs a second pass. |
| YAGNI | 10 | 17–41, 43–182: only required dependency/failure boundary changes; no new resolver or emission policy. |
| Typed error outcomes | 10 | 17–39: every filesystem operation is classified; private typed throws and unexpected failures terminate at the public Result boundary. Structured source is preserved. |
| Idempotency/failure semantics | 10 | 31–40: no writes; correction/retry and CLI publication recovery explicitly named. All inventory is invocation-local. |
| Depth/information hiding | 10 | 32–41: one callable boundary hides traversal, AST handling, import resolution, sections, wires, manifest and error translation. |
| Demeter | 10 | 87–157: direct AST collaborators and data reads; no chained collaborator navigation. |
| Immutability | 10 | 56–182: const derived collections; sorting operates on new arrays; no shared mutation or state across calls. |
| Type safety | 10 | 4–10, 17–39, 78–157: typed AST guards and unknown error source; no any or unchecked casts. |
| Cognitive style | 10 | 24–29, 90–126: flat guards and simple scalar selections, no named nested/spread-ternary idiom; targeted ESLint passed. |
| Testability | 10 | 32–35: filesystem and absolute root supplied by caller; no ambient cwd/clock/env. Memory-only extraction and each failure code verified. |

**151/160 — PASS (>144).** Worst three rows: fixed step axis (6), substitutability not demonstrated (7), then duplicated identity and closure-reading cost (both 9). The original 126/160 review remains valid for the baseline commit, not this version.

The algorithm stays in the existing extractor module; it no longer executes on import. The one-off Amendment-5 regeneration command under `output/playwright` is the terminal edge binding Node filesystem functions. This is the expressly requested fs-injection boundary, not a new capability or a routing refactor.

## Declaration-only contract — `apps/web/contract/ports/authoring-extraction.ts`

| Principle | Score | Evidence in target |
| --- | ---: | --- |
| SRP | 10 | 1–34: declares extraction inputs/outcomes only. |
| OCP | 6 | 15–28: adding failure kinds requires editing the closed union; no extension seam. |
| LSP | 7 | 2–33: interfaces, no implementation/subtyping demonstrated by this target. |
| ISP | 10 | 2–12: extraction consumes all declared filesystem/entry methods. |
| DIP | 10 | 1–34: consumer-owned data types with zero imports or concrete infrastructure. |
| DRY | 9 | 30–33: section shape overlaps Layout's semantic section declaration; retained as this consumer's structural data shape. |
| KISS | 10 | 2–33: direct readonly records and a discriminated Result. |
| YAGNI | 10 | 2–33: only methods, failure kinds and semantic shape used now. |
| Typed error outcomes | 10 | 15–28: named codes, path and original unknown source in a single failure channel. |
| Idempotency/failure semantics | 10 | 8, 25: read-only semantics and correction/retry documented. |
| Depth/information hiding | 5 | 1–34: declarations hide platform-specific entry types but contain no rich behavior. |
| Demeter | 10 | 1–34: no behavior or collaborator navigation. |
| Immutability | 10 | 2–33: readonly fields, callbacks and arrays throughout. |
| Type safety | 10 | 15–28: unknown source and discriminated results; no any/casts. |
| Cognitive style | 10 | 1–34: no executable branching. |
| Testability | 10 | 9–12: fully implementable without a real filesystem; actual memory adapter evidence retained. |

**147/160 — PASS (>144).** Worst rows: declaration depth (5), closed failure vocabulary (6), substitutability not demonstrated (7).

## Offline scene builder — `apps/web/cli/authoring-scene.ts`

| Principle | Score | Evidence in target |
| --- | ---: | --- |
| SRP | 10 | 9–40: build/decorate the committed Authoring fixture offline. |
| OCP | 6 | 12–24: fixed build/decorate pipeline and concrete scene collaborator; cap applies. |
| LSP | 7 | 9–40: no subtyping demonstrated. |
| ISP | 10 | 9–18: narrow options forwarded to the builder; public record types only. |
| DIP | 10 | 2–4: fixture composition uses Layout's public contract, no private capability imports. |
| DRY | 9 | 27–40: label decoration resembles the existing templates adapter; no invented exemption for that overlap. |
| KISS | 10 | 12–40: straight build/map and early guards. |
| YAGNI | 10 | 1, 9–40: only the dark offline fixture; no app entry or alternate routing. |
| Typed error outcomes | 10 | 11, 28–39: preserves the builder's typed routing failure; trusted committed spec, not a JSON admission API. Direct scene collaborator returns structured routing failures. |
| Idempotency/failure semantics | 10 | 6–7: offline caller owns reconstruction; fresh record copies, no persisted scene mutation. |
| Depth/information hiding | 5 | 12–40: thin fixture/label decoration, not a deep engine. |
| Demeter | 10 | 21–37: direct returned records and maps only. |
| Immutability | 10 | 19–40: copies records; no existing scene mutation. |
| Type safety | 10 | 16, 28–37: const tuple narrowing and guards, no any/unchecked casts. |
| Cognitive style | 10 | 28, 35–37: flat guards; no nested/spread ternary. |
| Testability | 10 | 9–18: immutable fixture plus measurement option; no DOM, ambient time, randomness or filesystem calls. |

**147/160 — PASS (>144).** Worst rows: thin adapter depth (5), fixed pipeline (6), substitutability not demonstrated (7). This score is not legality or visual acceptance.

## Existing placement change and evidence-script scope

The unchanged Amendment-2 placement change retains its detailed **146/160** review in `amendment2-placement-review.md`; `534fd8d` contains exactly that reviewed source. Its empty-leaf behavior and unchanged existing-scene bytes are recorded in the adjacent Amendment-2 evidence. No routing source changed in this resume.

Per the brief's ruling-22 scope, standalone evidence scripts under `output/playwright` are exempt from the 160-point product-source score; they still must pass lint, explicit standalone TypeScript checking and deterministic execution. `regenerate-extraction.ts` is a one-off terminal reproduction binding, not product-imported code. It intentionally retains Node's fatal write reporting and documents rerun recovery after partial publication. No gate, threshold, lint exclusion or source-review exemption was added.
