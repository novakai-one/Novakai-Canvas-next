import { z } from 'zod';
import {
  descendantId,
  groupId,
  label,
  objectId,
  relationshipId,
  sectionId,
  size,
} from '../brands.js';
import { layoutSchema, placementSchema, pointSchema } from './layout.js';
import { frameSchema, compositionSchema, containerFrameSchema } from './composition.js';
import { endpointSchema } from './content.js';

/** Section-local view of one object. Omitted overrides inherit semantic defaults or automatic layout. */
export const appearanceSchema = z
  .strictObject({
    object: objectId,
    group: groupId.optional(),
    role: label.optional(),
    size: size.optional(),
    frame: frameSchema.optional(),
    composition: compositionSchema.optional(),
    detail: z.enum(['full', 'summary', 'label']).default('full'),
    participation: z.enum(['tree', 'annotation']).optional(),
    placement: placementSchema.optional(),
  })
  .readonly();

/** Section-local container, optionally representing a canonical object instead of an ordinary appearance. */
export const groupSchema = z
  .strictObject({
    id: groupId,
    title: label,
    parent: groupId.optional(),
    represents: objectId.optional(),
    frame: containerFrameSchema.default('auto'),
    role: label.default('neutral'),
    layout: layoutSchema,
    placement: placementSchema.optional(),
  })
  .readonly();

/** Auto delegates attachment selection to routing; named sides preserve an authored constraint. */
const attachmentSideSchema = z.enum(['auto', 'top', 'right', 'bottom', 'left']);

/** Section-local route of a canonical relationship. Manual points and their lock are preserved together. */
export const wireSchema = z
  .strictObject({
    relationship: relationshipId,
    route: z.enum(['orthogonal', 'curve']).default('orthogonal'),
    sourceSide: attachmentSideSchema.default('auto'),
    targetSide: attachmentSideSchema.default('auto'),
    manual: z.array(pointSchema).min(2).readonly().optional(),
    locked: z.boolean().default(false),
  })
  .readonly();

/** Order is local to parent and optional alt branch; root items omit both references. */
const sequenceScopeFields = {
  id: descendantId,
  parent: descendantId.optional(),
  branch: descendantId.optional(),
  order: z.number().int().nonnegative(),
};

/** A labelled message between visible participant objects, optionally changing activation. */
const sequenceEventSchema = z
  .strictObject({
    ...sequenceScopeFields,
    kind: z.literal('event'),
    source: objectId,
    target: objectId,
    label,
    message: z.enum(['call', 'return', 'async']),
    operation: endpointSchema.optional(),
    activate: z.boolean().optional(),
  })
  .readonly();

/** Named alternative inside one alt fragment; identity is unique across the sequence. */
const sequenceBranchSchema = z.strictObject({ id: descendantId, label }).readonly();

/** alt declares two or more alternatives; opt/loop use an unbranched body, enforced by core. */
const sequenceFragmentSchema = z
  .strictObject({
    ...sequenceScopeFields,
    kind: z.literal('fragment'),
    operator: z.enum(['alt', 'opt', 'loop']),
    label,
    branches: z.array(sequenceBranchSchema).readonly().default([]),
  })
  .readonly();

/** Ordered message or nested control fragment; identities and parent/branch scope are checked by core. */
export const sequenceSchema = z.union([sequenceEventSchema, sequenceFragmentSchema]);

/** Supported diagram modes, each with its own topology and compatible layout algorithms. */
export const modeSchema = z.enum([
  'flow',
  'er',
  'modules',
  'tree',
  'sequence',
  'state',
  'story',
  'grid',
]);

/** One diagram view: visible objects, containers, wires and mode-specific semantic structure. */
export const sectionSchema = z
  .strictObject({
    id: sectionId,
    title: label,
    mode: modeSchema,
    order: z.number().int().default(0),
    layout: layoutSchema,
    appearances: z.array(appearanceSchema).readonly().default([]),
    groups: z.array(groupSchema).readonly().default([]),
    wires: z.array(wireSchema).readonly().default([]),
    root: objectId.optional(),
    sequence: z.array(sequenceSchema).readonly().default([]),
    /** The declared scenario a sequence section shows; `sequence` holds its lowered events. */
    scenario: z.strictObject({ id: descendantId, title: label }).readonly().optional(),
    placement: placementSchema.optional(),
  })
  .readonly();

/** Readonly diagram view within a collection; referenced objects remain collection-owned. */
export type Section = z.infer<typeof sectionSchema>;

/** Ordinary presentation of a canonical object in one section. */
export type Appearance = z.infer<typeof appearanceSchema>;

/** Container whose parent is section-local; represents suppresses a duplicate ordinary appearance. */
export type Group = z.infer<typeof groupSchema>;

/** View-specific route controls for one canonical relationship. */
export type WireAppearance = z.infer<typeof wireSchema>;

/** Message event or control fragment, ordered within its parent and optional alt branch. */
export type SequenceItem = z.infer<typeof sequenceSchema>;

/** Diagram mode used to select topology and layout validation rules. */
export type Mode = z.infer<typeof modeSchema>;
