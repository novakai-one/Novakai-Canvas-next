import { z } from 'zod';
import { options } from './types.js';
import { identity, inputKey } from './brands.js';
import { candidate } from './records/candidate.js';
const metric = z.number().finite().min(0).max(10000);
const marker = z.strictObject({ advance: metric, halfHeight: metric }).readonly();
/** Layout owns supplemental key/cardinality checks; Presentation's reader validates each measured heading. */
const measurements = z
  .strictObject({
    version: z.string().min(1),
    branchHeadings: z
      .array(
        z
          .strictObject({
            section: identity,
            fragment: identity,
            branch: identity,
            content: z.unknown(),
          })
          .readonly(),
      )
      .readonly(),
    markers: z
      .strictObject({
        none: marker,
        arrow: marker,
        'open-arrow': marker,
        one: marker,
        'zero-one': marker,
        'one-many': marker,
        'zero-many': marker,
      })
      .readonly(),
  })
  .readonly();
const job = z.strictObject({ id: identity, inputKey }).readonly();
const shared = { projection: z.unknown(), measurements, options };
export const arrangementRequest = z
  .strictObject({ ...shared, job, previous: candidate.nullable() })
  .readonly();
export const routeRequest = z.strictObject({ ...shared, job, fixed: candidate }).readonly();
export const inspectionRequest = z.strictObject({ ...shared, candidate }).readonly();
export type RawMeasurements = z.infer<typeof measurements>;

/** The host obtains a full job key before starting work; no invented job is needed to calculate it. */
export const keyRequest = z.strictObject({ ...shared, previous: candidate.nullable() }).readonly();
