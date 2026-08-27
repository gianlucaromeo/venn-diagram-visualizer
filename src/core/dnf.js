/**
 * Canonical form: region bitmask -> disjunctive normal form.
 *
 * Every set has a canonical expression: one intersection term per region it
 * contains, OR-ed together. This is how "click regions, get an expression"
 * works. The result is canonical, not minimal.
 */

import { REGION_COUNT, UNIVERSE, EMPTY, SET_NAMES, hasRegion } from './masks.js';

/**
 * @param {number} mask Region bitmask.
 * @returns {string} A parseable expression whose value is exactly `mask`.
 */
export function maskToExpression(mask) {
  if (mask === EMPTY) return '0';
  if (mask === UNIVERSE) return 'U';

  const terms = [];
  for (let r = 0; r < REGION_COUNT; r++) {
    if (!hasRegion(mask, r)) continue;
    const literals = SET_NAMES.map((name, i) =>
      (r >> i) & 1 ? name : `${name}'`,
    );
    terms.push(literals.join(' & '));
  }
  return terms.length === 1 ? terms[0] : terms.map((t) => `(${t})`).join(' | ');
}
