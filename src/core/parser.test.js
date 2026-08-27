import { describe, expect, it } from 'vitest';
import { NodeType, ParseError, parse } from './parser.js';

// Strip positions so structural assertions stay readable.
function shape(node) {
  switch (node.type) {
    case NodeType.SET:
      return node.name;
    case NodeType.UNIVERSE:
      return 'U';
    case NodeType.EMPTY:
      return '0';
    case NodeType.COMPLEMENT:
      return { not: shape(node.operand) };
    default:
      return { [node.type]: [shape(node.left), shape(node.right)] };
  }
}

describe('parse', () => {
  it('parses atoms', () => {
    expect(shape(parse('A'))).toBe('A');
    expect(shape(parse('U'))).toBe('U');
    expect(shape(parse('0'))).toBe('0');
  });

  it('gives intersection higher precedence than union', () => {
    // The single most likely bug: A | B & C must be A | (B & C).
    expect(shape(parse('A u B & C'))).toEqual({
      union: ['A', { intersection: ['B', 'C'] }],
    });
  });

  it('treats & and - as one left-associative level', () => {
    expect(shape(parse('A - B - C'))).toEqual({
      difference: [{ difference: ['A', 'B'] }, 'C'],
    });
    expect(shape(parse('A & B - C'))).toEqual({
      difference: [{ intersection: ['A', 'B'] }, 'C'],
    });
  });

  it('binds postfix complement tighter than binary operators', () => {
    expect(shape(parse("A & B'"))).toEqual({
      intersection: ['A', { not: 'B' }],
    });
    expect(shape(parse("A''"))).toEqual({ not: { not: 'A' } });
  });

  it('applies complement to a parenthesized group', () => {
    expect(shape(parse("(A | B)'"))).toEqual({
      not: { union: ['A', 'B'] },
    });
  });

  it('parses the reference expression from the docs', () => {
    expect(shape(parse('(A-B-C)u(A&B)&C'))).toEqual({
      union: [
        { difference: [{ difference: ['A', 'B'] }, 'C'] },
        { intersection: [{ intersection: ['A', 'B'] }, 'C'] },
      ],
    });
  });

  it('supports arbitrary nesting', () => {
    expect(shape(parse("((((A))))'"))).toEqual({ not: 'A' });
  });

  const errorCases = [
    ['', 0, 'Empty expression'],
    ['   ', 0, 'Empty expression'],
    ['A |', 3, 'end of input'],
    ['| A', 0, 'found "|"'],
    ['(A | B', 6, 'Expected ")"'],
    ['A ) B', 2, 'after the expression'],
    ['A B', 2, 'after the expression'],
    ['(', 1, 'end of input'],
    ["'A", 0, 'found "\'"'],
  ];

  it.each(errorCases)('rejects %j at position %i', (input, position, fragment) => {
    expect(() => parse(input)).toThrow(ParseError);
    try {
      parse(input);
    } catch (error) {
      expect(error.position).toBe(position);
      expect(error.message).toContain(fragment);
    }
  });
});
