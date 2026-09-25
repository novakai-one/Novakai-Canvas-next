/** Scene geometry aliases shared by the capture modules. */
import type { RenderDocument } from '../../../contract/records/owners.js';

/** One section of the rendered scene. */
export type SceneSection = RenderDocument['scene']['sections'][number];

/** One node of a rendered scene section. */
export type SceneNode = SceneSection['nodes'][number];
