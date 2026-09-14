import { z } from 'zod';
/** Product interaction values are independent of visual tokens; host stores explicit preferences. */
export const profile = z
  .strictObject({
    version: z.literal(1),
    blankDrag: z.enum(['pan', 'marquee']),
    fineThreshold: z.number().finite().min(1).max(24),
    coarseThreshold: z.number().finite().min(1).max(48),
    zoomMin: z.literal(0.01),
    zoomMax: z.literal(4),
    zoomStep: z.number().finite().min(0.01).max(1),
    nudge: z.number().finite().positive().max(1000),
    coarseNudge: z.number().finite().positive().max(1000),
    fitPadding: z.number().finite().min(0).max(200),
  })
  .readonly();
export type InteractionProfile = z.infer<typeof profile>;
export const defaultProfile: InteractionProfile = Object.freeze({
  version: 1,
  blankDrag: 'pan',
  fineThreshold: 4,
  coarseThreshold: 8,
  zoomMin: 0.01,
  zoomMax: 4,
  zoomStep: 0.1,
  nudge: 8,
  coarseNudge: 32,
  fitPadding: 32,
});
export const gestureInput = z
  .strictObject({
    tool: z.enum(['select', 'hand', 'connect']),
    pointer: z.enum(['fine', 'coarse']),
    button: z.enum(['primary', 'middle', 'secondary']),
    shift: z.boolean(),
    space: z.boolean(),
    typing: z.boolean(),
    interactive: z.boolean(),
    target: z.enum(['blank', 'node', 'wire']),
    distance: z.number().finite().nonnegative(),
  })
  .readonly();
export type GestureInput = z.infer<typeof gestureInput>;
export type GestureDecision = 'ignore' | 'pan' | 'marquee' | 'select' | 'move' | 'connect';
