# Capability: design-system — Ownership / CRUD

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| Token definitions/recipes | shipped source | reader/resolver/compiler | explicit versioned source change | compatibility decision |
| UI theme delta | theme editor/build input | resolver | new validated version | host preference lifecycle |
| Diagram theme/preset | not Design System admission | supplied immutable payload | proposed resolved data only | Templates retention authority |
| Personal preferences | host | resolver receives data | host stores chosen four-field input | host |
| Resolved scope | resolver | UI/Presentation/Export bridge | new immutable resolution | caller lifetime |
| CSS installation | scoped installer | owning element | full validated replacement | owned generation cleanup |
| Generated artifacts | compiler | pinned manifest reader | publish new immutable generation | build-output retention |
| Panel collapse/layout | host | controlled props | emitted callbacks only | host |
| Component focus/menu state | native/Radix adapter | accessibility view | user interaction/controlled props | component lifecycle |

No Diagram write, preset commit, preference persistence, selection/camera state or editor mutation is introduced by this capability.
