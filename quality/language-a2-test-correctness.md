# Language A2 — test assertion correctness

Sole bounded review on `feat/language-capability`. Targets: `capability/language/tests/{documents,engineering,roundtrip,patches,boundaries}.test.ts`. Language fixtures, its public contracts/specifications, and baseline 04 supplied evidence. No other capability internals were audited.

**Result: no incorrect expected assertion or important false-green assertion demonstrated.** No findings to classify as engineering violation, major build risk, preference, or minor.

`pnpm exec vitest run capability/language/tests --reporter=verbose` passed **18 cases / five suites**, reported duration **1.58 seconds**. No production/test edits, permanent probe tests, or E2E work. The report is the only review artifact written.

## Three bounded challenges

| Challenge and target | Independent expected result | Observed result |
|---|---|---|
| Scoped sequence order — `roundtrip.test.ts:25–50`, supported by `engineering.test.ts:50–75` | Reverse physical sequence storage, assign the root `alternatives` rank 10 and `request` rank 100, and retain sparse nested ranks. After public print/lower, the root order must be explicitly `['alternatives', 'request']`; numeric rank gaps and cross-scope array interleaving are nonsemantic under G08. | Exactly that root order returned. The existing test's omission of numeric gaps is consistent with G08. Its original source fixture also has an explicit expected ID sequence in case 7, rather than relying solely on print/parse equality. |
| Existing pin preservation and resource refusal — `patches.test.ts:6–37`, `boundaries.test.ts:98–106` | Give the stored collection `paper@2.0.0` with a `b…b` digest while supplied alias metadata still describes `paper@1.0.0` with an `a…a` digest. An unrelated title patch must preserve the stored pin. Creating a document requesting the unavailable exact version-2 pin must reject. | The title patch retained the exact version-2 ID/version/digest/roles. Exact-pin creation rejected with `missing-resource`. Existing manual-preservation assertions compare against independently constructed canonical geometry and appropriately leave native feasibility outside Language. |
| UTF-8 bytes and token bounds — `boundaries.test.ts:27–38` | A valid document padded by an ASCII comment to exactly 16,777,216 bytes must parse. A comment producing 16,777,247 UTF-8 bytes but only 8,388,639 UTF-16 code units must reject with `limit`. A 250,001-word lexical stream must hit the token limit; a 249,999-word stream must proceed to ordinary grammar rejection. | Exact-byte-limit input parsed; multibyte overflow returned `limit`. The two token streams returned `limit` and `unsupported-version`, respectively. This independently distinguishes byte counting from JavaScript string length and token limiting from the malformed grammar of the stress fixture. |

Probes called public Language operations with real public Model roles; expected order and byte counts were specified independently. No source mutation was used to obtain results. The probes strengthen review evidence but are not additional frozen acceptance cases.

## Coverage distinction

The permanent byte-bound fixture is ASCII-only, and the grouped round-trip variant has only one appearance in each checked scope. Those are finite-fixture coverage limits, not evidence that their existing assertions are wrong. This review does not claim exhaustive grammar, Unicode, resource, or patch coverage, and does not infer browser/host readiness from parser tests.
