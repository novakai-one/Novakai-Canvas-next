/*
 * Connection request assembly: a reviewed draft becomes one relationship record (its minted ID
 * checked against the grammar, cardinalities on associations only) and the create request built
 * through the workspace bindings' model input — one relationship, one wire appearance.
 */
import type { Result } from '../../../contract/errors.js';
import type { WorkspaceBindings } from '../../../contract/ports/workspace.js';
import type { Change, Relationship, Request, Section } from '../../../contract/records/owners.js';
import type { Cardinality, ConnectionDraft } from '../../../contract/records/connection.js';
import type { ConnectionPolicy, RelationshipEndpoints } from './types.js';
import { connectionFailure } from './failure.js';
import { relationshipEndpoint } from './endpoints.js';

/** Builds the create request for a reviewed draft: one relationship, one wire appearance. */
export function connectionRequest(
  policy: ConnectionPolicy,
  bindings: WorkspaceBindings,
  draft: ConnectionDraft,
  label: string,
): Result<Request> {
  const relationship = relationshipFor(policy, draft, label);
  if (!relationship.ok) {
    return relationship;
  }
  return bindings.inputs.model(
    draft.base,
    draft.collection.id,
    relationshipChanges(draft, relationship.value),
    draft.id,
  );
}

/** The relationship a draft describes; its minted ID is checked against the grammar. */
function relationshipFor(
  policy: ConnectionPolicy,
  draft: ConnectionDraft,
  label: string,
): Result<Relationship> {
  const endpoints = relationshipEndpoints(policy, draft);
  if (!endpoints.ok) {
    return endpoints;
  }
  return assembleRelationship(policy, draft, label, endpoints.value);
}

/** Source and target as Model addresses them, each member ID checked against its grammar. */
function relationshipEndpoints(
  policy: ConnectionPolicy,
  draft: ConnectionDraft,
): Result<RelationshipEndpoints> {
  const source = relationshipEndpoint(policy, draft.source);
  if (!source.ok) {
    return source;
  }
  const target = relationshipEndpoint(policy, draft.target);
  if (!target.ok) {
    return target;
  }
  return { ok: true, value: { source: source.value, target: target.value } };
}

/** The assembled relationship, when its minted ID parses against the grammar. */
function assembleRelationship(
  policy: ConnectionPolicy,
  draft: ConnectionDraft,
  label: string,
  endpoints: RelationshipEndpoints,
): Result<Relationship> {
  const id = policy.relationshipId.safeParse(`relationship-${draft.id}`);
  if (!id.success) {
    return connectionFailure(
      'invalid-edit',
      'The connection identity is not readable.',
      'Cancel this connection and reconnect the endpoints.',
    );
  }
  return { ok: true, value: relationshipRecord(draft, label, endpoints, id.data) };
}

/** The relationship record: labelled, solid, without provenance, cardinalities on associations only. */
function relationshipRecord(
  draft: ConnectionDraft,
  label: string,
  endpoints: RelationshipEndpoints,
  id: Relationship['id'],
): Relationship {
  return {
    id,
    kind: draft.kind,
    label,
    source: endpoints.source,
    target: endpoints.target,
    ...associationCardinality(draft),
    style: 'solid',
    sources: [],
  };
}

/** Association ends; every other kind forbids cardinalities. */
function associationCardinality(draft: ConnectionDraft): Partial<Relationship> {
  if (draft.kind !== 'association') {
    return {};
  }
  return { ...cardinalityEntry('from', draft.from), ...cardinalityEntry('to', draft.to) };
}

/** One end's cardinality; `none` leaves the key out. */
function cardinalityEntry(
  side: 'from' | 'to',
  value: Cardinality,
): Partial<Relationship> {
  return value === 'none' ? {} : { [side]: value };
}

/** The relationship record and the section carrying its appearance. */
function relationshipChanges(
  draft: ConnectionDraft,
  relationship: Relationship,
): readonly Change[] {
  const section: Section = {
    ...draft.section,
    wires: [...draft.section.wires, connectionAppearance(relationship.id)],
  };
  return [
    { op: 'create', target: 'relationships', value: relationship },
    { op: 'replace', target: 'sections', value: section },
  ];
}

/** The wire appearance of a new relationship: orthogonal route, automatic sides, unlocked. */
function connectionAppearance(id: Relationship['id']): Section['wires'][number] {
  return {
    relationship: id,
    route: 'orthogonal',
    sourceSide: 'auto',
    targetSide: 'auto',
    locked: false,
  };
}
