# Authoring — sole plan fix round

| Finding | Verification | Decision / correction |
|---|---|---|
| Pins lack planner path | Snapshot contains authoritative records, not this request’s newly resolved aliases; original plan signature had only request/snapshot. | Valid. Explicit immutable pins input; lease reports covered digests, including retained history and template dependencies. Check proposed coverage before commit. |
| Commit settlement / release | An async timeout can return before a detached remote write, permitting GC before binding. Actual planned service uses local synchronous Persistence; the role must prohibit such substitutes. | Valid contract omission. Committer settles/throws only after terminal physical transaction. Keep lease through reconciliation; failed release retains recoverable protection, never replaces committed receipt. |
| Generated ID bound | `head:` plus a maximum 160-character request exceeds both stated RecordId bound and existing storage’s 128-character envelope. | Valid. Record IDs≤128 and request IDs≤120; generated history keys fit without truncation or collisions. |

No second pressure test. All per-document and aggregate word/line increases checked ≤20%. Exact before/after counts are adjacent JSON evidence. No other plan changes made.
