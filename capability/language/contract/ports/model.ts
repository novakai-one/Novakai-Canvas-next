/*
 * The Model roles Language depends on, one role each. Parsing needs no role; printing receives
 * only the reader and never the planner or stage. Also re-exports the Model record types
 * Language code reads. Language turns a role's rejection into diagnostics for the author to
 * correct; Authoring owns committing the result and recovering from failure.
 */
import type { Collection, ChangePlan, ChangeStage, Result } from '@novakai/canvas-model';

/** Model's validation of a raw collection record. */
export interface ModelReader {
  /**
   * Validates a raw collection record.
   *
   * @param input - The record to check.
   * @returns The input as a valid `Collection`, or Model's rejection.
   * @throws Whatever the implementation throws; Language reports it as `provider-failure`.
   */
  validate(input: unknown): Result<Collection>;
}

/** Model's final check of a complete change list. */
export interface ModelPlanner {
  /**
   * Checks a complete change list against a snapshot.
   *
   * @param snapshot - The collection the changes apply to; for a new collection, an empty
   * shell of it.
   * @param changes - The complete change list.
   * @returns The checked plan, or Model's rejection.
   * @throws Whatever the implementation throws; Language reports it as `provider-failure`.
   */
  plan(
    snapshot: unknown,
    changes: unknown,
  ): Result<ChangePlan>;
}

/** Model's step-by-step application of changes, including unchecked intermediate states. */
export interface ModelStage {
  /**
   * Applies changes to a snapshot one after another, without the final validity check.
   *
   * @param snapshot - The collection the changes apply to; for a new collection, an empty
   * shell of it.
   * @param changes - The changes so far.
   * @returns The staged candidate and changes, or Model's rejection.
   * @throws Whatever the implementation throws; Language reports it as `provider-failure`.
   */
  stage(
    snapshot: unknown,
    changes: unknown,
  ): Result<ChangeStage>;
}

export type {
  Collection,
  DiagramObject,
  Section,
  ContentBlock,
  Change,
  TypeExpression,
  DefinitionId,
} from '@novakai/canvas-model';
