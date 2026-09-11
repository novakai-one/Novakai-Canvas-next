/** Native cleanup fixture records actual allocation/destruction calls without pretending to calculate geometry. */
export function failingNative(): {
  readonly module: unknown;
  readonly allocated: readonly string[];
  readonly disposed: readonly string[];
} {
  const allocated: string[] = [];
  const disposed: string[] = [];
  class Handle {
    readonly identity: string;
    /** Every temporary allocation gets an independent identity. */
    constructor() {
      this.identity = `handle-${allocated.length}`;
      allocated.push(this.identity);
    }
    /** One throwing destructor proves later handles still receive cleanup attempts. */
    delete(): void {
      disposed.push(this.identity);
      if (this.identity === 'handle-1') throw new Error('Injected destruction fault');
    }
  }
  class Point extends Handle {
    /** Native point data are deliberately trivial: the test stops at transaction failure. */
    constructor(
      readonly x: number,
      readonly y: number,
    ) {
      super();
    }
  }
  class Router extends Handle {
    /** Parameter configuration is accepted before the deliberately failing transaction. */
    setRoutingParameter(): void {}
    /** The adapter must still free all allocations after a native transaction throws. */
    processTransaction(): never {
      throw new Error('Injected transaction fault');
    }
  }
  class CheckpointVector extends Handle {
    /** The native vector receives copied checkpoint values; allocation lifetime is tracked separately. */
    push_back(): void {}
  }
  class ConnRef {
    /** Routing type is irrelevant because this fixture exercises only cleanup after native failure. */
    setRoutingType(): void {}
    /** Checkpoints are accepted before the transaction fails. */
    setRoutingCheckpoints(): void {}
  }
  class ShapeRef {}
  return {
    module: {
      Point,
      Router,
      Rectangle: Handle,
      ShapeRef,
      ConnEnd: Handle,
      ConnRef,
      Checkpoint: Handle,
      CheckpointVector,
      RouterFlag: { OrthogonalRouting: { value: 2 } },
      ConnType: { ConnType_Orthogonal: {} },
      RoutingParameter: { shapeBufferDistance: {} },
    },
    allocated,
    disposed,
  };
}
