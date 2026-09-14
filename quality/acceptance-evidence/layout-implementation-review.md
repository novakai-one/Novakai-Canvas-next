# Layout sole implementation audit and verified fix

Two read-only auditors, each stopped within8minutes. A1 target sample exactly5files; A2 exactly5testfiles. No re-audit. Twelve test definitions retained. Before-fix scores and source evidence remain separately recorded.

|Category|Reviewer finding|Independent author verification / single fix|
|---|---|---|
|major build risk|A1 activation state crossed mutually exclusive alt branches; independent inspector approved regenerated defect|Verified against prior state reducer and public scenario: yes/branchCall activate=true was ended by no/branchReturn activate=false. Scope-aware immutable stacks now prevent incompatible paths sharing activity; conditional closures retain shared parent state until all alternatives close. Unclosed branch activity ends in its own band. A separate inspector checks canonical start/end metadata and conflicting alternative memberships without using the builder's state algorithm. Existing case6 reproduces and rejects forged cross-branch intervals.|
|engineering violation|A1 pipeline/wires chose unconsumed dependency roles, violating ISP and >144 score gate|Verified pipeline never reads ProjectionReader; wires/native only call routing/jobs. GeometryDependencies excludes owner reader; WorkContext has consumed seed/placement/routing/derivation subsets. The same declared context flowed into placement/group/collection helpers, so those use the appropriate narrowed type; keys accepts version data only. Runtime behavior unchanged.|
|minor|A2 cleanup description claimed more than destruction-attempt evidence proves|Verified fake handle logs before throwing. Case10 wording now says every cleanup is attempted; reverse order/continuation assertion retained. No successful destructor outcome is falsely inferred.|
|minor|A2 curve case lacked independent rounded-path clearance evidence|Verified original curve case was a straight two-point corridor plus public inspection. Existing case8 now creates real obstacle curves, requires quadratic bends and independently evaluates each Bezier at three interior parameters against the obstacle. No new test definition.|

A1 original scores /160: pipeline140, wires140, activations146, sections146, libavoid148. OCP6 and LSP7 retained. Core private structured throws conservatively P9=5. Pipeline/wires DRY9 and unnamed recovery8 retained; narrowing ISP5→10 gives145 each. Activation's named recovery doc now earns P10=10. No grader was asked to approve revised code.

A2 found no false geometry assertion or major build risk. It independently counted1000nodes/1500wires and confirmed manual crossing at(368,350). Its scale run was4.601seconds, focused run5.03seconds. These are backend tests, not browser UX/performance signoff.
