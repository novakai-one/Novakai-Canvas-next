import { describe, it, expect, assert } from 'vitest';
import { stage, plan } from '@novakai/canvas-model';
import { language, create, edit, graph, object, section, rejected, pins } from './fixtures.js';
import { modulesSource, sequenceSource } from './engineering-fixtures.js';
describe('Language ordered patches', () => {
  it('11 — set/unset preserves unnamed content, pins and human geometry', () => {
    const original = graph();
    const changed = edit(
      original,
      'set node @a label="Begin" role=primary size=large set block @a.@detail text="Updated" set appearance @flow/@a detail=summary set route @flow/@ab source-side=right unset node @a role size',
    );
    expect(object(changed, 'a')).toMatchObject({
      label: 'Begin',
      role: 'neutral',
      size: 'medium',
      content: [{ id: 'detail', kind: 'text', text: 'Updated' }],
    });
    expect(section(changed).appearances[0]).toEqual({
      ...section(original).appearances[0],
      detail: 'summary',
    });
    expect(section(changed).wires[0]).toEqual({
      ...section(original).wires[0],
      sourceSide: 'right',
    });
    expect(changed.theme).toEqual(original.theme);
    expect(changed.revision).toBe(7);
    expect(object(original, 'a').label).toBe('A');
    rejected(
      language.lower({
        source: 'patch 1 @demo { set node @a x=5 }',
        mode: 'patch',
        snapshot: original,
        resources: pins(original),
      }),
      'unknown-property',
    );
  });
  it('12 — stages forward references and view operations, with explicit cascade and resets', () => {
    const original = graph();
    const added = edit(
      original,
      'add wire @bc @b -> @c "Continue" add node @c end "C" {} show @c in @flow connect @bc in @flow disconnect @bc in @flow connect @bc in @flow hide @c in @flow show @c in @flow connect @bc in @flow reset route @flow/@ab reset layout @flow',
    );
    expect(added.objects.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(section(added).wires.map((wire) => wire.relationship)).toEqual(['ab', 'bc']);
    expect(section(added).appearances[0]?.placement).toBeUndefined();
    expect(section(added).wires[0]?.manual).toBeUndefined();
    const prefix = stage(original, [
      {
        op: 'create',
        target: 'relationships',
        value: {
          id: 'bc',
          kind: 'flow',
          label: 'Continue',
          source: { object: 'b' },
          target: { object: 'c' },
        },
      },
    ]);
    assert(prefix.ok);
    expect(prefix.value.validity).toBe('unchecked');
    expect(plan(original, prefix.value.changes).ok).toBe(false);
    const deleted = edit(added, 'delete node @b cascade=true');
    expect(deleted.relationships).toEqual([]);
    expect(section(deleted).wires).toEqual([]);
  });
  it('13 — inserts, removes and reorders stable blocks; protects required properties and endpoints', () => {
    const original = graph();
    const inserted = edit(
      original,
      'add block @a { text @second "Second" } before=@detail add block @a { text @last "Last" } move block @a.@last before=@second remove block @a.@second',
    );
    expect(object(inserted, 'a').content.map((block) => block.id)).toEqual(['last', 'detail']);
    expect(object(inserted, 'a').content[0]).toMatchObject({ text: 'Last' });
    rejected(
      language.lower({
        source: 'patch 1 @demo { unset block @a.@detail text }',
        mode: 'patch',
        snapshot: original,
        resources: pins(original),
      }),
      'invalid-value',
    );
    rejected(
      language.lower({
        source: 'patch 1 @demo { add block @a { text @detail "Duplicate" } }',
        mode: 'patch',
        snapshot: original,
        resources: pins(original),
      }),
      'domain',
    );
    const modules = create(modulesSource);
    rejected(
      language.lower({
        source: 'patch 1 @modules { remove block @planner.@plan }',
        mode: 'patch',
        snapshot: modules,
        resources: pins(modules),
      }),
      'domain',
    );
  });
  it('14 — replaces complete nodes and section structure while preserving surviving manual identities', () => {
    const original = graph();
    const changed = edit(
      original,
      'replace node @a step "New A" { text @new "Replacement" } replace section @flow "Grouped flow" { group @g "Together" { show @a @b } connect @ab }',
    );
    expect(object(changed, 'a').content.map((block) => block.id)).toEqual(['new']);
    expect(section(changed).appearances[0]?.placement).toEqual(
      section(original).appearances[0]?.placement,
    );
    expect(section(changed).wires[0]?.manual).toEqual(section(original).wires[0]?.manual);
    const sequence = create(sequenceSource);
    const updated = edit(
      sequence,
      'replace section @conversation "One message" mode=sequence { show @human @agent event @new @human -> @agent "Changed" kind=async }',
    );
    expect(section(updated, 'conversation').sequence).toHaveLength(1);
    expect(section(updated, 'conversation').sequence[0]).toMatchObject({
      id: 'new',
      label: 'Changed',
      message: 'async',
    });
  });
  it('15 — keeps provenance separate from reconnecting and reads cascade effects before later edits', () => {
    const modules = create(modulesSource);
    const reconnected = edit(
      modules,
      'set wire @uses from-end=@spec to-end=@planner sources=[@spec]',
    );
    expect(reconnected.relationships[0]?.source).toEqual({ object: 'spec' });
    expect(reconnected.relationships[0]?.sources).toEqual(['spec']);
    const original = graph();
    rejected(
      language.lower({
        source: 'patch 1 @demo { delete section @flow add section @flow "Again" { show @a @b } }',
        mode: 'patch',
        snapshot: original,
        resources: pins(original),
      }),
      'invalid-value',
    );
    const linked = edit(original, 'add block @b { link @back "Back" target=@a }');
    const cascaded = edit(linked, 'delete node @a cascade=true set node @b label="Remaining"');
    expect(object(cascaded, 'b').content).toEqual([]);
    expect(object(cascaded, 'b').label).toBe('Remaining');
    expect(cascaded.relationships).toEqual([]);
    const links = edit(
      original,
      'add block @b { link @back "Back" target=@a section=@flow } set block @b.@back target=@b',
    );
    expect(object(links, 'b').content[0]).toMatchObject({
      target: { kind: 'object', id: 'b', section: 'flow' },
    });
  });
});
