import { describe, expect, it } from 'vitest';
import {
  EMPTY,
  REGION_COUNT,
  SETS,
  UNIVERSE,
  complement,
  difference,
  hasRegion,
  intersection,
  isSubset,
  setMask,
  symmetricDifference,
  toggleRegion,
  union,
} from './masks.js';

describe('constants', () => {
  it('defines 8 regions for 3 sets', () => {
    expect(REGION_COUNT).toBe(8);
    expect(UNIVERSE).toBe(0b11111111);
    expect(EMPTY).toBe(0);
  });

  it('gives each set the truth-table column of its bit', () => {
    expect(SETS.A).toBe(0b10101010);
    expect(SETS.B).toBe(0b11001100);
    expect(SETS.C).toBe(0b11110000);
  });

  it('computes set masks in closed form for other set counts', () => {
    expect(setMask(0, 2)).toBe(0b1010);
    expect(setMask(1, 2)).toBe(0b1100);
    expect(setMask(3, 4)).toBe(0b1111111100000000);
  });
});

describe('operations', () => {
  it('complement masks back down to the universe', () => {
    expect(complement(SETS.A)).toBe(0b01010101);
    expect(complement(EMPTY)).toBe(UNIVERSE);
    expect(complement(complement(SETS.B))).toBe(SETS.B);
    expect(complement(SETS.A)).toBeGreaterThanOrEqual(0);
  });

  it('intersection, union, difference behave as set algebra', () => {
    expect(intersection(SETS.A, complement(SETS.A))).toBe(EMPTY);
    expect(union(SETS.A, complement(SETS.A))).toBe(UNIVERSE);
    expect(difference(SETS.A, SETS.B)).toBe(intersection(SETS.A, complement(SETS.B)));
    expect(symmetricDifference(SETS.A, SETS.A)).toBe(EMPTY);
  });

  it('subset and region helpers', () => {
    expect(isSubset(intersection(SETS.A, SETS.B), SETS.A)).toBe(true);
    expect(isSubset(SETS.A, intersection(SETS.A, SETS.B))).toBe(false);
    expect(isSubset(EMPTY, SETS.C)).toBe(true);
    // Region 5 = 0b101: inside A and C, outside B.
    expect(hasRegion(SETS.A, 5)).toBe(true);
    expect(hasRegion(SETS.B, 5)).toBe(false);
    expect(toggleRegion(EMPTY, 5)).toBe(0b100000);
    expect(toggleRegion(toggleRegion(SETS.A, 2), 2)).toBe(SETS.A);
  });
});
