import type { Collection, ChangePlan, ChangeStage, Result } from '@novakai/canvas-model';
/** Owner roles are separate so parsing/printing never acquires change authority unnecessarily. */
export interface ModelReader {
  validate(input: unknown): Result<Collection>;
}
export interface ModelPlanner {
  plan(snapshot: unknown, changes: unknown): Result<ChangePlan>;
}
export interface ModelStage {
  stage(snapshot: unknown, changes: unknown): Result<ChangeStage>;
}

export type {
  Collection,
  DiagramObject,
  Section,
  ContentBlock,
  Change,
} from '@novakai/canvas-model';
