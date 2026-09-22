import type { Construct } from '../../contract/records/syntax.js';
import type {
  Property,
  ConstructDefinition,
  PositionRule,
} from '../../contract/records/vocabulary.js';
import type { RawRecord } from '../lowering/fields.js';
import { constructs } from '../vocabulary/constructs.js';
import { declaredConstructs } from '../vocabulary/constructs-declared.js';
import { reject, origin } from '../validation/outcomes.js';
import { printValue } from './values.js';
/** Retrieve the same grammar metadata used by parsing and lowering. */
function definition(kind: Construct): ConstructDefinition {
  const value = constructs.find((item) => item.kind === kind);
  if (value === undefined)
    reject('unrepresentable', origin, 'Shipped construct', 'Unknown printable construct', kind);
  return value;
}
/** Required framing and supported property names are never redefined by individual renderers. */
export function header(kind: Construct, record: RawRecord): string {
  const construct = definition(kind);
  const positions = construct.positions.flatMap((rule) => position(record, printRule(kind, rule)));
  return [kind, ...positions, ...printProperties(record, construct.properties)].join(' ');
}
/** Positions the declared wire rule marks optional (its label); the printer honours them for wires. */
const declaredWireOptional = new Set(
  declaredConstructs
    .find((item) => item.kind === 'wire')
    ?.positions.filter((rule) => rule.optional === true)
    .map((rule) => rule.name),
);
function printRule(kind: Construct, rule: PositionRule): PositionRule {
  if (kind !== 'wire') return rule;
  return { ...rule, optional: rule.optional === true || declaredWireOptional.has(rule.name) };
}
/** Literal arrows and optional branch IDs retain their declared framing. */
function position(record: RawRecord, rule: PositionRule): readonly string[] {
  if (rule.literal !== undefined) return [rule.literal];
  if (omittedPosition(record, rule)) return [];
  return [printValue(record[rule.name], rule.type, rule.name)];
}
/** Omit a default only when the lowering table restores that exact semantic value. */
export function printProperties(
  record: RawRecord,
  properties: Readonly<Record<string, Property>>,
): readonly string[] {
  return Object.entries(properties).flatMap(([name, property]) =>
    propertyText(record, name, property),
  );
}
/** Absent optional fields do not become empty strings; meaningful empty strings remain quoted. */
function propertyText(record: RawRecord, name: string, property: Property): readonly string[] {
  const value = record[property.field];
  if (value === undefined) return [];
  if (value === property.fallback) return [];
  return [`${name}=${printValue(value, property.type, name)}`];
}
/** An absent positional value is omitted only when its rule is optional (a wire's per the declared wire rule). */
function omittedPosition(record: RawRecord, rule: PositionRule): boolean {
  return rule.optional === true && record[rule.name] === undefined;
}
