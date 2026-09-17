# M5 changed-output report

Full pipeline recompute: all roads, driveways and wires are rebuilt once. This report describes changed outputs, not avoided work.

Moved nodes: 2; changed main roads: 8; changed driveways: 25; roads with changed lane records: 12; changed wires: 16/26; changed junctions: 36; changed sections: 0.

- node-1: {"x":272,"y":400,"width":192,"height":96} → {"x":272,"y":800,"width":192,"height":96}
- node-4: {"x":272,"y":800,"width":192,"height":96} → {"x":272,"y":400,"width":192,"height":96}

Changed road and driveway records, lane records and their exact before/after values are retained in dirty-set.json.

- w01: Incident to node-1; endpoints and law geometry change.
- w02: Incident to node-1; endpoints and law geometry change.
- w03: Incident to node-4; endpoints and law geometry change.
- w09: Incident to node-4; endpoints and law geometry change.
- w10: Shared-road load/rank or junction geometry shifts: drive:section-2:exit-bottom, section-1:horizontal:1048:200, drive:section-1:exit-bottom; 0 lane assignment records change.
- w12: Shared-road load/rank or junction geometry shifts: drive:section-1:entry-left, section-1:vertical:200:248, section-1:horizontal:248:200, drive:section-2:entry-top; 0 lane assignment records change.
- w15: Incident to node-1/node-4; endpoints and law geometry change.
- w16: Shared-road load/rank or junction geometry shifts: drive:section-2:exit-bottom, section-1:horizontal:1048:200, drive:section-1:exit-bottom; 1 lane assignment records change.
- w18: Shared-road load/rank or junction geometry shifts: drive:section-1:entry-left, section-1:vertical:200:248, section-1:horizontal:248:200, drive:section-2:entry-top; 0 lane assignment records change.
- w19: Shared-road load/rank or junction geometry shifts: drive:node-2:exit-bottom, section-1:horizontal:648:200, drive:node-23:entry-top; 0 lane assignment records change.
- w20: Incident to node-4; endpoints and law geometry change.
- w21: Shared-road load/rank or junction geometry shifts: section-1:vertical:2488:248, section-1:horizontal:1048:200, section-1:vertical:536:248, drive:node-23:entry-left; 2 lane assignment records change.
- w22: Shared-road load/rank or junction geometry shifts: drive:section-2:exit-bottom, section-1:horizontal:1048:200, section-1:vertical:536:248, drive:node-23:entry-left; 2 lane assignment records change.
- w23: Shared-road load/rank or junction geometry shifts: drive:section-1:entry-left, section-1:vertical:200:248, section-1:horizontal:648:200, drive:node-23:entry-top; 1 lane assignment records change.
- w24: Shared-road load/rank or junction geometry shifts: drive:section-1:entry-top, section-1:horizontal:248:200, section-1:vertical:536:248, drive:node-23:entry-left; 0 lane assignment records change.
- w26: Shared-road load/rank or junction geometry shifts: drive:node-24:exit-bottom, section-1:horizontal:1048:200, drive:section-1:exit-bottom; 0 lane assignment records change.

| Compile stage | Default | Swapped | Delta |
|---|---:|---:|---:|
| wire-registry | 928 | 928 | +0 |
| lane-allocation | 3790 | 4067 | +277 |
| network | 11021 | 11020 | -1 |
| lane-projection | 3944 | 4092 | +148 |

Total: 19683 → 20107 (+424), ceiling 21,000.

Wire-registry remains unchanged because node/section/road identity counts are unchanged. Lane-allocation grows with the different shared-route congestion and ordering comparisons. Network loses one operation because changed capacity geometry alters a numeric branch. Lane-projection grows with the new lane ranks, turns and terminal coordinates. These are measured executions of the unchanged stages, not extra stage invocations.

Scene variance, not compounding: congestion changes allocation/projection work while discovery stays zero and every stage executes once.
