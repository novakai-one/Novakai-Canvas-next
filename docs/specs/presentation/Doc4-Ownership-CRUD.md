# Capability: presentation — Ownership / CRUD

| Record | Create | Read | Update | Delete |
|---|---|---|---|---|
| Canonical diagram | Model plan/Authoring commit | Injected DomainReader | Never Presentation | Never Presentation |
| Resolved style | Injected DesignSystem/theme resolver | Presentation checked read | Explicit new pin only | Discard derived copy |
| Measured content/anchors | Presentation derives from content + pinned metrics | Layout/Canvas/Export | Reproject changed inputs | Discard |
| Notation/markers | Presentation kind registry | Canvas/Export use same geometry | Versioned registry change | Not user semantic deletion |
| Global geometry/routes | Layout | Presentation renderer receives outer frame only | Never Presentation | Discard derived geometry |
| Media/font bytes | Assets | Injected exact reader/measurement constructor | No substitution | Never Presentation |
| React/markup output | Presentation adapters | Canvas/export hosts | New immutable render input | Unmount/discard |
| Selection/camera/drafts | Canvas | Not needed here | Never Presentation | Never Presentation |

## Integration and recovery

| Path | Result / owner |
|---|---|
| UI/agent prepare→project | Same validated candidate and pinned resources; Authoring owns rejection/recovery |
| Committed read→project→Layout | Measured bounds/anchors; Layout decides feasible global geometry |
| Canvas→NodeContent | Real ReactFlow node wrapper owns gestures; renderer owns readable node internals |
| Export→renderContent | Same measured content and pinned font assets; Export owns document packaging |
| Missing font/image/token | Typed diagnostic identifies affected digest/role/object; host restores resource or user changes input |

No emitted mutation events; projection is derived. Version key includes source, styles, font data identity and measurement/renderer versions; camera/hover never invalidate content measurement. Imported URLs are data, not instructions or fetching authority.
