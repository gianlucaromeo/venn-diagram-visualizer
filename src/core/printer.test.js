import { describe, expect, it } from 'vitest';
import { NodeType, parse } from './parser.js';
import { evaluate } from './evaluator.js';
import { print } from './printer.js';

describe('print', () => {
  const roundTrips = [
    ['A', 'A'],
    ["A''", "A''"],
    ['A|B&C', 'A | B & C'],
    ['(A|B)&C', '(A | B) & C'],
    ['A-B-C', 'A - B - C'],
    ['A-(B-C)', 'A - (B - C)'],
    ["(A|B)'", "(A | B)'"],
    ["A'&B", "A' & B"],
    ['(A-B-C)u(A&B)&C', 'A - B - C | A & B & C'],
    ['U|0', 'U | 0'],
  ];

  it.each(roundTrips)('prints %s as %s', (input, expected) => {
    expect(print(parse(input))).toBe(expected);
  });

  it('emits only the parentheses needed to preserve meaning', () => {
    for (const [input] of roundTrips) {
      expect(evaluate(parse(print(parse(input))))).toBe(evaluate(parse(input)));
    }
  });

  // Property test: any tree prints to a string that reparses to the same set.
  it('round-trips 500 random trees', () => {
    let seed = 0xc0ffee;
    const rand = (n) => {
      // xorshift32 — deterministic so failures are reproducible.
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return Math.abs(seed) % n;
    };

    const randomTree = (depth) => {
      if (depth === 0 || rand(4) === 0) {
        const atoms = [
          { type: NodeType.SET, name: 'ABC'[rand(3)] },
          { type: NodeType.UNIVERSE },
          { type: NodeType.EMPTY },
        ];
        return atoms[rand(3)];
      }
      const ops = [NodeType.UNION, NodeType.INTERSECTION, NodeType.DIFFERENCE, NodeType.COMPLEMENT];
      const type = ops[rand(4)];
      if (type === NodeType.COMPLEMENT) {
        return { type, operand: randomTree(depth - 1) };
      }
      return { type, left: randomTree(depth - 1), right: randomTree(depth - 1) };
    };

    for (let i = 0; i < 500; i++) {
      const tree = randomTree(5);
      const printed = print(tree);
      expect(evaluate(parse(printed)), `printed: ${printed}`).toBe(evaluate(tree));
    }
  });
});
