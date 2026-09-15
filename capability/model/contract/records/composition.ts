import { z } from 'zod';

/** Node chrome is independent of semantic kind; auto preserves the kind's notation. */
export const frameSchema = z.enum(['auto', 'none', 'card', 'panel']);

/** Content order intent; Model requires visible media for either media-led arrangement. */
export const compositionSchema = z.enum(['stack', 'media-top', 'media-left']);

/** Groups own a region treatment, without claiming to be individual semantic cards. */
export const containerFrameSchema = z.enum(['auto', 'none', 'panel']);

/** Typography role changes measured text, never its semantic identity or external position. */
export const textRoleSchema = z.enum(['body', 'caption', 'annotation', 'badge']);

/** Closed parametric figure forms; Presentation owns drawing, so new forms ship with the renderer. */
export const figureFormSchema = z.enum(['vessel', 'layered-bed', 'screen', 'gauge']);

/** Semantic fill levels keep free numbers out of authored DSL; Presentation maps them to geometry. */
export const figureLevelSchema = z.enum(['low', 'half', 'full']);
