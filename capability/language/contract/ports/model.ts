/*
 * The Model roles Language depends on, kept separate so that parsing and printing need only the
 * reader and never receive the planner or stage. Also re-exports the Model record types Language
 * code reads.
 */
import type { Collection, ChangePlan, ChangeStage, Result } from '@novakai/canvas-model';

/** Model's validation of a raw collection record. */
export interface ModelReader {
  /** The input as a valid `Collection`, or Model's rejection. */
  validate(input: unknown): Result<Collection>;
}

/** Model's final check of a complete change list. */
export interface ModelPlanner {
  /** The checked plan for applying `changes` to `snapshot`, or Model's rejection. */
  plan(snapshot: unknown, changes: unknown): Result<ChangePlan>;
}

/** Model's step-by-step application of changes, including unchecked intermediate states. */
export interface ModelStage {
  /** The staged result of applying `changes` to `snapshot`, or Model's rejection. */
  stage(snapshot: unknown, changes: unknown): Result<ChangeStage>;
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
