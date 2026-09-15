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
}
export interface RoadPrototypeScene {
  readonly sections: readonly PrototypeBlock[];
  readonly nodes: readonly (PrototypeBlock & { readonly sectionId: string })[];
  readonly roads: readonly PrototypeRoad[];
  readonly roadWidth: number;
  readonly drivewayWidth: number;
}
