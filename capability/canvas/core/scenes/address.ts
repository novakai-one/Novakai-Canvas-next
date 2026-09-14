import type { Target } from '../../contract/records/selection.js';
import type { SceneIndex, TargetInfo } from '../../contract/records/scene.js';
import { reject } from '../validation/outcomes.js';
/** JSON tuples preserve section namespaces without delimiter collisions; callers never parse the key. */
export function targetKey(target: Target): string {
  if (target.kind === 'section') return JSON.stringify(['section', target.id]);
  return JSON.stringify([target.kind, target.section, target.id]);
}
/** Section lookup is explicit for all target variants; no encoded scene ID conventions leak. */
export function sectionId(target: Target): string {
  if (target.kind === 'section') return target.id;
  return target.section;
}
/** Resolve a checked interaction target; public transition failure leaves current selection intact. */
export function targetInfo(index: SceneIndex, target: Target): TargetInfo {
  const found = index.targets[targetKey(target)];
  if (!found)
    return reject('unknown-target', targetKey(target), 'The target is not in the displayed scene');
  return found;
}
