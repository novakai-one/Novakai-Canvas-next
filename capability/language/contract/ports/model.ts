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
  TypeExpression,
  DefinitionId,
} from '@novakai/canvas-model';
/** Definition ids a type use touches are reused through Model's permitted public contract. */
export { typeUseDefinitions } from '@novakai/canvas-model';
