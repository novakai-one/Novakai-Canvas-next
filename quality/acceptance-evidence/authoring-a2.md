# Authoring A2 — bounded test-correctness audit

Branch: `feat/authoring-capability`. Sole review round; no implementation or test edits. Scope: `admission.test.ts`, `retries.test.ts`, `history.test.ts`, `failures.test.ts`, and `gates.ts` under `capability/authoring/tests`. Authoring specifications and its own collaborators/fixtures were read as supporting evidence. Other capabilities were not audited.

**Result: no incorrect expected outcome, engineering violation, or major build risk established.** All 14 frozen cases passed across four suites using the existing real SQLite and public Model/Library bridges. Command: `pnpm exec vitest run capability/authoring/tests --reporter=verbose`; reported duration 350 ms.

## Findings

| Classification | Target / scenario | Independently verified result |
|---|---|---|
| minor | `capability/authoring/tests/failures.test.ts:199`: the oversized-input assertion adds an unknown top-level `extra` field. This is a coverage limitation, not an incorrect rejection expectation. | Evaluating the actual public request schema accepted a valid envelope, but rejected both `extra: 'x'` and the 16 MiB string with `unrecognized_keys` for `extra`. Consequently, this assertion would still pass if byte-limit enforcement disappeared while strict envelope validation remained. An oversized value in an otherwise permitted payload would isolate the size requirement within the existing case. |

The implementation's byte limit is present in `core/validation/plain-data.ts`; the finding concerns what the assertion establishes, not a demonstrated missing limit.

## Three assertion challenges

1. **Concurrent retries and lost acknowledgement** — `retries.test.ts:47–110`, supported by `gates.ts:27–44`. Both racing requests reach feasibility after reading their snapshots before the gate releases. The commit bridge forwards real conditional SQLite commits. Independently expected outcomes under A02/A11 are one content revision for identical fingerprints, one winner plus `request-reused` for different fingerprints, and recovery of an already durable receipt after acknowledgement loss. Assertions match these outcomes; unrelated edits retain the unchanged catalog revision.
2. **Undo/redo participant revisions and resource retention** — `history.test.ts:19–60`. The two records begin at revision 0, change to 1, undo to 2, and redo to 3 under A09/A12. Undo must restore both prior resource lists; retained transaction history must include both original and replacement digests. The explicit assertions match these independent expectations. Scripted resource/geometry roles appropriately test admission protocol rather than native resource or geometry correctness.
3. **Oversized request rejection** — the public-schema experiment above confirms that the chosen invalid envelope cannot isolate byte-limit enforcement. Its expected failure is correct; its size-limit evidence is incomplete.

No additional test definitions, E2E work, or second audit was performed. Report is the only file created by this review.
