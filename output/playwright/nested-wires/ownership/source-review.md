# M10f-1 Amendment 1 — source review

Review basis: `docs/standards/CODING-STANDARDS.md` (all sixteen anchors), folder/import contract, and the stricter repository Sonar limit of 2. No pre-awarded scores. P = `capability/layout/core/nested-lane-projection.ts`; B = `capability/layout/core/prototype-nested-scene.ts`. P is diff-scope against 1ff0be8 per ruling #23; B is whole-file. Direct collaborators read: lane assignment records, geometry predicates, road/junction records, capacity, construction registry, junction union and network assembly. Evidence scripts are audit-only under ruling #22, not product imports.

| Principle | P score | P evidence | B score | B evidence |
| --- | ---: | --- | ---: | --- |
| SRP | 10 | 26–60, 248–280: assign ownership while materializing the existing lane plan; no routing or geometry policy added. | 10 | 29–92: assemble one deterministic nested scene. |
| OCP | 6 | 37–45: fixed membership/containment/priority policy has no policy seam; prescribed cap. | 6 | 39–83: fixed steps and concrete core collaborators; prescribed cap. |
| LSP | 7 | 18–24: no subtyping demonstrated; fixed anchor, not a claimed shared contract suite. | 7 | 32–38: no subtyping demonstrated. |
| ISP | 10 | 18–24, 33–35: connector callable and readonly map lookups are the entire consumed behavioral surface. | 10 | 33–40: caller measurement callback is the single operation, consumed throughout construction. |
| DIP | 10 | 1–10: own core and declaration-only records; junction metadata injected by the caller. | 10 | 1–27: own core/declaration-only records; no adapters, React, hosts or other capabilities. |
| DRY | 9 | 37–43: membership is authoritative in junction records and bounds use shared contains; preferred-owner candidate is repeated, causing duplicate validation. | 10 | 41–83: each construction stage is called once; no copied algorithm. |
| KISS | 9 | 37–45: explicit membership → adjacent roads → containment → street priority; multiple temporary candidate arrays and six arguments increase reading burden. | 10 | 39–90: linear pipeline with one early structured failure return. |
| YAGNI | 10 | 24–60: only ownership indexing/validation; no alternate router, retry or fixture branch. | 10 | 80–83: forwards the already-built network junctions; no additional network pass. |
| Typed error outcomes | 10 | 26–27, 45, 68–69: no new throw; unassignable connector preserves the typed original segment for existing public inspection rather than discarding it or inventing success. Existing routing failure is handled before projection by B:76. | 10 | 75–76, 90: preserves the typed routing failure/success union. |
| Idempotency / recovery | 10 | 47–52, 347–359: local index; existing entry comment identifies original failure retention; interrupted pure projection is reconstructed by B's documented caller. | 10 | 29–30: caller reconstruction explicitly named; all scene assembly is invocation-local. |
| Depth / hiding | 10 | 389–401: one internal entry hides membership index, connector selection and segment assembly. | 10 | 32–92: one scene entry hides reservation, demand, capacity, network and projection phases. |
| Demeter | 10 | 37–44: direct reads of supplied records/maps; no navigation into collaborator behavior. | 10 | 74–90: direct returned records and their declared fields. |
| Immutability | 9 | 47–52: local Map mutation, not readonly throughout; input junctions/roads/segments remain unmodified. | 10 | 39–90: const bindings and new returned records; no own shared mutation. |
| Type safety | 10 | 18–60, 264, 393: readonly declared records; guarded optional lookup; no any or unchecked casts. | 10 | 32–38, 76: declared options and narrowing of typed routing result; no casts. |
| Cognitive style | 10 | Added functions use flat collection operations and one guard; no spread/nested ternary idioms. ESLint enforces cognitive complexity ≤2. | 10 | 39–90: straight orchestration with flat failure guard; ESLint ≤2. |
| Testability | 10 | 389–401: all inputs explicit, no clock/DOM/I/O; public-builder differential replay catches Run 1's wrong driveway and admits only J280's street. | 10 | 32–40: explicit semantic spec and optional measurement; deterministic public contract exercised in all five scenes. |
| **Total** | **150/160** | **PASS >144, diff-scope only.** | **153/160** | **PASS >144, whole-file.** |

Worst findings: P and B have fixed extension policy/pipelines (OCP 6); substitutability is not demonstrated (LSP 7); P repeats preferred candidate validation and allocates multiple temporary candidate lists (DRY/KISS 9). Its local index also mutates a Map (immutability 9). These deductions are not waived. The operation-cost increase is printed separately in the report; this review score does not imply constant-cost projection or scene legality.

## General-rule proof and negative control

B:81 builds the construction network once, then B:83 passes its exact registered junction records into P. P:47–52 indexes only `junction.roadIds`. P:37–39 starts from junctions that register the construction-preferred road, admits only junctions containing both connector endpoints, then derives candidate IDs from their membership lists. P:40 restricts candidates to the preferred and previous/current/next construction roads. P:41–44 checks full endpoint containment and gives streets priority over driveways. Among qualifying streets, the existing preferred owner remains first; otherwise stable construction order resolves ties. Axis-aligned rectangular containment of both endpoints contains the complete straight connector. No scene, wire, segment ordinal, road ID, junction ID, coordinate, or fixture name is hard-coded in product code.

P:252–254 and 304 apply this only to connector pieces; the lane-bearing center segment and terminal fan construction remain as before. If no admissible candidate exists, P:45 preserves the existing witness for inspection; it does not certify it as a valid owner. The two diagonal corridor witnesses therefore remain visible.

`verify.mjs after` exercises public `createNestedRoadScene` and `inspectNestedWires`. Its changed-owner assertions require full road containment, a street owner, absence of lane ID, and at least one containing junction registering both old and new owners. `after.json` records exactly w41:16/17 → `section-14:vertical:6208:1552`, registered at J280. The containing driveway from Run 1 is not a member of that junction and cannot enter this candidate set.

Negative control: templates rebuild twice with zero inspection violations and bytes exactly equal to the archived pre-change scene (SHA-256 `f8c7e0cc1902db78521e959bc5b49fce8f274ee2a520003276ffedf84a2844e6`). Default, hub and scale independently retain their entire scene bytes. The rule does not relabel already-correct negative-control outputs.
