import { assert, expect, it } from 'vitest';
import { create, edit, language, pins, value } from './fixtures.js';

const source = `canvas 1
collection @annotations "Numbered relationships" {
  node @request step "Request" {}
  node @review step "Review" {}
  wire @send @request -> @review "Send evidence" kind=flow step=2
  section @first "Process" mode=flow layout=flow {
    show @request @review
    connect @send
  }
  section @second "Explanation" mode=story layout=grid {
    show @request @review
    connect @send
  }
}`;

/** One canonical number appears in every view; no implicit renumbering or coordinate syntax. */
it('round-trips and patches canonical step annotations while rejecting invalid numbers', () => {
  const original = create(source);
  expect(original.relationships[0]).toMatchObject({ label: 'Send evidence', step: 2 });
  expect(original.sections.map((section) => section.wires[0]?.relationship)).toEqual([
    'send',
    'send',
  ]);
  const printed = value(language.print({ collection: original, scope: { kind: 'all' } }));
  expect(printed.source).toContain('step=2');
  const read = value(
    language.lower({
      source: printed.source,
      mode: 'replace',
      snapshot: original,
      resources: pins(original),
    }),
  );
  expect(read.collection).toEqual(original);
  const patched = edit(original, 'set wire @send step=7 label="Submit evidence"');
  expect(patched.relationships[0]).toMatchObject({ step: 7, label: 'Submit evidence' });
  expect(edit(patched, 'unset wire @send step').relationships[0]).not.toHaveProperty('step');
  ['0', '-1', '1.5', '9007199254740992'].forEach((number) => {
    const result = language.lower({
      source: source.replace('step=2', `step=${number}`),
      mode: 'create',
      snapshot: null,
      resources: pins(original),
    });
    assert(!result.ok);
    expect(result.error.code).toBe('validation-failed');
    expect(result.error.diagnostics.length).toBeGreaterThan(0);
    expect(result).not.toHaveProperty('value');
  });
});
