import { describe, expect, it } from 'vitest';
import { REGION_COUNT, SETS, UNIVERSE } from './masks.js';
import { maskToExpression } from './dnf.js';
import { evaluateExpression } from './index.js';

describe('maskToExpression', () => {
  it('special-cases the empty set and the universe', () => {
    expect(maskToExpression(0)).toBe('0');
    expect(maskToExpression(UNIVERSE)).toBe('U');
  });

  it('emits one term per region', () => {
    // Region 3 = 0b011 = inside A and B, outside C.
    expect(maskToExpression(0b1000)).toBe("A & B & C'");
    expect(maskToExpression(0b1001)).toBe("(A' & B' & C') | (A & B & C')");
  });

  it('round-trips every possible mask through the parser', () => {
    for (let mask = 0; mask < 1 << REGION_COUNT; mask++) {
      expect(evaluateExpression(maskToExpression(mask))).toBe(mask);
    }
  });

  it('produces the canonical form of a plain set', () => {
    expect(evaluateExpression(maskToExpression(SETS.A))).toBe(SETS.A);
    expect(maskToExpression(SETS.A)).toBe(
      "(A & B' & C') | (A & B & C') | (A & B' & C) | (A & B & C)",
    );
  });
});
