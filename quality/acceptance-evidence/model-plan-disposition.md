# Model plan findings — one verified correction round

| Finding | Verification | Decision / correction |
|---|---|---|
| MP-01 | Required references contradicted M05 absence for nonforeign keys; baseline DSL only supplies FK references. | Accepted: optional shape; foreign requires present, others absent. |
| MP-02 | Wire lacked lock state; baseline capability contract explicitly distinguishes hard and soft routes. | Accepted: locked flag with required manual points; preserved/reset together. |
| MP-03 | Strict Section lacked placement; baseline explicitly permits manual section positions. | Accepted: section placement and reset-layout coverage. |
| MP-04 | Final delayed reset would erase a later explicit replacement, contrary to statement order. | Accepted: per-operation preservation/reset; test both orders in budget test15. |
| MP-05 | Collection constraints needed section discriminant omitted from union. | Accepted: explicit object/group/section union; context validation unchanged. |

No second plan review. Counts measured by whitespace-delimited words and splitlines; per-document and aggregate limits checked against original baseline. Final counts in model-spec-final-counts.json.
