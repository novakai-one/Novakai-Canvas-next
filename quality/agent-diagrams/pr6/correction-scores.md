# PR6 correction — literal builder scores

Author implementation evidence for the authorized correction, not an independent audit. P1–P16 follow `docs/standards/CODING-STANDARDS.md` exactly; passing execution does not award source points. LSP is7 throughout: no subtype contract suite is demonstrated in these target files. Thin modules retain P11=5. No native/test interpretation waiver is applied.

O=P2=6 (fixed owned steps/vocabulary); L=P3=7; E=P9=5 (structured/assertion exceptions absent from value signatures); R=P10=8 (safe retry, incomplete entry-level owner naming); T=P11=5 (real but thin hiding). Other deductions are explicit below. P4=10 means no target-declared behavioral port or all chosen methods are consumed through its flow. P9/P10=10 for declaration-only records denotes no callable failure/effect. Runtime P9=10 requires typed outcomes or a total pure operation on admitted records.

|File|P1–P16|Total|Sonar max|Gate|
|---|---|---:|---:|---|
|[capability/canvas/core/scenes/validate.ts](../../../capability/canvas/core/scenes/validate.ts#L11)|10,6,7,10,10,10,9,10,5,10,10,10,10,10,10,10|147|2|PASS|
|[capability/layout/contract/records/engines.ts](../../../capability/layout/contract/records/engines.ts#L2)|10,6,7,10,10,10,10,10,10,10,5,10,10,10,10,10|148|0|PASS|
|[capability/layout/core/routing/obstacles.ts](../../../capability/layout/core/routing/obstacles.ts#L19)|10,6,7,10,10,10,10,10,10,8,5,10,10,10,10,10|146|1|PASS|
|[capability/layout/core/routing/wires.ts](../../../capability/layout/core/routing/wires.ts#L248)|10,6,7,10,10,9,10,10,5,10,10,10,10,10,9,10|146|2|PASS|
|[capability/layout/core/validation/wires.ts](../../../capability/layout/core/validation/wires.ts#L107)|10,6,7,10,10,10,10,10,5,10,10,10,10,10,9,10|147|2|PASS|
|[capability/presentation/contract/api.ts](../../../capability/presentation/contract/api.ts#L14)|10,6,7,10,10,10,10,10,10,10,10,10,10,10,10,10|153|0|PASS|
|[capability/presentation/contract/records/content-context.ts](../../../capability/presentation/contract/records/content-context.ts#L6)|10,6,7,10,10,10,10,10,10,10,5,10,10,10,10,10|148|0|PASS|
|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts#L87)|10,6,7,10,10,9,10,10,5,10,10,10,10,10,9,10|146|2|PASS|
|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts#L32)|10,6,7,10,10,10,10,10,5,10,10,10,10,10,10,10|148|1|PASS|
|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts#L137)|10,6,7,10,10,9,10,10,5,10,10,10,10,10,9,10|146|2|PASS|
|[capability/presentation/core/validation/capacity.ts](../../../capability/presentation/core/validation/capacity.ts#L31)|10,6,7,10,10,10,10,10,10,10,5,10,10,10,10,10|148|1|PASS|
|[capability/presentation/core/validation/interchange.ts](../../../capability/presentation/core/validation/interchange.ts#L84)|10,6,7,10,10,10,10,10,5,10,10,10,10,10,10,10|148|1|PASS|
|[capability/layout/tests/routing.test.ts](../../../capability/layout/tests/routing.test.ts#L672)|10,6,7,10,10,9,9,10,5,8,9,10,10,10,7,0|130|2|OPEN|
|[capability/presentation/tests/notation.test.ts](../../../capability/presentation/tests/notation.test.ts#L4)|10,6,7,10,10,10,9,10,5,8,9,10,10,10,10,0|134|0|OPEN|

## File evidence

- [capability/canvas/core/scenes/validate.ts](../../../capability/canvas/core/scenes/validate.ts#L11): O,L,E; recursive immutable ancestor tracing retains the existing KISS9 deduction. Only the inaccurate recursion comment changes; validateScene at86 names recovery.
- [capability/layout/contract/records/engines.ts](../../../capability/layout/contract/records/engines.ts#L2): O,L,T; frozen fixed version registry. Policy8 invalidates geometry keys; no behavior or failure is hidden in this declaration.
- [capability/layout/core/routing/obstacles.ts](../../../capability/layout/core/routing/obstacles.ts#L19): O,L,R,T; thin pure footprint policy. labelObstacles names recovery, older exported helpers do not. groupBorders at23 uses measured stroke, with four strips; contentBoxes at13 remains border-free.
- [capability/layout/core/routing/wires.ts](../../../capability/layout/core/routing/wires.ts#L248): O,L,E; retained DRY9 for occupied-region assembly at30/174/216 and P15=9 for curve/line selection at45. Only label occupation changes; actual routing/jobs methods are consumed. Manual retention at158 and bounded alternatives at114 remain intact.
- [capability/layout/core/validation/wires.ts](../../../capability/layout/core/validation/wires.ts#L107): O,L,E; P15=9 for curve/line selection at35. Label checks at73 use border strips; route/marker checks still use contentBoxes. Entry TSDoc names Layout inspect and Authoring recovery.
- [capability/presentation/contract/api.ts](../../../capability/presentation/contract/api.ts#L14): O,L; protected public Results, with both rendering methods consumed across the API. Projection receives four required providers plus rendererVersion; helper failures stay inside protect.
- [capability/presentation/contract/records/content-context.ts](../../../capability/presentation/contract/records/content-context.ts#L6): O,L,T; readonly fixed measurement vocabulary. Optional canonical owner is necessary because section headings have no object; no new behavior or fallback is added to the declaration.
- [capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts#L87): O,L,E; conservative DRY9 for text-request assembly shared with node.labelContent, P15=9 for text role selection at14. Field lookup at92 is owner-scoped and rejects missing/non-field descendants; captions preserve member order. Entry names protection/recovery.
- [capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts#L32): O,L,E; real ISP5→10 correction: ProjectionDependencies at10 has rendererVersion only. Named boundary/recovery supports P10=10. Canonical key still serializes renderer metadata under the original renderer key; outline measurement receives each canonical owner.
- [capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts#L137): O,L,E; conservative DRY9 for ordinary/group frame metadata at137/185 and P15=9 for shape scaling at118/280. Canonical owner is scoped before content planning and survives compact measurement; represented groups delegate through projectNode.
- [capability/presentation/core/validation/capacity.ts](../../../capability/presentation/core/validation/capacity.ts#L31): O,L,T; real P9=5→10 correction through Result<void>. P11 stays5: aggregate counting/comparison is useful but thin. Shared32/1000/1500 policy and counts at14/22 remain unchanged; producer/reader unwrap under protect.
- [capability/presentation/core/validation/interchange.ts](../../../capability/presentation/core/validation/interchange.ts#L84): O,L,E; reader unwraps typed capacity rejection inside the existing readMeasuredProjection protection. Canonical equality, identity rebinding, detached records and recovery ownership are retained.
- [capability/layout/tests/routing.test.ts](../../../capability/layout/tests/routing.test.ts#L672): O,L,E,R; retained DRY9 for repeated inspection setup, KISS9 for staged cases, P11=9 broad scenario interface, P15=7 existing conditional-return idioms. Actual Wasm is required (P16=0). Existing PR4/PR5 positive, manual, marker and lane assertions remain unchanged; additions exercise root/nested borders and entering/exiting manual retention.
- [capability/presentation/tests/notation.test.ts](../../../capability/presentation/tests/notation.test.ts#L4): O,L,E,R; KISS9 for staged canonical/render/symbol checks, P11=9 for the broad case boundary. Real pinned font bytes/fontkit/render composition are required (P16=0), despite successful execution. Assertions are distinguishable exceptions, not typed Result outcomes. Duplicate descendant IDs, object/field namespace collision and compact captions are covered.

Remaining10s are supported by the target code: focused responsibilities; owned declaration/core imports; no speculative seams, unchecked casts or ambient production I/O; direct record access; readonly/copy-based operations; injected providers or pure data. Named stages hide measurement/admission/routing behavior rather than forwarding unused methods. Sonar values below are measured independently of the rubric's readability deductions.

The corrected capacity and collection files score148 each (formerly143/141). All12 touched production files exceed144; the two real-infrastructure test files remain OPEN at130/134. Existing unmodified native/test findings remain pending, including libavoid137 and prior contracts/arrangement test124 scores. No claim of complete repository certification is made.

## Exact source receipts

|File|SHA-256|
|---|---|
|capability/canvas/core/scenes/validate.ts|`dd261150a54f0ac22a69c6e3780f163e7ceba4d7cf06182b6b178c048194b448`|
|capability/layout/contract/records/engines.ts|`4edee76ddc3cb93ed3b56f2c86123ac4a5d983c75ad600e7d38df1f750cb358b`|
|capability/layout/core/routing/obstacles.ts|`e51778b8a7d2c647dc630eec390b10d64daec205035d33654f8b97fe24c88d99`|
|capability/layout/core/routing/wires.ts|`9ab45c3ec6b8a4a32b9091c6ba1603ddca3e36c65cf3887d9adab89aef3eb878`|
|capability/layout/core/validation/wires.ts|`f38203eee1bafd01cb26d2b728718ed45636915ede832b152ee26e29a65d8473`|
|capability/layout/tests/routing.test.ts|`85ca7e185295bd711a39fc9bb7a42ceadd18d9de3bc694750af2a0b23cfe5982`|
|capability/presentation/contract/api.ts|`e4c36e2aee15cb3a7b0239911a59205d5252a2188b6f7568cd2abe57326f09ef`|
|capability/presentation/contract/records/content-context.ts|`e70ea592049be5178e70d35254d8e4ec0f11db401325466256e05ccf635703d3`|
|capability/presentation/core/content/blocks.ts|`bfcb2219ca25c97f8ebc012e81a60146fd27bfc36be2dc443fbae43f650483a4`|
|capability/presentation/core/projection/collection.ts|`178a67efb696989d8b0345a4ef830c4764780ebe191f878b70c6f7cf7397b09f`|
|capability/presentation/core/projection/node.ts|`17b557778c394f73cbe69f80fe4215afee0013e370aec5346b7a0e1d2841780b`|
|capability/presentation/core/validation/capacity.ts|`48487678141b063f32fc725d66c728ad9e9ce62f4967444f144fd0b12fc4c790`|
|capability/presentation/core/validation/interchange.ts|`63be8b59f4e4ce6e17e4d593eabb7b376ca1679e8702de98e77e02cc9e8b9af3`|
|capability/presentation/tests/notation.test.ts|`f9e569a1c63d302d8e04b18643867168d4e1d873b516af8bbb2c797a11d2f188`|
