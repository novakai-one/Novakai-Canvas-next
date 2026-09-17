import definitions from '../tokens/definitions.tokens.json' with { type: 'json' };
/** Static renderers consume the same published idle alpha as CSS; no interactive state is exported. */
export const wireIdleOpacity = definitions.wire.idleOpacity.$value;
