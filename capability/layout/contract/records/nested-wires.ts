import type { PrototypePoint } from './road-prototype.js';

/** A wire retains explicit corridor ownership for every orthogonal segment. */
export interface NestedWireSegment {
  readonly from: PrototypePoint;
  readonly to: PrototypePoint;
  readonly corridorId: string;
}
/** Gates are ordered along the source-to-target traversal. */
export interface NestedWire {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly sourcePortId: string;
  readonly targetPortId: string;
  readonly gates: readonly string[];
  readonly segments: readonly NestedWireSegment[];
}
/** Failure is data; a reload safely retries without publishing a partial wire set. */
export type NestedWireResult =
  | { readonly ok: true; readonly value: readonly NestedWire[] }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'unroutable-leg';
        readonly wireId: string;
        readonly ownerId: string;
      };
    };
