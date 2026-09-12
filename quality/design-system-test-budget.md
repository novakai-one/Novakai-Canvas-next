# Design System frozen test budget

14 fast contract cases / five suites, frozen in Doc5 before implementation. No E2E/slow tests. No existing capability implemented token resolution or these shared primitives. Presentation covers diagram notation; the present cases cover token/style/UI primitive ownership, without duplicating notation tests. Retire each case only when its named public behavior is removed or replaced by an equivalent contract.

Each case catches the specific user-facing failure named in Doc5 with high confidence (90%). The counterargument is fixture maintenance coupling (35%); DOM tests intentionally make no claim about native browser polish/focus/trackpad UX. Real filesystem publication is in-process; no app boots.

|Cases|Tier/type|Budgeted cost|Maintenance|Existing coverage|
|---|---|---|---|---|
|1–7|fast public contract|~0.2s|medium|none for token/theme policy|
|8,9,14|fast build/adapter contract|~0.3s|medium|none for generated token files/style coverage|
|10–13|fast DOM component/target contract|~0.5s|medium|none for these shared components; Part2 browser audits remain required|
|Total|14 fast; 0 slow; 0 E2E|~1s isolated capability| | |

Actual first complete run:14 passed in1.02s across five suites. Full repository126 passed/35files in7.54s. Timing is evidence, not a coverage/correctness score.
