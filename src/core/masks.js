/**
 * Region-bitmask representation of sets.
 *
 * With n sets the universe splits into 2^n disjoint regions (atoms). Region
 * index r encodes membership: bit i of r is 1 iff the region lies inside
 * set i. A set-valued expression is then fully described by which regions it
 * contains, i.e. by an integer with one bit per region.
 *
 * Set algebra becomes bitwise arithmetic on those integers:
 * intersection is `&`, union is `|`, complement is `~` masked back to the
 * universe, difference is `a & ~b`.
 *
 * This module is pure and DOM-free.
 */

export const SET_COUNT = 3;
export const SET_NAMES = ['A', 'B', 'C'];
export const REGION_COUNT = 1 << SET_COUNT; // 8
export const UNIVERSE = (1 << REGION_COUNT) - 1; // 0b11111111
export const EMPTY = 0;

/**
 * Mask of set i out of n sets: regions whose index has bit i set.
 * Closed form, so the core scales to more sets without changes.
 */
export function setMask(i, n = SET_COUNT) {
  let mask = 0;
  for (let r = 0; r < 1 << n; r++) {
    if ((r >> i) & 1) mask |= 1 << r;
  }
  return mask;
}

/** Masks of the named sets, e.g. SETS.A === 0b10101010. */
export const SETS = Object.fromEntries(
  SET_NAMES.map((name, i) => [name, setMask(i)]),
);

export const intersection = (a, b) => a & b;
export const union = (a, b) => a | b;
export const difference = (a, b) => a & ~b;
export const symmetricDifference = (a, b) => a ^ b;
// `~` flips all 32 bits including the sign bit, so mask back to the universe.
export const complement = (a) => ~a & UNIVERSE;

export const equals = (a, b) => a === b;
export const isSubset = (a, b) => (a & ~b) === 0;

/** True iff region r belongs to the set described by mask. */
export const hasRegion = (mask, r) => ((mask >> r) & 1) === 1;

/** Toggle membership of region r in mask. */
export const toggleRegion = (mask, r) => mask ^ (1 << r);
