/** Milestone-one records only. Roads own geometry independently of nodes and future wires. */
export interface PrototypeBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export interface PrototypeBlock {
  readonly id: string;
  readonly label: string;
  readonly bounds: PrototypeBounds;
}
export interface PrototypeRoad {
  readonly id: string;
  readonly sectionId: string | null;
  readonly kind: 'street' | 'driveway';
  readonly axis: 'horizontal' | 'vertical';
  readonly directions: readonly ('left' | 'right' | 'up' | 'down')[];
  readonly bounds: PrototypeBounds;
  readonly access: {
    readonly nodeId: string;
    readonly role: 'entry' | 'exit';
    readonly side: 'top' | 'bottom';
  } | null;
}
export interface RoadPrototypeScene {
  readonly sections: readonly PrototypeBlock[];
  readonly nodes: readonly (PrototypeBlock & { readonly sectionId: string })[];
  readonly roads: readonly PrototypeRoad[];
  readonly roadWidth: number;
  readonly drivewayWidth: number;
  readonly lanes: readonly PrototypeLane[];
  readonly junctions: readonly PrototypeJunction[];
  readonly dividers: readonly PrototypeDivider[];
  readonly connections: readonly PrototypeLaneConnection[];
  readonly crossingExamples: readonly PrototypeCrossingExample[];
}

export interface PrototypePoint {
  readonly x: number;
  readonly y: number;
}
export type PrototypeDirection = PrototypeRoad['directions'][number];
/** A lane is an allocated, directed rectangle between junctions, not a visual stripe. */
export interface PrototypeLane {
  readonly id: string;
  readonly roadId: string;
  readonly direction: PrototypeDirection;
  readonly bounds: PrototypeBounds;
  readonly entry: PrototypePoint;
  readonly exit: PrototypePoint;
}
/** Turns and lane crossings are legal only in these explicit road areas. */
export interface PrototypeJunction {
  readonly id: string;
  readonly bounds: PrototypeBounds;
  readonly label: string;
  readonly kind: 'bend' | 'intersection' | 'entry' | 'exit';
  readonly roadIds: readonly string[];
}
/** A marking separates opposing straight lanes; it never extends into a junction. */
export interface PrototypeDivider {
  readonly id: string;
  readonly roadId: string;
  readonly bounds: PrototypeBounds;
}
export interface PrototypeLaneConnection {
  readonly id: string;
  readonly fromLaneId: string;
  readonly toLaneId: string;
  readonly junctionId: string | null;
  readonly points: readonly PrototypePoint[];
}
/** Two individually valid paths cross at a known perpendicular point inside a junction. */
export interface PrototypeCrossingExample {
  readonly junctionId: string;
  readonly role: 'entry' | 'exit';
  readonly primaryConnectionId: string;
  readonly throughConnectionId: string;
  readonly crossings: readonly PrototypePoint[];
}
export interface PrototypeRoadCoverage {
  readonly roadArea: number;
  readonly coveredArea: number;
  readonly uncoveredArea: number;
  readonly multiplyOwnedArea: number;
  readonly outsideRoadArea: number;
  readonly perRoad: readonly {
    readonly roadId: string;
    readonly area: number;
    readonly uncoveredArea: number;
    readonly regionIds: readonly string[];
  }[];
}
export type PrototypeTravel =
  | {
      readonly kind: 'lane';
      readonly laneId: string;
      readonly from: PrototypePoint;
      readonly to: PrototypePoint;
    }
  | {
      readonly kind: 'connection';
      readonly connectionId: string;
      readonly points: readonly PrototypePoint[];
    };
export type PrototypeTravelResult =
  | { readonly ok: true; readonly value: null }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'unknown-lane'
          | 'outside-lane'
          | 'wrong-direction'
          | 'unknown-connection'
          | 'invalid-junction-path';
      };
    };
