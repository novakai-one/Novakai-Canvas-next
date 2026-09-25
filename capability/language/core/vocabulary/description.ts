/*
 * The language description `describe` returns: the grammar, operation words, patch targets,
 * defaults, examples and diagnostic codes, so an author never needs to open implementation files.
 * Pure: every call returns a new copy. Language owns correcting the source; Authoring owns commit
 * recovery.
 */
import type { DiagnosticCode } from '../../contract/errors.js';
import type { Description } from '../../contract/records/vocabulary.js';
import { constructs } from './constructs.js';
import { defaults, layouts } from './defaults.js';
import { operationWords, patchProperties } from './patch-properties.js';
import { reject, origin } from '../validation/outcomes.js';

/**
 * Describes language version 1: its constructs, patch operation words and targets, the host's
 * policies, the patch forms, the defaults (the `defaults` record followed by the layout of each
 * section mode), examples, diagnostic codes and how definitions are written and edited.
 *
 * Pure: every call returns a new structured clone, so a caller may change its copy. Language
 * owns correcting the source; Authoring owns commit recovery.
 *
 * @param version - The requested language version; only 1 exists.
 * @param policies - The host's limits and policies, copied into the description.
 * @returns The description.
 * @throws A `LanguageFault` (`unsupported-version` at the start of the source) for any version
 * other than 1; a `DataCloneError` when `policies` cannot be cloned. The public `describe`
 * runs it inside `protect`.
 */
export function describeLanguage(version: number, policies: Description['policies']): Description {
  if (version !== 1)
    reject('unsupported-version', origin, 'Version 1', 'Unsupported language version');
  return structuredClone({
    version: 1,
    constructs,
    operations: operationWords,
    patchTargets: patchProperties,
    policies,
    patchForms,
    defaults: { ...defaults, ...layouts },
    examples,
    diagnostics: diagnosticCodes,
    definitionSyntax: 'type @id "Label" = <expression>',
    definitionEditing: 'full-source-replacement',
  });
}

/** The forms a patch operation can take. */
const patchForms: readonly string[] = Object.freeze([
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
]);

/** Complete example sources and patches. Long examples are split only to fit the line width. */
const examples: readonly string[] = Object.freeze([
  'canvas 1 collection @demo "A process" { node @start step "Start" {} ' +
    'node @finish end "Finish" {} wire @next @start -> @finish "Continue" ' +
    'section @flow "Process" { show @start @finish connect @next } }',
  'canvas 1 collection @emphasis "Emphasis" { node @read step "Read" { text @detail ' +
    '"The *receipt* proves the commit; paired asterisks set strong text in text blocks." ' +
    'role=caption } section @show "Show" { show @read } }',
  'canvas 1 collection @layers "Layers" { node @app module "App" {} ' +
    'node @core module "Core" {} section @map "Map" { group @hosts "HOSTS" { show @app } ' +
    'group @libs "LIBS" { show @core } before group:@hosts group:@libs } }',
  'patch 1 @demo { set node @start label="Begin here" }',
  'patch 1 @demo { set wire @next from-end=@start to-end=@finish }',
  'patch 1 @demo { add block @start { text @detail "Explain why this step matters." } }',
]);

/** Every diagnostic code Language reports (the compiler checks each is a `DiagnosticCode`). */
const diagnosticCodes: readonly DiagnosticCode[] = Object.freeze([
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
]);
