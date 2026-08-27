import { describe, expect, it } from 'vitest';
import { TokenizeError, TokenType, tokenize } from './tokenizer.js';

const types = (input) => tokenize(input).map((t) => t.type);

describe('tokenize', () => {
  it('tokenizes a representative expression', () => {
    expect(types("(A-B)' & C")).toEqual([
      TokenType.LPAREN,
      TokenType.SET,
      TokenType.MINUS,
      TokenType.SET,
      TokenType.RPAREN,
      TokenType.NOT,
      TokenType.AND,
      TokenType.SET,
      TokenType.EOF,
    ]);
  });

  it('ignores whitespace but keeps source positions', () => {
    const tokens = tokenize('  A  |  B ');
    expect(tokens.map((t) => t.type)).toEqual([
      TokenType.SET,
      TokenType.OR,
      TokenType.SET,
      TokenType.EOF,
    ]);
    expect(tokens.map((t) => t.position)).toEqual([2, 5, 8, 10]);
  });

  it('accepts aliases for every operator and constant', () => {
    for (const union of ['|', '∪', '+', 'u']) {
      expect(types(`A${union}B`)[1]).toBe(TokenType.OR);
    }
    for (const inter of ['&', '∩', '*']) {
      expect(types(`A${inter}B`)[1]).toBe(TokenType.AND);
    }
    for (const minus of ['-', '−', '\\', '∖']) {
      expect(types(`A${minus}B`)[1]).toBe(TokenType.MINUS);
    }
    for (const not of ["'", '’', '∁']) {
      expect(types(`A${not}`)[1]).toBe(TokenType.NOT);
    }
    expect(types('1')[0]).toBe(TokenType.UNIVERSE);
    expect(types('∅')[0]).toBe(TokenType.EMPTY);
  });

  it('maps lowercase set letters, but lowercase u to union', () => {
    expect(tokenize('a')[0]).toEqual({ type: TokenType.SET, value: 'A', position: 0 });
    expect(tokenize('u')[0].type).toBe(TokenType.OR);
    expect(tokenize('U')[0].type).toBe(TokenType.UNIVERSE);
  });

  it('rejects unknown characters with their position', () => {
    expect(() => tokenize('A | D')).toThrow(TokenizeError);
    try {
      tokenize('A | D');
    } catch (error) {
      expect(error.position).toBe(4);
      expect(error.message).toContain('"D"');
    }
  });

  it('produces a lone EOF for empty and whitespace-only input', () => {
    expect(types('')).toEqual([TokenType.EOF]);
    expect(types('   ')).toEqual([TokenType.EOF]);
  });
});
