/*
 * Default values and closed word lists shared by the grammar, lowering and `describe`. Plain
 * data, deep-frozen when the module loads, so no caller can change them. Language owns
 * correcting the source; Authoring owns commit recovery.
 */
import { deepFreeze } from '../validation/outcomes.js';

/**
 * The layout algorithm each section `mode` uses when the section names none. Lowering reads it
 * (unknown modes fall back to `flow` there), patching reads it through lowering when a layout is
 * reset, and `describe` publishes it.
 */
export const layouts: Readonly<Record<string, string>> = deepFreeze({
  flow: 'flow',
  er: 'layered',
  modules: 'layered',
  tree: 'tree',
  sequence: 'sequence',
  state: 'flow',
  story: 'grid',
  grid: 'grid',
});

/**
 * The values used when the source leaves a setting out. `describe` publishes the whole record;
 * layout lowering uses `direction` and `gap`.
 */
export const defaults = deepFreeze({
  theme: 'paper',
  role: 'neutral',
  size: 'medium',
  mode: 'flow',
  direction: 'right',
  gap: 'normal',
  collectionLayout: 'grid',
  sourceStatus: 'unverified',
});

/** Every node kind, the word after a node's ID (as in `node @a step "Label"`). */
export const nodeKinds: readonly string[] = deepFreeze([
  'step',
  'start',
  'end',
  'decision',
  'fork',
  'join',
  'entity',
  'module',
  'interface',
  'function',
  'state',
  'participant',
  'concept',
  'system',
  'note',
]);

/** Every wire kind, written as a wire's `kind=` attribute. */
export const relationshipKinds: readonly string[] = deepFreeze([
  'flow',
  'association',
  'imports',
  'calls',
  'implements',
  'contains',
  'parent',
  'reference',
  'transition',
]);
