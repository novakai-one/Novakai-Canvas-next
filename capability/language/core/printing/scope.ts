import type { Collection } from '../../contract/ports/model.js';
import type { Scope } from '../../contract/records/requests.js';
import { reject, origin } from '../validation/outcomes.js';
/** Scoped data is a display projection and never asserted to be a valid standalone collection. */
export function selectScope(collection: Collection, scope: Scope): Collection {
  if (scope.kind === 'all') return collection;
  if (scope.kind === 'section') return sectionScope(collection, scope.id);
  return objectScope(collection, scope.id);
}
/** A section read includes visible canonical nodes, its wires and directly referenced resources. */
function sectionScope(collection: Collection, id: string): Collection {
  const section = collection.sections.find((item) => item.id === id);
  if (section === undefined)
    reject('unknown-target', origin, 'Existing section', 'Cannot read missing section', id);
  const ids = [
    ...section.appearances.map((item) => item.object),
    ...section.groups.map((item) => item.represents),
  ];
  const objects = collection.objects.filter((item) => ids.some((visible) => visible === item.id));
  const relationships = collection.relationships.filter((item) =>
    section.wires.some((wire) => wire.relationship === item.id),
  );
  return resourceScope({ ...collection, sections: [section], objects, relationships });
}
/** Object scope includes incident relationships and neighboring endpoint declarations as read context. */
function objectScope(collection: Collection, id: string): Collection {
  if (!collection.objects.some((item) => item.id === id))
    reject('unknown-target', origin, 'Existing object', 'Cannot read missing object', id);
  const relationships = collection.relationships.filter(
    (item) => item.source.object === id || item.target.object === id,
  );
  const neighbors = [
    id,
    ...relationships.flatMap((item) => [item.source.object, item.target.object]),
  ];
  return resourceScope({
    ...collection,
    sections: [],
    relationships,
    objects: collection.objects.filter((item) => neighbors.includes(item.id)),
  });
}
/** Pinned metadata accompanies included content; unrelated source/media declarations are omitted. */
function resourceScope(collection: Collection): Collection {
  const assets = collection.objects.flatMap((item) =>
    item.content.flatMap((block) => ('asset' in block ? [block.asset] : [])),
  );
  const sources = [
    ...collection.objects.flatMap((item) => item.sources),
    ...collection.relationships.flatMap((item) => item.sources),
  ];
  const referenced = new Set(
    collection.objects.flatMap((item) =>
      item.content.flatMap((block) =>
        block.kind === 'field' && typeof block.type !== 'string' ? [block.type.id] : [],
      ),
    ),
  );
  let changed = true;
  while (changed) {
    changed = false;
    collection.definitions.forEach((definition) => {
      if (!referenced.has(definition.id)) return;
      const refs = definition.expression.kind === 'reference'
        ? [definition.expression.id]
        : definition.expression.kind === 'union'
          ? definition.expression.items.filter((item) => item.kind === 'reference').map((item) => item.id)
          : [];
      refs.forEach((id) => { if (!referenced.has(id)) { referenced.add(id); changed = true; } });
    });
  }
  return {
    ...collection,
    assets: collection.assets.filter((item) => assets.includes(item.id)),
    sources: collection.sources.filter((item) => sources.includes(item.id)),
    definitions: collection.definitions.filter((definition) => referenced.has(definition.id)),
  };
}
