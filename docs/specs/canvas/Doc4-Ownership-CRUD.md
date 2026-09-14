# Capability: canvas — Ownership / CRUD

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| Committed scene | admitted caller result | Canvas view/index | newest requested scene only | session close |
| Canonical collection | never Canvas | supplied projection only | edit intent→host Authoring planner | reviewed intent only |
| Camera/profile | checked open/preferences | session/renderer | explicit navigation/profile event | close/reset preference |
| Selection | click/keyboard/marquee | inspector request/outline/view | toggle/reconcile surviving targets | Escape/deleted target |
| Active geometry draft | begin gesture | preview | matching gesture updates | cancel/finish/recover |
| Recoverable draft | finish/foreign update/rejection | host recovery UI | explicit acknowledgment/discard | confirmed matching intent or user discard |
| Reading state | enter reading | viewer | next/previous/collapse | exit restores editing view |
| Panel visibility/layout | host only | not Canvas state | inspect effect requests host action | host |
| Text drafts/pending receipts | host only | mutation-available status supplied | host edit-session lifecycle | host |
| React Flow nodes/edges | derived view adapter | React Flow | transient controlled view only | scene reconciliation |
| Subscription | createSession/subscribe | React hook | once per state transition | cleanup/dispose |

Geometry intent is a request, never a committed record. Selection/camera/reading changes create no history entry. Host local draft recovery stores explicit draft DTOs, never serialized trusted Canvas state.
