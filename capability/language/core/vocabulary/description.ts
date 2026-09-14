import type { Description } from '../../contract/records/vocabulary.js';
import { constructs } from './constructs.js';
import { defaults, layouts } from './defaults.js';
import { operationWords, patchProperties } from './patch-properties.js';
import { reject, origin } from '../validation/outcomes.js';
/** Inspect the shipped grammar/defaults without opening implementation files; Language owns correction. */
export function describeLanguage(version: number, policies: Description['policies']): Description {
  if (version !== 1)
    reject('unsupported-version', origin, 'Version 1', 'Unsupported language version');
  return structuredClone({
    version: 1,
    constructs,
    operations: operationWords,
    patchTargets: patchProperties,
    policies,
    patchForms: [
      'add <node/wire/asset/source/section declaration>',
      'replace <node/section declaration>',
      'set <target> <name=value ...>',
      'unset <target> <optional-property ...>',
      'show/hide @object in @section',
      'connect/disconnect @wire in @section',
      'add block @object { <one content declaration> } [before=@block]',
      'remove block @object.@block',
      'move block @object.@block before=@sibling',
      'delete node @object [cascade=true]',
      'delete wire/section/asset/source @id',
      'reset layout @section',
      'reset route @section/@wire',
    ],
    defaults: { ...defaults, ...layouts },
    examples: [
      'canvas 1 collection @demo "A process" { node @start step "Start" {} node @finish end "Finish" {} wire @next @start -> @finish "Continue" section @flow "Process" { show @start @finish connect @next } }',
      'canvas 1 collection @emphasis "Emphasis" { node @read step "Read" { text @detail "The *receipt* proves the commit; paired asterisks set strong text in text blocks." role=caption } section @show "Show" { show @read } }',
      'canvas 1 collection @layers "Layers" { node @app module "App" {} node @core module "Core" {} section @map "Map" { group @hosts "HOSTS" { show @app } group @libs "LIBS" { show @core } before group:@hosts group:@libs } }',
      'patch 1 @demo { set node @start label="Begin here" }',
      'patch 1 @demo { set wire @next from-end=@start to-end=@finish }',
      'patch 1 @demo { add block @start { text @detail "Explain why this step matters." } }',
    ],
    diagnostics: [
      'syntax',
      'unsupported-version',
      'invalid-input',
      'unknown-property',
      'invalid-value',
      'unknown-target',
      'missing-resource',
      'resource-mismatch',
      'domain',
      'display-only',
      'limit',
      'provider-failure',
      'unrepresentable',
    ],
  });
}
