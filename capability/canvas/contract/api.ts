import type { Canvas, Dependencies } from './types.js';
import { openInput } from './schemas.js';
import { event } from './events.js';
import { gestureInput, defaultProfile, profile } from './records/profile.js';
import { parse, protect } from '../core/validation/outcomes.js';
import { openSession } from '../core/scenes/accept.js';
import { createTransition } from '../core/interaction/transition.js';
import { decideGesture } from '../core/interaction/gesture-policy.js';
import { presentScene } from '../core/scenes/present.js';
import { describeScene } from '../core/accessibility/outline.js';
import { dropTarget } from '../core/drafts/drop-target.js';
/** Create framework-free Canvas behavior; host retains prior state on rejection and owns effect delivery/recovery. */
export function createCanvas(dependencies: Dependencies): Canvas {
  const transition = createTransition(dependencies.sceneAdmission);
  return {
    open: (input) =>
      protect(() => openSession(dependencies.sceneAdmission, parse(openInput, input))),
    transition: (state, input) => protect(() => transition(state, parse(event, input))),
    present: (state, previous) => protect(() => presentScene(state, previous)),
    describeAccessibility: (state) => protect(() => describeScene(state)),
    gesture: (input, settings = defaultProfile) =>
      protect(() => decideGesture(parse(gestureInput, input), parse(profile, settings))),
    dropTarget: (state, point) => protect(() => dropTarget(state, point)),
  };
}
