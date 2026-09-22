import type { ObjectKind } from '../../contract/records/input.js';
import type { Shape } from '../../contract/records/visual.js';
/** Semantic vocabulary maps to local frame shapes; Layout owns all placement. */
const shapes: Readonly<Record<ObjectKind, Shape>> = {
  step: 'card',
  start: 'pill',
  end: 'pill',
  decision: 'diamond',
  fork: 'bar',
  join: 'bar',
  entity: 'entity',
  module: 'module',
  interface: 'interface',
  function: 'function',
  state: 'state',
  participant: 'participant',
  concept: 'card',
  folder: 'card',
  package: 'module',
  system: 'container',
  note: 'note',
};
/** Exhaustive notation policy; adding a Model kind requires an explicit visible shape. */
export function nodeShape(kind: ObjectKind): Shape {
  return shapes[kind];
}
