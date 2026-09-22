/** Lower a parsed ⟨T⟩ type-use into the Model TypeUse shape, resolving @refs through the symbol table. */
import type { LocatedValue, Span, TypeSyntax } from '../../../contract/records/syntax.js';
import { isTypeUse } from '../../parsing/value-types.js';
import { reject } from '../../validation/outcomes.js';
import type { RawRecord } from '../fields.js';
import type { SymbolTable } from './symbols.js';
export function lowerTypeUse(value: LocatedValue, symbols: SymbolTable): unknown {
  if (!isTypeUse(value.value)) reject('invalid-value', value.span, 'type', 'Expected a type');
  return lowerTypeSyntax(value.value, value.span, symbols);
}
function lowerTypeSyntax(syntax: TypeSyntax, span: Span, symbols: SymbolTable): unknown {
  if (syntax.primitive !== undefined) return { kind: 'primitive', name: syntax.primitive };
  if (syntax.arguments !== undefined) return lowerGeneric(syntax, span, symbols);
  return lowerTypeRef(syntax.ref as string, span, symbols);
}
function lowerGeneric(syntax: TypeSyntax, span: Span, symbols: SymbolTable): RawRecord {
  return {
    kind: 'generic',
    base: definitionRef(syntax.ref as string, span, symbols),
    arguments: (syntax.arguments ?? []).map((item) => lowerTypeSyntax(item, span, symbols)),
  };
}
function lowerTypeRef(ref: string, span: Span, symbols: SymbolTable): RawRecord {
  return (
    entityRef(ref, symbols) ?? definedRef(ref, symbols) ?? rejectUnknownType(ref, span, symbols)
  );
}
function entityRef(ref: string, symbols: SymbolTable): RawRecord | undefined {
  return symbols.entities.has(ref) ? { kind: 'entity', id: ref } : undefined;
}
function definedRef(ref: string, symbols: SymbolTable): RawRecord | undefined {
  const mapped = symbols.definitions.get(ref);
  return mapped === undefined ? undefined : { kind: 'definition', id: mapped };
}
function definitionRef(ref: string, span: Span, symbols: SymbolTable): string {
  const mapped = symbols.definitions.get(ref);
  if (mapped === undefined) rejectUnknownType(ref, span, symbols);
  return mapped;
}
function rejectUnknownType(ref: string, span: Span, symbols: SymbolTable): never {
  const options = symbols.options.map((item) => `@${item}`).join(', ');
  reject(
    'unknown-target',
    span,
    'A declared type or entity id',
    `E104 type: @${ref} is not declared. Declare "type @${ref}" or use: ${options}, string, number, boolean.`,
  );
}
