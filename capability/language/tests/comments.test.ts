import { describe, expect, it } from 'vitest';
import { language, rejected } from './fixtures.js';

const canvas2 = `canvas 2
# a comment
declare @d {
  node @n step "N"
}
collection @c "C" uses=@d {
  section @s "S" {
    show @n
  }
}
`;

const canvas1 = `canvas 1 collection @demo "Demo" {
  # a comment
  node @n step "N" {}
}`;

describe('# outside a string', () => {
  it('is rejected with E011 in canvas 2', () => {
    const result = language.parse(canvas2);
    rejected(result, 'syntax');
    if (!result.ok) expect(result.error.diagnostics[0].message).toContain('E011');
  });

  it('is still silently dropped in canvas 1', () => {
    const result = language.parse(canvas1);
    expect(result.ok).toBe(true);
  });
});
