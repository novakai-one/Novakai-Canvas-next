import type { DefinitionId, ObjectId } from '../../contract/brands.js';
import type { TypeUse } from '../../contract/records/definition.js';

/** Canonical printed form: plain string types pass through; structured uses render as `@id` or generics. */
export function typeUseText(type: TypeUse): string {
  if (typeof type === 'string') return type;
  switch (type.kind) {
    case 'definition':
    case 'entity':
      return `@${type.id}`;
    case 'primitive':
      return type.name;
    case 'generic':
      return `@${type.base}<${type.arguments.map(typeUseText).join(', ')}>`;
  }
}

/** Canonical identity for equality checks; distinct kinds never collide even with the same id text. */
export function typeUseKey(type: TypeUse): string {
  if (typeof type === 'string') return `text:${type}`;
  switch (type.kind) {
    case 'definition':
      return `definition:${type.id}`;
    case 'entity':
      return `entity:${type.id}`;
    case 'primitive':
      return `primitive:${type.name}`;
    case 'generic':
      return `generic:${type.base}<${type.arguments.map(typeUseKey).join(',')}>`;
  }
}

/** Definition ids a type use touches, recursively through generic arguments. */
export function typeUseDefinitions(type: TypeUse): readonly DefinitionId[] {
  if (typeof type === 'string') return [];
  switch (type.kind) {
    case 'definition':
      return [type.id];
    case 'entity':
      return [];
    case 'primitive':
      return [];
    case 'generic':
      return [type.base, ...type.arguments.flatMap(typeUseDefinitions)];
  }
}

/** Entity object ids a type use touches, recursively through generic arguments. */
export function typeUseEntities(type: TypeUse): readonly ObjectId[] {
  if (typeof type === 'string') return [];
  switch (type.kind) {
    case 'definition':
      return [];
    case 'entity':
      return [type.id];
    case 'primitive':
      return [];
    case 'generic':
      return type.arguments.flatMap(typeUseEntities);
  }
}
