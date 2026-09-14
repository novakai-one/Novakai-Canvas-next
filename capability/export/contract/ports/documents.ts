import type { Result } from '../errors.js';
import type { Collection } from '../records/artifact.js';
import type { Resource } from '../records/bundle.js';
/** Model validates records; Language owns complete readable DSL. Host adapts their error vocabulary. */
export interface Documents {
  read(input: unknown): Result<Collection>;
  print(collection: Collection): Result<string>;
  parse(source: string, resources: readonly Resource[]): Result<Collection>;
}
