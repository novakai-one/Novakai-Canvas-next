# Templates — one fresh-context plan review

Reviewer templates_plan_pressure; read-only, bounded8minutes, capability-only. No second review. Initial1948words/182lines.

| Category | Finding | Independent verification / one-round fix |
|---|---|---|
| major build risk | Resolved font token string permits ambient alias to survive immutable admission | Verified baseline06 line54 requires alias-to-admitted-font pin. Doc2 font token now contains family+exact digest; manifest must equal sorted unique token digests. DesignSystem owns resolution/contrast, Templates checks pin correspondence. |
| minor | Expansion reachability does not explicitly include theme fonts | Verified expansion with no direct media but a font-bearing theme needs that font retained. Doc2 now requires sorted unique direct media plus reachable theme/base font closure, and exact theme closure. |

Same8test definitions frozen; existing cases5/7 cover verified refinements. Per-file and aggregate word/line growth below20%, counts recorded separately. No Templates parser or token semantic owner introduced.
