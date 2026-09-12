# Design System — sole implementation finding resolution

|Finding|Independent verification|Disposition|
|---|---|---|
|A2 case12 stale DOM reference / engineering violation|Parent ran the auditor's temporary Vite mutation. The original case passed while oldConnected=false, oldValue=Unsaved, liveValue=content.|Verified. Re-query live input after reopening; require original node identity, connection and retained value. Same14 cases. The same mutant now fails at the identity assertion; normal implementation passes.|
|A1 dense Button CSS / minor|Audited file used one-line declaration groups, obscuring its property/state rules.|Verified. Formatter expands that stylesheet; no selector/value behavior changed.|
|A1 repeated hover rule / minor|Two rules restate the primary inset outline to override the equally specific icon-only default state.|Duplication acknowledged in conservative score. No speculative selector redesign in this bounded correction round.|
|A1 fixed steps/local mutation/thin frame observations / minor|Actual fixed vocabulary, DOM mutation and small controlled header responsibilities match the cited source.|Score deductions retained. No functional defect established; no unnecessary abstraction added.|

One fix round only; no re-audit. Builder file-local scores remain deliberately more conservative than A1 where private exported functions propagate structured throws, fixed selector vocabulary limits OCP, or DOM target mutation changes shared external state. Both score sets clear>144; they are not averaged.

The mutable-DOM counterexample is a test defect, not a claim that the implementation loses drafts. No new tests or E2E suites. Visible-browser UX remains Part2.
