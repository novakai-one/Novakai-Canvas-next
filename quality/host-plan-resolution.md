# Host plan correction — one round

| Finding | Verification | Decision |
|---|---|---|
| HP1 | Original service bullets required production authentication but named bootstrap only for the development proxy and CLI. Same-origin hosting does not issue credentials. | Accepted; exact-Host top-level bootstrap, HttpOnly SameSite session cookie, Fetch Metadata/Origin restrictions, restart recovery and clean-start browser evidence added. |
| HP2 | Original restore bullet required preverification/old-directory preservation but did not bind concurrent admissions, leases, workers or pending request identities. | Accepted; prepare/quiesce/settle/switch lifecycle, workspace generation and no automatic old-request replay added. |

No follow-up audit. The eight-case budget is unchanged. These decisions precede host implementation; no claim of runtime verification is made.
