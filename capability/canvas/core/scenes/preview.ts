import { ancestorKeys } from './ancestry.js';
import type { SessionState } from '../../contract/records/state.js';
import type { TargetInfo } from '../../contract/records/scene.js';
import { targetKey } from './address.js';
import type { Box, Point } from '../../contract/records/camera.js';
/** Find the nearest explicitly moved ancestor; top-level normalization guarantees only one delta applies. */
function movedAncestor(state: SessionState, info: TargetInfo): Point {
  if (state.draft === null || state.draft.kind === 'route') return { x: 0, y: 0 };
  return ancestorDelta(state, info);
}
/** Traverse immutable indexed parents; no measured node or stored placement changes during preview. */
function ancestorDelta(state: SessionState, info: TargetInfo): Point {
  return (
    ancestorKeys(state.index, info.key)
      .map((key) => entryDelta(state, key))
      .find((delta) => delta !== null) ?? { x: 0, y: 0 }
  );
}
/** A changed mover can have a zero translation during resize, which must still stop ancestor lookup. */
function entryDelta(state: SessionState, key: string): Point | null {
  const entry = draftEntry(state, key);
  if (entry === null) return null;
  const original = state.index.targets[key];
  if (!original) return null;
  return { x: entry.x - original.box.x, y: entry.y - original.box.y };
}
/** Section and node addresses are already checked; equality uses their stable index key. */
function draftEntry(state: SessionState, key: string): Box | null {
  const draft = state.draft;
  if (draft === null) return null;
  return placementEntry(draft, key);
}
/** Only placement drafts have target boxes; route draft coordinates stay in section space. */
function placementEntry(draft: NonNullable<SessionState['draft']>, key: string): Box | null {
  if (draft.kind === 'route') return null;
  const entry = draft.current.find((item) => targetKey(item.target) === key);
  return entry?.box ?? null;
}
/** Return original box by reference when untouched; hot React node props can remain stable. */
export function previewBox(state: SessionState, info: TargetInfo): Box {
  const own = draftEntry(state, info.key);
  if (own !== null) return own;
  const delta = movedAncestor(state, info);
  if ([delta.x, delta.y].every((value) => value === 0)) return info.box;
  return { ...info.box, x: info.box.x + delta.x, y: info.box.y + delta.y };
}
/** Collapsed parents hide descendants without changing canonical visibility or inventing aggregate edges. */
export function hiddenByReading(state: SessionState, info: TargetInfo): boolean {
  if (state.reading === null) return false;
  const collapsed = new Set(state.reading.collapsed);
  return ancestorKeys(state.index, info.key).some((key) => collapsed.has(key));
}
