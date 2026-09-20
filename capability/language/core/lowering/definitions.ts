import type { Declaration } from '../../contract/records/syntax.js';
import { field, id, text } from './fields.js';
import { reject } from '../validation/outcomes.js';
import type { RawRecord } from './fields.js';

/** Lower the intentionally bounded declaration expression into Model's typed union tree. */
export function lowerDefinition(declaration: Declaration): RawRecord {
  const source = text(declaration.fields, 'expression');
  const atoms = source.split('|').map((item) => item.trim()).filter(Boolean);
  if (atoms.length === 0) reject('invalid-value', field(declaration.fields, 'expression').span, 'Type expression', 'Definition expression is empty');
  const span = field(declaration.fields, 'expression').span;
  const items = atoms.map((atom) => lowerAtom(atom, span));
  return { id: id(declaration.fields), label: text(declaration.fields, 'label'), expression: items.length === 1 ? items[0] : { kind: 'union', items } };
}

function lowerAtom(atom: string, span: Declaration['span']): RawRecord {
  if (atom.startsWith('@')) return { kind: 'reference', id: atom.slice(1) };
  if (atom.startsWith('"') && atom.endsWith('"')) return literalString(atom, span);
  if (atom === 'true' || atom === 'false') return { kind: 'literal', value: atom === 'true' };
  if (/^-?\d+(?:\.\d+)?$/.test(atom)) return { kind: 'literal', value: Number(atom) };
  if (['string', 'number', 'boolean', 'unknown', 'void'].includes(atom)) return { kind: 'primitive', name: atom };
  reject('invalid-value', span, 'Supported type expression', 'Unknown type expression atom', atom);
}

function literalString(atom: string, span: Declaration['span']): RawRecord {
  try { return { kind: 'literal', value: JSON.parse(atom) as string }; }
  catch { reject('invalid-value', span, 'Quoted literal', 'Invalid literal'); }
}
