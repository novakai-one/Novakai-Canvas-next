import type { PrototypePoint } from './road-prototype.js';
export interface PrototypeProofPath {
  readonly points: readonly PrototypePoint[];
  readonly connectionIds: readonly string[];
  readonly laneIds: readonly string[];
}
export interface PrototypeRoadProof {
  readonly id: string;
  readonly title: string;
  readonly junctionId: string;
  readonly portId: string | null;
  readonly primary: PrototypeProofPath;
  readonly through: PrototypeProofPath;
  readonly crossings: readonly PrototypePoint[];
}
