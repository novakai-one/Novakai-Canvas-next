# Early corpus manifest

Base `64850c0`. These are the frozen early A/B slots only; no held-out C example is authored.

| Family | Slot | File | Topology | Actual validation |
|---|---|---|---|---|
| ER | A | `er-museum-loans.canvas` | Five layered entities; loan-item junction; optional inspection | CLI create committed, revision 0, workspace sequence 3 |
| ER | B | `er-course-enrollment.canvas` | Five layered entities; composite student, course, offering and enrollment keys | CLI create committed, revision 0, workspace sequence 2 |
| Modules | A | `modules-document-publishing.canvas` | Editor, policy function, publication interface, adapter and external interface | CLI create committed after relationship/font corrections, revision 0, workspace sequence 13 |
| Modules | B | `modules-sensor-gateway.canvas` | Two transport adapters feed typed gateway ports; normalizer function implements interface | CLI create committed after relationship/font corrections, revision 0, workspace sequence 14 |
| Flow | A | `flow-equipment-return.canvas` | Decision branch with repair/recheck cycle and successful close | CLI create committed, revision 0, workspace sequence 4 |
| Flow | B | `flow-research-approval.canvas` | Administrative gate, parallel ethics/methods reviews, merge and revision loop | CLI create committed, revision 0, workspace sequence 5 |
| Sequence | A | `sequence-library-reservation.canvas` | Availability alternative with synchronous reservation and async preparation | CLI create committed, revision 0, workspace sequence 7 |
| Sequence | B | `sequence-payment-settlement.canvas` | Submission loop followed by asynchronous settlement callback | CLI create committed, revision 0, workspace sequence 8 |
| State | A | `state-exhibition-lifecycle.canvas` | Guarded publication with recovery to prior release or withdrawal | CLI create committed, revision 0, workspace sequence 10 |
| State | B | `state-batch-job.canvas` | Retry/backoff cycle, cancellation paths and three terminal outcomes | CLI create committed, revision 0, workspace sequence 9 |
| Tree | A | `tree-field-research.canvas` | Three asymmetric study branches with sampling and record detail | CLI create committed, revision 0, workspace sequence 12 |
| Tree | B | `tree-course-objectives.canvas` | Three learning branches, each with two nested observable objectives | CLI create committed, revision 0, workspace sequence 11 |
| Story | A | `story-evidence-lesson.canvas` | Three represented illustrated stages with evidence, limitation and transfer | Public Language lower passed with admitted metadata; CLI create deferred at asset admission: `create-story-evidence-lesson-01`, line 3 |
| Story | B | `story-safe-deployment.canvas` | Three illustrated stages; nested represented healthy/unsafe signal group | Public Language lower passed with admitted metadata; CLI create deferred at asset admission: `create-story-safe-deployment-01`, line 3 |
| Grid | A | `grid-archive-comparison.canvas` | Three repeated operating-model panels nested in a comparison group | CLI create committed, revision 0, workspace sequence 6 |
| Grid | B | `grid-feedback-methods.canvas` | Illustrated 2x2 comparison of interview, survey, observation and telemetry | Public Language lower passed with admitted metadata; CLI create deferred at asset admission: `create-grid-feedback-methods-01`, line 3 |

All paths are relative to `resources/examples/showcase/`. Every file is a standalone `canvas 1` collection. The service used `http://127.0.0.1:5180` with isolated `.local/workspace-corpus-early`; that workspace is local validation state and is not evidence to commit.
