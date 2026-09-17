# Root cause and bounded cursor investigation

Installed versions: `@xyflow/react` 12.11.6, `@xyflow/system` 0.0.82, d3-drag 3.0.0. The public [React Flow API](https://reactflow.dev/api-reference/react-flow) documents separate `nodeDragThreshold` and `nodeClickDistance` properties. Local installed code, rather than assumptions about latest upstream behavior, drove this fix.

## Click discrimination: configuration fix, no STOP needed

Before: `RoadPrototype.tsx:717` supplied only `nodeDragThreshold={4}`. `onNodeClick` toggled M2 selection at 731–733. The installed React Flow function defaults `nodeClickDistance = 0` in `@xyflow/react/dist/esm/index.mjs:3767`.

`node_modules/.pnpm/@xyflow+system@0.0.82/node_modules/@xyflow/system/dist/esm/index.mjs:2271–2272`:

```js
const d3DragInstance = drag()
    .clickDistance(nodeClickDistance)
```

`node_modules/.pnpm/d3-drag@3.0.0/node_modules/d3-drag/src/drag.js:66–76` compares mouse travel independently of React Flow drag activation:

```js
if (!mousemoving) {
  var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
  mousemoving = dx * dx + dy * dy > clickDistance2;
}
// On mouseup:
yesdrag(event.view, mousemoving);
```

`src/nodrag.js:15–21` installs a temporary capturing `click.drag` listener calling `noevent` when `noclick` is true. A trusted click can therefore appear in the earlier capture observer while never reaching the renderer callback.

Controlled observations:

1. Baseline: zero movement selects; 1.414 px and 2.8 px do not (`baseline/clicks.json`).
2. Change only drag threshold 4 → 3: same failures (`drag-threshold-only/clicks.json`).
3. Match click distance to 3: exact primary and six secondaries pass (`threshold.json`).

Final application configuration: one `nodeGestureThreshold = 3` at 62; `nodeDragThreshold` and `nodeClickDistance` both consume it at 719–720. Matching strict greater-than comparisons leaves no intentional dead zone between click eligibility and drag activation. No new renderer selection architecture is required.

## Cursor: STOP this part after measurement

In the same installed XYDrag file, `startDrag` at 2243–2259 samples the **activation event**, assigns `lastPos = pointerPos`, and calls `getDragItems(..., pointerPos, nodeId)`. `getDragItems` at 2050–2064 records `distance.x = mousePos.x - internalNode.internals.positionAbsolute.x` (and similarly y).

At 2302–2315:

```js
if (!dragStarted) {
    // distance is measured from the initial client coordinates
    if (distance > nodeDragThreshold) {
        startDrag(event);
    }
}
if ((lastPos.x !== pointerPos.xSnapped || lastPos.y !== pointerPos.ySnapped) && dragItems && dragStarted) {
    mousePosition = getEventPosition(event.sourceEvent, containerBounds);
    updateNodes(pointerPos);
}
```

Thus the activation displacement becomes part of the saved grab offset; positive threshold changes do not recover the mousedown offset. In the post-fix dedicated tracking probe, center starts at `(358.600006, 625.520020)`. First pointer moves to `(358.600006, 615.186686)` while center remains fixed and `dragging` is true: deviation **10.333334 px**. Maximum across the path is **10.333340 px**, unchanged from baseline. Same-section swap max is **21.333347 px**; largest across all Track B paths is **57.147725 px** on the cross-section path. Step lengths differ, so these are path-specific maxima, not one universal offset.

Per the brief, stop the cursor portion here. No library patch, zero-threshold workaround, drag-coordinate rewrite or replacement gesture machine was attempted. Lowering activation to zero would activate under-threshold gestures and contradict the required classification. The original cursor assertion remains visibly failed in `track-b-rerun/verify.json`; no tolerance was relaxed and no sample was dropped.
