import { describe, expect, it } from 'vitest';
import { SETS, UNIVERSE } from './masks.js';
import { evaluateExpression as ev } from './index.js';

describe('evaluate', () => {
  it('maps constants to their masks', () => {
    expect(ev('A')).toBe(SETS.A);
    expect(ev('B')).toBe(SETS.B);
    expect(ev('C')).toBe(SETS.C);
    expect(ev('U')).toBe(UNIVERSE);
    expect(ev('0')).toBe(0);
  });

  // Each pair holds for all sets, so a single mask comparison proves it.
  const identities = [
    ["(A u B)'", "A' & B'", 'De Morgan for union'],
    ["(A & B)'", "A' u B'", 'De Morgan for intersection'],
    ['A & (B u C)', '(A & B) u (A & C)', 'distributivity'],
    ['A u (A & B)', 'A', 'absorption'],
    ["A u A'", 'U', 'complement (union)'],
    ["A & A'", '0', 'complement (intersection)'],
    ["A''", 'A', 'double negation'],
    ['A - B', "A & B'", 'difference as intersection'],
    ['A u A', 'A', 'idempotence'],
    ['A u 0', 'A', 'identity (union)'],
    ['A & U', 'A', 'identity (intersection)'],
    ['A u B & C', 'A u (B & C)', 'precedence'],
    ['A - B - C', '(A - B) - C', 'associativity of difference'],
    ['A ∪ B', 'a u b', 'unicode and lowercase aliases'],
  ];

  it.each(identities)('%s === %s (%s)', (left, right) => {
    expect(ev(left)).toBe(ev(right));
  });

  const nonIdentities = [
    ['A - B', 'B - A'],
    ['A u B & C', '(A u B) & C'],
    ['A - (B - C)', '(A - B) - C'],
  ];

  it.each(nonIdentities)('%s !== %s', (left, right) => {
    expect(ev(left)).not.toBe(ev(right));
  });

  it('evaluates the reference expression from the docs', () => {
    // (A-B-C) u ((A&B)&C) = (A only) u (A∩B∩C) = regions 1 and 7.
    expect(ev('(A-B-C)u(A&B)&C')).toBe(0b10000010);
  });
});
