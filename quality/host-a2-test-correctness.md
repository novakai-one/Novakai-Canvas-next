# A2 — host test correctness audit

Result: **no incorrect assertion found** in the five authorized targets. No implementation or test changes are requested by this audit.

This is the single bounded A2 audit round for `feat/application-integration`. Review began at 2026-09-12 07:19:38 UTC and concluded at approximately 07:22 UTC, within the eight-minute limit. Authority: `AGENTS.md` and the frozen eight-case budget in `docs/integration/Host-Build-Plan.md`.

## Findings

| ID | Classification | Evidence / counterexample | Consequence | Smallest correction |
|---|---|---|---|---|

No verified findings. Missing scenarios or weaker coverage were not reclassified as incorrect assertions to fill the table.

## Claims pressure-tested

| Authorized target | Oracle checked | Assessment |
|---|---|---|
| `apps/cli/tests/commands.test.ts` | Command intent, captured create preconditions, journal-before-transmission, receipt request identity, invalid UTF-8 rejection and retained-ID reuse | The explicit create command selects create mode; receipt expectations distinguish lookup absence from claimed success. The controlled transport and real file/Language boundaries support the assertions made. |
| `apps/web/tests/recovery.test.ts` | Newer typing survives confirmation, only the confirmed collection version advances its base, foreign edits preserve captured preconditions, uncertain recovery does not duplicate transmission, refusal dismissal and retention failure | Checked against the submission/source contracts and their concrete session implementations. Explicit cross-generation retry is caller-requested recovery; it is not automatic replay. No contradictory expected result was verified. |
| `apps/web/tests/render-generation.ts` | An old transport generation is ignored before diagram decoding, fresh generation keeps the viewing session/camera, later snapshot requests win | Checked against workspace render admission and Canvas session update handling. The supplied unchanged document supports session reuse across a service restart; the test does not assert that reuse applies to a restore that lowers revision. |
| `apps/web/tests/authoring.test.ts` | Atomic catalog/collection creation, idempotent receipt recovery, stale and invalid rejection, immediate-parent local placement and stale gesture rejection | Runs the real service owner composition. Canvas exposes `LocalPlacement`; the host preserves those coordinates while Model/Authoring admit the change. The expected revisions and membership changes matched actual execution. |
| `apps/web/tests/preference-recovery.ts` | Admitted token replacement, invalid preference preservation, scope cleanup, restored preferences, system theme response, explicit reset isolation | Checked against Design System preference validation and host preference lifetime. The owner bounds accept text size 18 and reject 200; the host fallback is 14. The token and retained-state expectations passed with real token resolution. |

## Focused execution

Executed with a 60-second subprocess timeout:

```text
pnpm exec vitest run apps/cli/tests/commands.test.ts apps/web/tests/recovery.test.ts apps/web/tests/authoring.test.ts apps/web/tests/rendering.test.ts apps/web/tests/panels.test.ts
```

Result: **5 test files passed; 6 existing cases passed**, runner duration **3.10 seconds**. `rendering.test.ts` and `panels.test.ts` are execution containers for the two authorized helper targets, not additional audit targets. No cases were added and the frozen budget was unchanged. The run emitted Node's experimental SQLite warning and no test failures.

## Limits

The audit targets were exactly the five files above. Supporting fixtures, narrow public contract declarations and implementation collaborators were read only to assess those assertions. No UI, E2E, broad capability, security, performance, or file-standards audit was performed. Controlled transports do not establish real browser storage, socket, worker-timing, or full restore behavior. A passing run and absence of a verified incorrect assertion are bounded evidence, not a claim of exhaustive application correctness. Concurrent unrelated workspace changes were left untouched.
