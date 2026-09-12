import { expect, it } from 'vitest';
import { create, edit, language, object, pins, section, value } from './fixtures.js';

/** Figure composition is expressed in meaning and size bands; no coordinate vocabulary is introduced. */
const source = `canvas 1
collection @figures "Figure compositions" {
  asset @wireframe image source="./figure.svg" alt="A wireframe with a navigation bar, content cards and a primary action"
  node @actor system "Review workspace" frame=none composition=media-top {
    image @figure asset=@wireframe size=large
    text @caption "Collect evidence before deciding" role=caption
  }
  section @flow "Evidence" mode=story layout=grid {
    group @region "Review boundary" frame=panel role=supporting layout=grid {
      show @actor composition=media-left frame=card
    }
  }
}`;

/** S2 roundtrip: the actual readout is replaceable, patches retain content, and unsets restore inheritance/defaults. */
it('retains composition through create, print, patch, unset and replacement', () => {
  const original = create(source);
  expect(section(original).appearances[0]).toMatchObject({
    frame: 'card',
    composition: 'media-left',
  });
  expect(object(original, 'actor').content[1]).toMatchObject({ role: 'caption' });
  const readout = value(language.print({ collection: original, scope: { kind: 'all' } }));
  const replacement = value(
    language.lower({
      source: readout.source,
      mode: 'replace',
      snapshot: original,
      resources: pins(original),
    }),
  ).collection;
  expect(replacement).toEqual(original);
  expect(readout.source).not.toMatch(/\b(?:x|y|width|height)=/);
  expect(section(replacement).groups[0]).toMatchObject({ frame: 'panel', role: 'supporting' });
  const patched = edit(
    original,
    'set block @actor.@caption role=annotation set node @actor frame=panel unset appearance @flow/@actor frame composition',
  );
  expect(object(patched, 'actor').content[1]).toMatchObject({
    role: 'annotation',
    text: 'Collect evidence before deciding',
  });
  expect(section(patched).appearances[0]).not.toHaveProperty('frame');
  expect(section(patched).appearances[0]).not.toHaveProperty('composition');
  expect(object(patched, 'actor')).toMatchObject({ frame: 'panel', composition: 'media-top' });
  const reset = edit(
    patched,
    'unset node @actor frame composition unset block @actor.@caption role',
  );
  expect(object(reset, 'actor')).toMatchObject({ frame: 'auto', composition: 'stack' });
  expect(object(reset, 'actor').content[1]).toMatchObject({ role: 'body' });
  const omitted = readout.source
    .replace('frame=none composition=media-top', '')
    .replace('composition=media-left frame=card', '')
    .replace('frame=card composition=media-left', '');
  const defaults = value(
    language.lower({
      source: omitted,
      mode: 'replace',
      snapshot: original,
      resources: pins(original),
    }),
  ).collection;
  expect(object(defaults, 'actor')).toMatchObject({ frame: 'auto', composition: 'stack' });
  expect(section(defaults).appearances[0]).not.toHaveProperty('composition');
});
