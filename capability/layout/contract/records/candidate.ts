import { z } from 'zod';
import { identity, inputKey } from '../brands.js';
import { box, point, endpoint } from './geometry.js';
import { PROJECTION_CAPACITY } from './limits.js';
/** Foreign measured payloads remain unknown until compared with the authoritative Projection; no cast mints trusted content. */
const node = z
  .strictObject({
    id: identity,
    parent: identity.nullable(),
    sectionId: identity,
    box,
    measured: z.unknown(),
  })
  .readonly();
const marker = z.enum(['none', 'arrow', 'open-arrow', 'one', 'zero-one', 'one-many', 'zero-many']);
const hiddenLabelBox = point
  .unwrap()
  .extend({ width: z.literal(0), height: z.literal(0) })
  .readonly();
const wire = z
  .strictObject({
    id: identity,
    source: endpoint,
    target: endpoint,
    points: z.array(point).min(2).max(10000).readonly(),
    path: z.string().max(100000),
    labelBox: z.union([box, hiddenLabelBox]),
    measuredLabel: z.unknown(),
    labelVisible: z.boolean().optional(),
    appearance: z.unknown(),
    sourceMarker: marker,
    targetMarker: marker,
    style: z.enum(['solid', 'dashed']),
  })
  .readonly();
const lifeline = z.strictObject({ participant: identity, from: point, to: point }).readonly();
const event = z
  .strictObject({
    id: identity,
    source: identity,
    target: identity,
    points: z.array(point).min(2).max(10000).readonly(),
    labelBox: box,
    content: z.unknown(),
    marker,
    message: z.enum(['call', 'return', 'async']),
  })
  .readonly();
const branch = z
  .strictObject({ id: identity, box, labelBox: box, content: z.unknown() })
  .readonly();
const fragment = z
  .strictObject({
    id: identity,
    parent: identity.nullable(),
    box,
    labelBox: box,
    content: z.unknown(),
    branches: z.array(branch).readonly(),
  })
  .readonly();
const activation = z
  .strictObject({ participant: identity, fromEvent: identity, toEvent: identity.nullable(), box })
  .readonly();
const sequence = z
  .strictObject({
    lifelines: z.array(lifeline).readonly(),
    events: z.array(event).readonly(),
    fragments: z.array(fragment).readonly(),
    activations: z.array(activation).readonly(),
    source: z.array(z.unknown()).readonly(),
  })
  .readonly();
const section = z
  .strictObject({
    id: identity,
    origin: point,
    box,
    title: z.strictObject({ content: z.unknown(), box }).readonly(),
    inputKey,
    nodes: z.array(node).max(PROJECTION_CAPACITY.maxNodes).readonly(),
    wires: z.array(wire).max(PROJECTION_CAPACITY.maxWires).readonly(),
    sequence,
  })
  .readonly();
const warning = z
  .strictObject({
    code: z.union([z.literal('wire-crossing'), z.literal('constraint-relaxed')]),
    targets: z.array(identity).readonly(),
    message: z.string(),
  })
  .readonly();
const adjustment = z
  .strictObject({
    target: identity,
    before: z.union([box, z.array(point).readonly()]),
    after: z.union([box, z.array(point).readonly()]),
    reason: z.string(),
  })
  .readonly();
/** Owned geometry is fully checked; unknown foreign payloads are never reused as rendered content. */
export const candidate = z
  .strictObject({
    collectionId: identity,
    revision: z.number().int().nonnegative(),
    inputKey,
    engineVersions: z.array(z.string()).readonly(),
    sections: z.array(section).max(PROJECTION_CAPACITY.maxSections).readonly(),
    bounds: box,
    warnings: z.array(warning).readonly(),
    adjustments: z.array(adjustment).readonly(),
  })
  .readonly();
export type SceneCandidate = z.infer<typeof candidate>;
export type SectionCandidate = z.infer<typeof section>;
export type NodeCandidate = z.infer<typeof node>;
